import { ErrorHandlingService } from './ErrorHandlingService';

/**
 * Error types for consistent error categorization
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  VALIDATION: 'VALIDATION',
  GEOLOCATION: 'GEOLOCATION',
  STORAGE: 'STORAGE',
  RATE_LIMIT: 'RATE_LIMIT',
  SECURITY: 'SECURITY',
  TOKEN: 'TOKEN',
  CSRF: 'CSRF',
  XSS: 'XSS',
  SQL_INJECTION: 'SQL_INJECTION',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INSECURE_TRANSMISSION: 'INSECURE_TRANSMISSION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Helper function to create a standardized error object
 */
export const createError = (type, message, severity = ErrorSeverity.ERROR, context = {}) => {
  return {
    type,
    message,
    severity,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    }
  };
};

/**
 * Helper function to determine error type from an error object
 */
export const determineErrorType = (error) => {
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return ErrorTypes.NETWORK;
  }
  
  if (error.name === 'AuthError' || error.message?.includes('auth')) {
    return ErrorTypes.AUTHENTICATION;
  }
  
  if (error.name === 'PermissionError' || error.message?.includes('permission')) {
    return ErrorTypes.PERMISSION;
  }
  
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }
  
  if (error.name === 'GeolocationError' || error.message?.includes('geolocation')) {
    return ErrorTypes.GEOLOCATION;
  }
  
  if (error.name === 'StorageError' || error.message?.includes('storage')) {
    return ErrorTypes.STORAGE;
  }
  
  if (error.message?.includes('rate limit')) {
    return ErrorTypes.RATE_LIMIT;
  }
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Helper function to determine error severity based on error type and context
 */
export const determineErrorSeverity = (type, context = {}) => {
  switch (type) {
    case ErrorTypes.NETWORK:
      return context.isOffline ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR;
    case ErrorTypes.AUTHENTICATION:
      return ErrorSeverity.CRITICAL;
    case ErrorTypes.PERMISSION:
      return ErrorSeverity.ERROR;
    case ErrorTypes.VALIDATION:
      return ErrorSeverity.WARNING;
    case ErrorTypes.GEOLOCATION:
      return context.isRequired ? ErrorSeverity.ERROR : ErrorSeverity.WARNING;
    case ErrorTypes.STORAGE:
      return context.isCritical ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR;
    case ErrorTypes.RATE_LIMIT:
      return ErrorSeverity.WARNING;
    default:
      return ErrorSeverity.ERROR;
  }
};

/**
 * Helper function to handle errors with the ErrorHandlingService
 */
export const handleError = (error, context = {}) => {
  const type = determineErrorType(error);
  const severity = determineErrorSeverity(type, context);
  
  const standardizedError = createError(
    type,
    error.message || 'An unexpected error occurred',
    severity,
    context
  );
  
  ErrorHandlingService.handleError(standardizedError);
  return standardizedError;
};

/**
 * Helper function to handle API errors
 */
export const handleApiError = (error, context = {}) => {
  const apiContext = {
    ...context,
    isApiError: true,
    statusCode: error.status,
    endpoint: error.endpoint
  };
  
  return handleError(error, apiContext);
};

/**
 * Helper function to handle validation errors
 */
export const handleValidationError = (errors, context = {}) => {
  const validationContext = {
    ...context,
    isValidationError: true,
    fieldErrors: errors
  };
  
  return handleError(
    new Error('Validation failed'),
    validationContext
  );
};

/**
 * Helper function to handle network errors
 */
export const handleNetworkError = (error, context = {}) => {
  const networkContext = {
    ...context,
    isNetworkError: true,
    isOffline: !navigator.onLine
  };
  
  return handleError(error, networkContext);
};

/**
 * Helper function to handle authentication errors
 */
export const handleAuthError = async (error, context = {}) => {
  // Check if this is a known security error type
  if (isSecurityError(error)) {
    // Create a full security error with context
    const securityError = createSecurityError(
      error.message || 'Security error occurred',
      { 
        originalError: error,
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    );
    
    // Log security errors with high priority and potentially report to security monitoring systems
    logger.error('SECURITY ALERT: Authentication security error', securityError);
    
    // If we have a remote logging service for security incidents, send there
    try {
      // This could be a call to a security monitoring service
      // await securityMonitoringService.reportIncident(securityError);
    } catch (reportingError) {
      logger.error('Failed to report security incident', reportingError);
    }
    
    return handleError(securityError);
  }
  
  // Handle regular auth errors
  const authError = createAuthError(
    error.message || 'Authentication error occurred',
    { originalError: error, ...context }
  );
  
  return handleError(authError);
};

/**
 * Helper function to handle geolocation errors
 */
export const handleGeolocationError = (error, context = {}) => {
  const geoContext = {
    ...context,
    isGeolocationError: true,
    isRequired: context.isRequired || false
  };
  
  return handleError(error, geoContext);
};

/**
 * Helper function to handle storage errors
 */
export const handleStorageError = (error, context = {}) => {
  const storageContext = {
    ...context,
    isStorageError: true,
    isCritical: context.isCritical || false
  };
  
  return handleError(error, storageContext);
};

/**
 * Helper function to handle rate limit errors
 */
export const handleRateLimitError = (error, context = {}) => {
  const rateLimitContext = {
    ...context,
    isRateLimitError: true,
    retryAfter: error.retryAfter
  };
  
  return handleError(error, rateLimitContext);
};

/**
 * Create a validation error
 * @param {string} message - Validation error message
 * @param {Object} context - Additional context
 * @returns {Error} - Validation error
 */
export const createValidationError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.VALIDATION;
  error.context = context;
  return error;
};

