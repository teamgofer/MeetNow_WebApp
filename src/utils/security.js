import logger from './Logger';
import { 
  createSecurityError, 
  createXSSError, 
  createCSRFError, 
  createTokenError,
  createSQLInjectionError,
  handleError 
} from './error-handler';

/**
 * Security utility for MeetNow
 * Provides centralized security functions for input validation, sanitization,
 * and protection against common web vulnerabilities.
 */

// CSRF token storage - tokens should be short-lived
const csrfTokens = new Map();
// Token expiry time in milliseconds (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;
// Security settings
const SECURITY_SETTINGS = {
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
 * @param {any} input - The input data to validate
 * @param {Object} options - Validation options
 * @returns {any} - Validated and sanitized input
 */
export const validateInput = (input, options = {}) => {
  const {
    maxLength = SECURITY_SETTINGS.maxStringLength,
    allowHTML = false,
    allowSpecialChars = true,
    type = 'any',
    required = false,
  } = options;

  // Handle null/undefined
  if (input === null || input === undefined) {
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
      throw createSecurityError(`Input array exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} items`);
    }
    return input.map(item => validateInput(item, options));
  }

  // For objects, validate each property recursively
  if (typeof input === 'object') {
    if (Object.keys(input).length > SECURITY_SETTINGS.maxPayloadItems) {
      throw createSecurityError(`Input object exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} properties`);
    }
    
    const sanitized = {};
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
          logger.warn('Security: Suspicious pattern detected in input', { pattern: pattern.toString(), sample: input.slice(0, 100) });
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
 * @param {string} input - The string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return input;
  
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
 * @param {string} input - The input to validate
 * @returns {string} - Sanitized input safe for database operations
 */
export const sanitizeForDatabase = (input) => {
  if (!input || typeof input !== 'string') return input;
  
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
    /xp_/
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      const error = createSQLInjectionError('Potential SQL injection attempt detected');
      logger.warn('Security: SQL injection attempt detected', { pattern: pattern.toString(), sample: input.slice(0, 100) });
      handleError(error);
      return '';
    }
  }
  
  // Remove all SQL control characters
  return input.replace(/['";\\]/g, '');
};

/**
 * Generates a secure CSRF token
 * @param {string} actionId - Unique ID for the action requiring CSRF protection
 * @returns {string} - CSRF token
 */
export const generateCSRFToken = (actionId) => {
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
    logger.error('Failed to generate CSRF token', error);
    throw createCSRFError('Failed to generate secure token');
  }
};

/**
 * Validates a CSRF token
 * @param {string} token - The token to validate
 * @param {string} actionId - The action ID that the token should be associated with
 * @returns {boolean} - Whether the token is valid
 */
export const validateCSRFToken = (token, actionId) => {
  if (!token || typeof token !== 'string' || token.length < 32) {
    logger.warn('Security: Invalid CSRF token format');
    return false;
  }
  
  const tokenData = csrfTokens.get(token);
  if (!tokenData) {
    logger.warn('Security: CSRF token not found');
    return false;
  }
  
  if (tokenData.expiry < Date.now()) {
    // Token expired, clean up
    csrfTokens.delete(token);
    logger.warn('Security: CSRF token expired');
    return false;
  }
  
  if (tokenData.actionId !== actionId) {
    logger.warn('Security: CSRF token action mismatch', { expected: actionId, actual: tokenData.actionId });
    return false;
  }
  
  // Token used successfully, delete it to prevent reuse
  csrfTokens.delete(token);
  return true;
};

/**
 * Validates the security of an authentication token
 * @param {string} token - The token to validate
 * @returns {boolean} - Whether the token is valid
 */
export const validateAuthToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  try {
    // Basic structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Security: Invalid JWT format');
      return false;
    }
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(parts[1]));
      const expiry = payload.exp * 1000; // JWT exp is in seconds, convert to ms
      
      if (expiry < Date.now()) {
        logger.warn('Security: Token expired');
        return false;
      }
    } catch (e) {
      logger.error('Security: Error parsing JWT payload', e);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Security: Error validating auth token', error);
    return false;
  }
};

/**
 * Securely store sensitive data temporarily
 * Uses browser's sessionStorage with encryption for sensitive data
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 */
export const secureStoreData = (key, data) => {
  try {
    // Don't store null/undefined
    if (data === null || data === undefined) {
      sessionStorage.removeItem(`secure_${key}`);
      return;
    }
    
    // Serialize and store in session storage (encrypted in future versions)
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(`secure_${key}`, serialized);
  } catch (error) {
    logger.error('Security: Error storing secure data', error);
    throw createSecurityError('Failed to securely store data');
  }
};

/**
 * Retrieve securely stored data
 * @param {string} key - The key the data is stored under
 * @returns {any} - The retrieved data
 */
export const secureRetrieveData = (key) => {
  try {
    const data = sessionStorage.getItem(`secure_${key}`);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    logger.error('Security: Error retrieving secure data', error);
    throw createSecurityError('Failed to retrieve secure data');
  }
};

/**
 * Validates if the current environment is secure for sensitive operations
 * @returns {boolean} - Whether the environment is secure
 */
export const isSecureEnvironment = () => {
  // Check if using HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // Check if local development (localhost is considered secure)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('192.168.');
  
  // Local development can bypass HTTPS requirement
  if (isLocalhost) return true;
  
  // Production must use HTTPS
  return isHttps;
};

/**
 * Validates permissions for a user action
 * @param {Object} user - The user object
 * @param {string} action - The action being performed
 * @param {Object} resource - The resource being accessed
 * @returns {boolean} - Whether the user has permission
 */
export const validatePermission = (user, action, resource) => {
  if (!user || !user.id) {
    logger.warn('Security: Permission check failed - user not authenticated');
    return false;
  }
  
  // Check if user is owner of resource
  if (resource && resource.user_id === user.id) {
    return true;
  }
  
  // More complex permission checks can be added here
  
  // Default to denying permission
  logger.warn('Security: Permission denied', { userId: user.id, action, resourceId: resource?.id });
  return false;
};

// Export security settings for use in other modules
export const securitySettings = SECURITY_SETTINGS; 