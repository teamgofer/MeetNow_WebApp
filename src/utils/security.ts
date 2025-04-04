import {
  createSecurityError,
  createXSSError,
  createCSRFError,
  createTokenError,
  createSQLInjectionError,
  handleError,
} from './error-handler';
import logger from './Logger';

/**
 * Security utility for MeetNow
 * Provides centralized security functions for input validation, sanitization,
 * and protection against common web vulnerabilities.
 */

// Type definitions
export interface ISecuritySettings {
  maxContentLength: number;
  maxPayloadItems: number;
  maxStringLength: number;
  forbiddenCharacters: RegExp;
  suspiciousPatterns: RegExp[];
}

export interface IValidationOptions {
  maxLength?: number;
  allowHTML?: boolean;
  allowSpecialChars?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required?: boolean;
}

interface ICSRFTokenData {
  actionId: string;
  expiry: number;
}

// CSRF token storage - tokens should be short-lived
const csrfTokens: Map<string, CSRFTokenData> = new Map();

// Token expiry time in milliseconds (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

// Security settings
const SECURITY_SETTINGS: SecuritySettings = {
  maxContentLength: 1024 * 1024, // 1MB max content size
  maxPayloadItems: 100, // Maximum number of items in arrays/objects
  maxStringLength: 5000, // Maximum length for string inputs
  forbiddenCharacters: /[<>{}[\]\\^|]/g, // Characters that should be rejected
  suspiciousPatterns: [
    /((\%3C)|<)[^\n]+((\%3E)|>)/i, // HTML tags
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /vbscript:/i, // VBScript protocol
    /on\w+\s*=/i, // Event handlers
    /src\s*=/i, // src attribute
    /eval\s*\(/i, // eval function
    /expression\s*\(/i, // expression function
    /union\s+select/i, // SQL injection
    /insert\s+into/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /update\s+\w+\s+set/i, // SQL injection
    /delete\s+from/i, // SQL injection
    /alert\s*\(/i, // JavaScript alerts
    /\/etc\/passwd/i, // Path traversal
    /\.\.\/\.\.\//, // Path traversal
    /\/\/www\./i, // Potential URLs in content
  ],
};

/**
 * Validates and sanitizes input data to prevent security vulnerabilities
 */
export const validateInput = (input: unknown, options: ValidationOptions = {}): unknown => {
  const {
    maxLength = SECURITY_SETTINGS.maxStringLength,
    allowHTML = false,
    allowSpecialChars = true,
    type = 'any',
    required = false,
  } = options;

  // Handle null/undefined
  if (input === null ?? input === undefined) {
    if (required) {
      throw createSecurityError('Required input is missing');
    }
    return input;
  }

  // Type validation
  if (type !== 'any') {
    const inputType = typeof input;
    if (type === 'array' && !Array.isArray(input)) {
      throw createSecurityError(`Input must be an array, got ${inputType}`);
    } else if (type !== 'array' && inputType !== type) {
      throw createSecurityError(`Input must be of type ${type}, got ${inputType}`);
    }
  }

  // For arrays, validate each item recursively
  if (Array.isArray(input)) {
    if (input.length > SECURITY_SETTINGS.maxPayloadItems) {
      throw createSecurityError(
        `Input array exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} items`
      );
    }
    return input.map(item => validateInput(item, options));
  }

  // For objects, validate each property recursively
  if (typeof input === 'object' && input !== null) {
    if (Object.keys(input).length > SECURITY_SETTINGS.maxPayloadItems) {
      throw createSecurityError(
        `Input object exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} properties`
      );
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize the key as well
      const sanitizedKey = typeof key === 'string' ? sanitizeString(key) : key;
      sanitized[sanitizedKey] = validateInput(value, options);
    }
    return sanitized;
  }

  // For strings, apply length and content validations
  if (typeof input === 'string') {
    // Check length
    if (input.length > maxLength) {
      throw createSecurityError(`Input string exceeds maximum length of ${maxLength} characters`);
    }

    // Check for suspicious patterns
    if (!allowHTML) {
      for (const pattern of SECURITY_SETTINGS.suspiciousPatterns) {
        if (pattern.test(input)) {
          const error = createXSSError('Potentially malicious content detected in input');
          logger.warn('Security', 'Suspicious pattern detected in input', {
            pattern: pattern.toString(),
            sample: input.slice(0, 100),
          });
          handleError(error);
          return sanitizeString(input);
        }
      }
    }

    // Return sanitized string
    return allowHTML ? input : sanitizeString(input);
  }

  // For numbers and booleans, return as is
  return input;
};

/**
 * Sanitizes a string to prevent XSS and other injection attacks
 */
export const sanitizeString = (input: unknown): string => {
  if (!input ?? typeof input !== 'string') return String(input);

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates input to prevent SQL injection attacks
 */
export const sanitizeForDatabase = (input: unknown): string => {
  if (!input ?? typeof input !== 'string') return String(input);

  // Check for common SQL injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /insert\s+into/i,
    /update\s+\w+\s+set/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /alter\s+table/i,
    /exec\s*\(/i,
    /execute\s*\(/i,
    /--/,
    /;/,
    /\/\*/,
    /\*\//,
    /xp_/,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      const error = createSQLInjectionError('Potential SQL injection attempt detected');
      logger.warn('Security', 'SQL injection attempt detected', {
        pattern: pattern.toString(),
        sample: input.slice(0, 100),
      });
      handleError(error);
      return '';
    }
  }

  // Remove all SQL control characters
  return input.replace(/['";\\]/g, '');
};

/**
 * Generates a secure CSRF token
 */
export const generateCSRFToken = (actionId: string): string => {
  try {
    // Generate cryptographically strong random token
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    // Store with expiry
    const expiry = Date.now() + TOKEN_EXPIRY;
    csrfTokens.set(token, { actionId, expiry });

    // Schedule cleanup for this token
    setTimeout(() => {
      csrfTokens.delete(token);
    }, TOKEN_EXPIRY);

    return token;
  } catch (error) {
    logger.error('Security', 'Failed to generate CSRF token', String(error));
    throw createCSRFError('Failed to generate secure token');
  }
};

/**
 * Validates a CSRF token
 */
export const validateCSRFToken = (token: string, actionId: string): boolean => {
  if (!token ?? (typeof token !== 'string' || token.length < 32)) {
    logger.warn('Security', 'Invalid CSRF token format');
    return false;
  }

  const tokenData = csrfTokens.get(token);
  if (!tokenData) {
    logger.warn('Security', 'CSRF token not found');
    return false;
  }

  if (tokenData.expiry < Date.now()) {
    // Token expired, clean up
    csrfTokens.delete(token);
    logger.warn('Security', 'CSRF token expired');
    return false;
  }

  if (tokenData.actionId !== actionId) {
    logger.warn('Security', 'CSRF token action mismatch', {
      expected: actionId,
      actual: tokenData.actionId,
    });
    return false;
  }

  // Token used successfully, delete it to prevent reuse
  csrfTokens.delete(token);
  return true;
};

/**
 * Validates the security of an authentication token
 */
export const validateAuthToken = (token: string): boolean => {
  try {
    if (!token ?? typeof token !== 'string') {
      logger.warn('Security', 'Invalid JWT format');
      return false;
    }

    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Security', 'Invalid JWT format');
      return false;
    }

    // Decode payload
    try {
      const payload = JSON.parse(atob(parts[1]));

      // Check token expiry
      if (payload.exp && payload.exp < Date.now() / 1000) {
        logger.warn('Security', 'Token expired');
        return false;
      }

      return true;
    } catch (e) {
      logger.error('Security', 'Error parsing JWT payload', String(e));
      return false;
    }
  } catch (error) {
    logger.error('Security', 'Error validating auth token', String(error));
    return false;
  }
};

/**
 * Securely stores sensitive data
 */
export const secureStoreData = (key: string, data: unknown): boolean => {
  try {
    // Validate input
    if (!key ?? typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    // Convert data to string if needed
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Use secure storage when available
    if (window.localStorage) {
      window.localStorage.setItem(key, dataString);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Security', 'Error storing secure data', String(error));
    return false;
  }
};

/**
 * Securely retrieves stored data
 */
export const secureRetrieveData = (key: string): string | null => {
  try {
    if (!key ?? typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    if (window.localStorage) {
      return window.localStorage.getItem(key);
    }

    return null;
  } catch (error) {
    logger.error('Security', 'Error retrieving secure data', String(error));
    return null;
  }
};

/**
 * Checks if the current environment is secure
 */
export const isSecureEnvironment = (): boolean => {
  return (
    window.isSecureContext &&
    window.location.protocol === 'https:' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
};

export interface IUser {
  id: string;
  [key: string]: unknown;
}

export interface IResource {
  user_id: string;
  id: string;
  [key: string]: unknown;
}

/**
 * Validates if a user has permission to perform an action on a resource
 */
export const validatePermission = (
  user: User | null,
  action: string,
  resource: Resource | null
): boolean => {
  if (!user?.id) {
    logger.warn('Security', 'Permission check failed - user not authenticated');
    return false;
  }

  // Resource owner check
  if (resource && resource.user_id === user.id) {
    return true;
  }

  // Add additional permission checks here as needed
  // For example, role-based access control, group permissions, etc.

  // Permission denied
  logger.warn('Security', 'Permission denied', {
    userId: user.id,
    action,
    resourceId: resource?.id,
  });
  return false;
};
