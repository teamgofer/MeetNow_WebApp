import errorHandlingService from './ErrorHandlingService';
import { ErrorTypes, ErrorSeverity } from './error-types';
export const createError = (type, message, severity = ErrorSeverity.ERROR, context = {}) => {
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
export { ErrorTypes, ErrorSeverity };
export const determineErrorType = (error) => {
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
export const handleError = (error, context = {}) => {
    const type = determineErrorType(error);
    const severity = determineErrorSeverity(type, context);
    const standardizedError = createError(type, error.message ?? 'An unexpected error occurred', severity, context);
    errorHandlingService.handleError(standardizedError);
    return standardizedError;
};
export const handleApiError = (error, context = {}) => {
    const apiContext = {
        ...context,
        isApiError: true,
        statusCode: error.status ?? undefined,
        endpoint: error.endpoint ?? undefined,
    };
    return handleError(error, apiContext);
};
export const handleValidationError = (errors, context = {}) => {
    const validationContext = {
        ...context,
        isValidationError: true,
        fieldErrors: errors,
    };
    return handleError(new Error('Validation failed'), validationContext);
};
export const handleNetworkError = (error, context = {}) => {
    const networkContext = {
        ...context,
        isNetworkError: true,
        isOffline: !navigator.onLine,
    };
    return handleError(error, networkContext);
};
export const handleAuthError = async (error, context = {}) => {
    if (isSecurityError(error)) {
        const securityContext = {
            ...context,
            isSecurityError: true,
        };
        return handleError(error, securityContext);
    }
    return handleError(error, context);
};
export const handleGeolocationError = (error, context = {}) => {
    const geoContext = {
        ...context,
        isGeolocationError: true,
    };
    return handleError(error, geoContext);
};
export const handleStorageError = (error, context = {}) => {
    const storageContext = {
        ...context,
        isStorageError: true,
    };
    return handleError(error, storageContext);
};
export const handleRateLimitError = (error, context = {}) => {
    const rateLimitContext = {
        ...context,
        isRateLimitError: true,
        retryAfter: error.retryAfter ?? undefined,
    };
    return handleError(error, rateLimitContext);
};
export const createSecurityError = (message, context = {}) => {
    const error = new Error(message);
    error.name = 'SecurityError';
    return error;
};
export const createAuthError = (message, context = {}) => {
    const error = new Error(message);
    error.name = 'AuthError';
    return error;
};
export const createStorageError = (message, context = {}) => {
    const error = new Error(message);
    error.name = 'StorageError';
    return error;
};
export const createGeolocationError = (message, context = {}) => {
    const error = new Error(message);
    error.name = 'GeolocationError';
    return error;
};
export const createCSRFError = (message, context = {}) => {
    const error = new Error(message);
    error.name = 'CSRFError';
    return error;
};
export const isSecurityError = (error) => {
    return (error.name === 'SecurityError' ||
        error.name === 'CSRFError' ||
        error.name === 'XSSError' ||
        error.name === 'SQLInjectionError' ||
        error.message.toLowerCase().includes('security') ||
        error.message.toLowerCase().includes('csrf') ||
        error.message.toLowerCase().includes('xss') ||
        error.message.toLowerCase().includes('sql injection'));
};
//# sourceMappingURL=error-handler.js.map