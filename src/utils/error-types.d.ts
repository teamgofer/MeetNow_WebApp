export declare enum ErrorTypes {
    NETWORK_ERROR = "NETWORK_ERROR",
    API_ERROR = "API_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    MAP_INITIALIZATION_ERROR = "MAP_INITIALIZATION_ERROR",
    GEOCODING_ERROR = "GEOCODING_ERROR",
    LOCATION_ERROR = "LOCATION_ERROR",
    NAVIGATION_ERROR = "NAVIGATION_ERROR",
    PARSING_ERROR = "PARSING_ERROR",
    SERIALIZATION_ERROR = "SERIALIZATION_ERROR",
    COMPONENT_ERROR = "COMPONENT_ERROR",
    RENDER_ERROR = "RENDER_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare enum ErrorSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export interface IApplicationError extends Error {
    type: ErrorTypes;
    severity: ErrorSeverity;
    context?: Record<string, any>;
    timestamp?: number;
    handled?: boolean;
}
export declare enum RecoveryStrategyType {
    RETRY = "RETRY",
    FALLBACK = "FALLBACK",
    REDIRECT = "REDIRECT",
    NOTIFY = "NOTIFY",
    RESET = "RESET"
}
