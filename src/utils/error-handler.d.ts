import { ErrorTypes, ErrorSeverity, IErrorContext, IStandardizedError } from './error-types';
export declare const createError: (type: ErrorTypes, message: string, severity?: ErrorSeverity, context?: IErrorContext) => IStandardizedError;
export { ErrorTypes, ErrorSeverity };
export type { IErrorContext, IStandardizedError };
export declare const determineErrorType: (error: Error) => ErrorTypes;
export declare const determineErrorSeverity: (type: ErrorTypes, context?: IErrorContext) => ErrorSeverity;
export declare const handleError: (error: Error, context?: IErrorContext) => IStandardizedError;
export declare const handleApiError: (error: Error & {
    status?: number;
    endpoint?: string;
}, context?: IErrorContext) => IStandardizedError;
export declare const handleValidationError: (errors: Record<string, string[]>, context?: IErrorContext) => IStandardizedError;
export declare const handleNetworkError: (error: Error, context?: IErrorContext) => IStandardizedError;
export declare const handleAuthError: (error: Error, context?: IErrorContext) => Promise<IStandardizedError>;
export declare const handleGeolocationError: (error: Error, context?: IErrorContext) => IStandardizedError;
export declare const handleStorageError: (error: Error, context?: IErrorContext) => IStandardizedError;
export declare const handleRateLimitError: (error: Error & {
    retryAfter?: number;
}, context?: IErrorContext) => IStandardizedError;
export declare const createSecurityError: (message: string, context?: IErrorContext) => Error;
export declare const createAuthError: (message: string, context?: IErrorContext) => Error;
export declare const createStorageError: (message: string, context?: IErrorContext) => Error;
export declare const createGeolocationError: (message: string, context?: IErrorContext) => Error;
export declare const createCSRFError: (message: string, context?: IErrorContext) => Error;
export declare const isSecurityError: (error: Error) => boolean;
