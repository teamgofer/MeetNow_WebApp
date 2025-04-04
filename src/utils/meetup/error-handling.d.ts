export declare enum ErrorCategory {
    VALIDATION = "validation",
    NETWORK = "network",
    STORAGE = "storage",
    DATABASE = "database",
    UNKNOWN = "unknown"
}
export interface IMeetupError {
    category: ErrorCategory;
    message: string;
    timestamp: string;
    originalError?: Error;
}
export declare const handleMeetupError: (error: Error, operation: string) => IMeetupError;