/**
 * Create a network error
 * @param {string} message - Network error message
 * @param {Object} context - Additional context
 * @returns {Error} - Network error
 */
export const createNetworkError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.NETWORK;
  error.context = context;
  return error;
};

/**
 * Create an authentication error
 * @param {string} message - Authentication error message
 * @param {Object} context - Additional context
 * @returns {Error} - Authentication error
 */
export const createAuthError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.AUTHENTICATION;
  error.context = context;
  return error;
};

/**
 * Create a permission error
 * @param {string} message - Permission error message
 * @param {Object} context - Additional context
 * @returns {Error} - Permission error
 */
export const createPermissionError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.PERMISSION;
  error.context = context;
  return error;
};

/**
 * Create a geolocation error
 * @param {string} message - Geolocation error message
 * @param {Object} context - Additional context
 * @returns {Error} - Geolocation error
 */
export const createGeolocationError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.GEOLOCATION;
  error.context = context;
  return error;
};

/**
 * Create a storage error
 * @param {string} message - Storage error message
 * @param {Object} context - Additional context
 * @returns {Error} - Storage error
 */
export const createStorageError = (message, context = {}) => {
  const error = new Error(message);
  error.type = ErrorTypes.STORAGE;
  error.context = context;
  return error;
};

/**
 * Create more specific security errors
 */
export const createSecurityError = (message, context = {}) => {
  return createError(message, ErrorTypes.SECURITY, ErrorSeverity.CRITICAL, context);
};

export const createTokenError = (message, context = {}) => {
  return createError(message, ErrorTypes.TOKEN, ErrorSeverity.CRITICAL, context);
};

export const createCSRFError = (message, context = {}) => {
  return createError(message, ErrorTypes.CSRF, ErrorSeverity.CRITICAL, context);
};

export const createXSSError = (message, context = {}) => {
  return createError(message, ErrorTypes.XSS, ErrorSeverity.CRITICAL, context);
};

export const createSQLInjectionError = (message, context = {}) => {
  return createError(message, ErrorTypes.SQL_INJECTION, ErrorSeverity.CRITICAL, context);
};

export const createUnauthorizedAccessError = (message, context = {}) => {
  return createError(message, ErrorTypes.UNAUTHORIZED_ACCESS, ErrorSeverity.CRITICAL, context);
};

export const createInsecureTransmissionError = (message, context = {}) => {
  return createError(message, ErrorTypes.INSECURE_TRANSMISSION, ErrorSeverity.CRITICAL, context);
};

/**
 * Get error statistics
 * @returns {Object} Error statistics
 */
export const getErrorStats = () => {
  return ErrorHandlingService.getErrorStats();
};

/**
 * Clear error history
 */
export const clearErrorHistory = () => {
  ErrorHandlingService.clearErrorHistory();
};

/**
 * Register an error handler
 * @param {Function} handler - Error handler function
 * @returns {Function} - Function to remove the handler
 */
export const onError = (handler) => {
  return ErrorHandlingService.onError(handler);
};

/**
 * Register a recovery handler
 * @param {Function} handler - Recovery handler function
 * @returns {Function} - Function to remove the handler
 */
export const onRecovery = (handler) => {
  return ErrorHandlingService.onRecovery(handler);
};

/**
 * Function to determine if an error is security-related
 */
export const isSecurityError = (error) => {
  if (!error) return false;
  
  // Check the error type directly
  if (error.type && [
    ErrorTypes.SECURITY,
    ErrorTypes.TOKEN,
    ErrorTypes.CSRF,
    ErrorTypes.XSS,
    ErrorTypes.SQL_INJECTION,
    ErrorTypes.UNAUTHORIZED_ACCESS,
    ErrorTypes.INSECURE_TRANSMISSION
  ].includes(error.type)) {
    return true;
  }
  
  // Check error message for security keywords
  if (error.message && typeof error.message === 'string') {
    const securityKeywords = [
      'csrf', 'xss', 'injection', 'token', 'invalid auth', 'expired token', 
      'unauthorized', 'forbidden', 'permission denied', 'access denied',
      'invalid signature', 'invalid jwt', 'security', 'attack'
    ];
    
    return securityKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }
  
  return false;
}; 