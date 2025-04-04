import React from 'react';
export interface IAppError {
    id: number;
    message: string;
    code?: string | number | undefined;
    source?: string | undefined;
    timestamp: string;
    retryCallback?: (() => Promise<void>) | undefined;
    details?: Record<string, unknown> | undefined;
}
declare const ErrorContext: React.Context<any>;
export declare const ErrorProvider: React.FC<ErrorProviderProps>;
export declare const useError: () => ErrorContextType;
export default ErrorContext;
