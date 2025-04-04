import errorHandlingService from './ErrorHandlingService';
import logger from './Logger';
import { ErrorTypes, ErrorSeverity, IErrorContext, IStandardizedError } from './error-types';

/**
 * Helper function to create a standardized error object
 */
export const createError = (
  type: ErrorTypes,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context: IErrorContext = {}
): IStandardizedError => {
  const stack = new Error().stack;
  return {
    type,
    message,
    severity,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      stack: stack ?? undefined,
    },
  };
};

// Re-export the types for convenience
export { ErrorTypes, ErrorSeverity };
export type { IErrorContext, IStandardizedError };

/**
 * Helper function to determine error type from an error object
 */
export const determineErrorType = (error: Error): ErrorTypes => {
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return ErrorTypes.NETWORK;
  }

  if (error.name === 'AuthError' || error.message.includes('auth')) {
    return ErrorTypes.AUTHENTICATION;
  }

  if (error.name === 'PermissionError' || error.message.includes('permission')) {
    return ErrorTypes.PERMISSION;
  }

  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }

  if (error.name === 'GeolocationError' || error.message.includes('geolocation')) {
    return ErrorTypes.GEOLOCATION;
  }

  if (error.name === 'StorageError' || error.message.includes('storage')) {
    return ErrorTypes.STORAGE;
  }

  if (error.message.includes('rate limit')) {
    return ErrorTypes.RATE_LIMIT;
  }

  return ErrorTypes.UNKNOWN;
};

/**
 * Helper function to determine error severity based on error type and context
 */
export const determineErrorSeverity = (
  type: ErrorTypes,
  context: IErrorContext = {}
): ErrorSeverity => {
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
export const handleError = (error: Error, context: IErrorContext = {}): IStandardizedError => {
  const type = determineErrorType(error);
  const severity = determineErrorSeverity(type, context);

  const standardizedError = createError(
    type,
    error.message ?? 'An unexpected error occurred',
    severity,
    context
  );

  errorHandlingService.handleError(standardizedError);
  return standardizedError;
};

/**
 * Helper function to handle API errors
 */
export const handleApiError = (
  error: Error & { status?: number; endpoint?: string },
  context: IErrorContext = {}
): IStandardizedError => {
  const apiContext: IErrorContext = {
    ...context,
    isApiError: true,
    statusCode: error.status ?? undefined,
    endpoint: error.endpoint ?? undefined,
  };

  return handleError(error, apiContext);
};

/**
 * Helper function to handle validation errors
 */
export const handleValidationError = (
  errors: Record<string, string[]>,
  context: IErrorContext = {}
): IStandardizedError => {
  const validationContext: IErrorContext = {
    ...context,
    isValidationError: true,
    fieldErrors: errors,
  };

  return handleError(new Error('Validation failed'), validationContext);
};

/**
 * Helper function to handle network errors
 */
export const handleNetworkError = (
  error: Error,
  context: IErrorContext = {}
): IStandardizedError => {
  const networkContext: IErrorContext = {
    ...context,
    isNetworkError: true,
    isOffline: !navigator.onLine,
  };

  return handleError(error, networkContext);
};

/**
 * Helper function to handle authentication errors
 */
export const handleAuthError = async (
  error: Error,
  context: IErrorContext = {}
): Promise<IStandardizedError> => {
  // Check if this is a known security error type
  if (isSecurityError(error)) {
    const securityContext: IErrorContext = {
      ...context,
      isSecurityError: true,
    };
    return handleError(error, securityContext);
  }

  return handleError(error, context);
};

/**
 * Helper function to handle geolocation errors
 */
export const handleGeolocationError = (
  error: Error,
  context: IErrorContext = {}
): IStandardizedError => {
  const geoContext: IErrorContext = {
    ...context,
    isGeolocationError: true,
  };

  return handleError(error, geoContext);
};

/**
 * Helper function to handle storage errors
 */
export const handleStorageError = (
  error: Error,
  context: IErrorContext = {}
): IStandardizedError => {
  const storageContext: IErrorContext = {
    ...context,
    isStorageError: true,
  };

  return handleError(error, storageContext);
};

/**
 * Helper function to handle rate limit errors
 */
export const handleRateLimitError = (
  error: Error & { retryAfter?: number },
  context: IErrorContext = {}
): IStandardizedError => {
  const rateLimitContext: IErrorContext = {
    ...context,
    isRateLimitError: true,
    retryAfter: error.retryAfter ?? undefined,
  };

  return handleError(error, rateLimitContext);
};

/**
 * Helper function to create a security error
 */
export const createSecurityError = (message: string, context: IErrorContext = {}): Error => {
  const error = new Error(message);
  error.name = 'SecurityError';
  return error;
};

/**
 * Helper function to create an authentication error
 */
export const createAuthError = (message: string, context: IErrorContext = {}): Error => {
  const error = new Error(message);
  error.name = 'AuthError';
  return error;
};

/**
 * Helper function to create a storage error
 */
export const createStorageError = (message: string, context: IErrorContext = {}): Error => {
  const error = new Error(message);
  error.name = 'StorageError';
  return error;
};

/**
 * Helper function to create a geolocation error
 */
export const createGeolocationError = (message: string, context: IErrorContext = {}): Error => {
  const error = new Error(message);
  error.name = 'GeolocationError';
  return error;
};

/**
 * Helper function to create a CSRF error
 */
export const createCSRFError = (message: string, context: IErrorContext = {}): Error => {
  const error = new Error(message);
  error.name = 'CSRFError';
  return error;
};

/**
 * Helper function to check if an error is a security error
 */
export const isSecurityError = (error: Error): boolean => {
  return (
    error.name === 'SecurityError' ||
    error.name === 'CSRFError' ||
    error.name === 'XSSError' ||
    error.name === 'SQLInjectionError' ||
    error.message.toLowerCase().includes('security') ||
    error.message.toLowerCase().includes('csrf') ||
    error.message.toLowerCase().includes('xss') ||
    error.message.toLowerCase().includes('sql injection')
  );
};
