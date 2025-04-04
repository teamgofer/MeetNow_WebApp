import { createCSRFError, createSecurityError, handleError } from './error-handler';
import logger from './Logger';
import { validateCSRFToken, isSecureEnvironment } from './security';

/**
 * Security Middleware for API routes and React components
 * Provides functions to enhance security of API routes and frontend components
 */

// Type definitions
export interface ISecurityHeaders {
  [key: string]: string;
}

export interface IUser {
  id: string;
  [key: string]: unknown;
}

export interface IResource {
  user_id: string;
  [key: string]: unknown;
}

export interface IRequest {
  method: string;
  path: string;
  headers: {
    [key: string]: string | undefined;
    'x-csrf-token'?: string;
    'x-action-id'?: string;
    'content-type'?: string;
  };
  query: {
    [key: string]: string | string[] | undefined;
  };
  body: unknown;
  ip: string;
}

export interface IResponse {
  set: (header: string, value: string) => void;
  status: (code: number) => Response;
  json: (data: unknown) => void;
}

export type TNextFunction = (error?: Error) => void;

export type TApiHandler = (req: Request, res: Response) => Promise<void>;

// Security headers to apply to responses
const SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(self), accelerometer=(), gyroscope=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Apply security headers to API responses
 */
export const applySecurityHeaders = (res: Response): void => {
  if (!res ?? typeof res.set !== 'function') {
    logger.warn('Security', 'Cannot apply security headers - invalid response object');
    return;
  }

  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    res.set(header, value);
  });
};

/**
 * Create a secure API route handler with common security checks
 */
export const secureApiRoute = (handler: ApiHandler): ApiHandler => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      // Apply security headers
      applySecurityHeaders(res);

      // Check for secure connection in production
      if (process.env.NODE_ENV === 'production' && !isSecureEnvironment()) {
        logger.error('Security', 'Attempted API access over insecure connection');
        res.status(403).json({
          error: 'Secure connection required',
        });
        return;
      }

      // Check for CSRF token when needed for non-GET requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'];
        const actionId = req.headers['x-action-id'] ?? req.path;

        if (!csrfToken ?? !validateCSRFToken(csrfToken, actionId)) {
          logger.error('Security', 'CSRF validation failed', {
            path: req.path,
            method: req.method,
            ip: req.ip,
          });

          res.status(403).json({
            error: 'Access denied: Invalid security token',
          });
          return;
        }
      }

      // Rate limiting - if implementation is desired in the future, add it here
      // We're currently using client-side rate limiting in auth.js, not Supabase anon key

      // Execute the handler
      await handler(req, res);
    } catch (error) {
      // Handle errors
      logger.error('Security', 'API route error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.path,
        method: req.method,
      });

      handleError(error);

      // Send appropriate error response
      const statusCode =
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
      res.status(statusCode).json({
        error:
          process.env.NODE_ENV === 'production'
            ? 'An error occurred processing your request'
            : error instanceof Error
              ? error.message
              : String(error),
      });
    }
  };
};

/**
 * React hook for protecting routes that require authentication
 */
export const useProtectedRoute = (
  user: User | null,
  navigate: ((path: string, options?: { state: { from: string; message: string } }) => void) | null,
  redirectTo = '/login'
): boolean => {
  if (!user) {
    // If no user, redirect to login
    if (navigate && typeof navigate === 'function') {
      logger.debug('Security', 'Redirecting unauthenticated user from protected route');
      navigate(redirectTo, {
        state: { from: window.location.pathname, message: 'Please log in to access this page' },
      });
    }
    return false;
  }

  return true;
};

/**
 * React hook for checking permissions
 */
export const usePermissionCheck = (
  user: User | null,
  _permission: string, // Prefix with _ to indicate intentionally unused
  resource: Resource | null
): boolean => {
  if (!user?.id) {
    return false;
  }

  // Check if user is owner of resource
  if (resource && resource.user_id === user.id) {
    return true;
  }

  // More complex permission checks could be added here
  // Including role-based checks, etc.

  // Default deny
  return false;
};

/**
 * Helper to generate a security nonce for inline scripts
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Middleware to sanitize request parameters
 */
export const sanitizeRequestParams = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];
        if (typeof value === 'string') {
          // Check for SQL injection attempts
          const suspicious =
            /(['";]|--|\b(select|insert|update|delete|drop|alter|create|exec)\b)/i.test(value);
          if (suspicious) {
            logger.warn('Security', 'Suspicious query parameter detected', {
              key,
              value,
              ip: req.ip,
            });
            req.query[key] = '';
          }
        }
      });
    }

    // Sanitize request body for JSON requests
    if (req.body && req.headers['content-type']?.includes('application/json')) {
      const sanitizeObject = (obj: Record<string, unknown>): void => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (typeof value === 'string') {
            // Check for suspicious patterns
            const suspicious =
              /(['";]|--|\b(select|insert|update|delete|drop|alter|create|exec)\b)/i.test(value);
            if (suspicious) {
              logger.warn('Security', 'Suspicious body parameter detected', {
                key,
                value: value.substring(0, 50), // Log only part to avoid credential leaks
                ip: req.ip,
              });
              obj[key] = '';
            }
          } else if (typeof value === 'object' && value !== null) {
            sanitizeObject(value as Record<string, unknown>);
          }
        });
      };

      sanitizeObject(req.body as Record<string, unknown>);
    }

    next();
  } catch (error) {
    logger.error('Security', 'Error in sanitize request middleware', String(error));
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

// Export security headers for use in other modules
export const securityHeaders = SECURITY_HEADERS;
