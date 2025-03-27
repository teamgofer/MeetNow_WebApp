import logger from './Logger';
import { validateCSRFToken, isSecureEnvironment } from './security';
import { createCSRFError, createSecurityError, handleError } from './error-handler';

/**
 * Security Middleware for API routes and React components
 * Provides functions to enhance security of API routes and frontend components
 */

// Security headers to apply to responses
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), accelerometer=(), gyroscope=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
};

/**
 * Apply security headers to API responses
 * @param {Object} res - Express response object
 */
export const applySecurityHeaders = (res) => {
  if (!res || typeof res.set !== 'function') {
    logger.warn('Security: Cannot apply security headers - invalid response object');
    return;
  }
  
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    res.set(header, value);
  });
};

/**
 * Create a secure API route handler with common security checks
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Enhanced handler with security checks
 */
export const secureApiRoute = (handler) => {
  return async (req, res) => {
    try {
      // Apply security headers
      applySecurityHeaders(res);
      
      // Check for secure connection in production
      if (process.env.NODE_ENV === 'production' && !isSecureEnvironment()) {
        logger.error('Security: Attempted API access over insecure connection');
        return res.status(403).json({
          error: 'Secure connection required'
        });
      }
      
      // Check for CSRF token when needed for non-GET requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'];
        const actionId = req.headers['x-action-id'] || req.path;
        
        if (!validateCSRFToken(csrfToken, actionId)) {
          const error = createCSRFError('Invalid or missing CSRF token');
          logger.error('Security: CSRF validation failed', {
            path: req.path,
            method: req.method,
            ip: req.ip,
          });
          
          return res.status(403).json({
            error: 'Access denied: Invalid security token'
          });
        }
      }
      
      // Rate limiting - if implementation is desired in the future, add it here
      // We're currently using client-side rate limiting in auth.js, not Supabase anon key
      
      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      // Handle errors
      logger.error('API route error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });
      
      handleError(error);
      
      // Send appropriate error response
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'An error occurred processing your request' 
          : error.message
      });
    }
  };
};

/**
 * React hook for protecting routes that require authentication
 * @param {Object} user - The current user object
 * @param {Function} navigate - React Router's navigate function
 * @param {string} redirectTo - Path to redirect unauthenticated users
 * @returns {boolean} - Whether the route is accessible
 */
export const useProtectedRoute = (user, navigate, redirectTo = '/login') => {
  if (!user) {
    // If no user, redirect to login
    if (navigate && typeof navigate === 'function') {
      logger.debug('Security: Redirecting unauthenticated user from protected route');
      navigate(redirectTo, { 
        state: { from: window.location.pathname, message: 'Please log in to access this page' } 
      });
    }
    return false;
  }
  
  return true;
};

/**
 * React hook for checking permissions 
 * @param {Object} user - The current user object
 * @param {string} permission - The required permission
 * @param {Object} resource - The resource being accessed
 * @returns {boolean} - Whether the user has permission
 */
export const usePermissionCheck = (user, permission, resource) => {
  if (!user || !user.id) {
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
 * @returns {string} - A random nonce value
 */
export const generateNonce = () => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Middleware to sanitize request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const sanitizeRequestParams = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          // Check for SQL injection attempts
          const suspicious = /(['";]|--|\b(select|insert|update|delete|drop|alter|create|exec)\b)/i.test(req.query[key]);
          if (suspicious) {
            logger.warn('Security: Suspicious query parameter detected', {
              key,
              value: req.query[key],
              ip: req.ip
            });
            req.query[key] = '';
          }
        }
      });
    }
    
    // Sanitize request body for JSON requests
    if (req.body && req.headers['content-type']?.includes('application/json')) {
      const sanitizeObject = (obj) => {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string') {
            // Check for suspicious patterns
            const suspicious = /(['";]|--|\b(select|insert|update|delete|drop|alter|create|exec)\b)/i.test(obj[key]);
            if (suspicious) {
              logger.warn('Security: Suspicious body parameter detected', {
                key,
                value: obj[key].substring(0, 50), // Log only part to avoid credential leaks
                ip: req.ip
              });
              obj[key] = '';
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        });
      };
      
      sanitizeObject(req.body);
    }
    
    next();
  } catch (error) {
    logger.error('Error in sanitize request middleware:', error);
    next(error);
  }
};

// Export security headers for use in other modules
export const securityHeaders = SECURITY_HEADERS; 