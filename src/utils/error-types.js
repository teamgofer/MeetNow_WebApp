export var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorTypes["API_ERROR"] = "API_ERROR";
    ErrorTypes["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorTypes["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorTypes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorTypes["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorTypes["MAP_INITIALIZATION_ERROR"] = "MAP_INITIALIZATION_ERROR";
    ErrorTypes["GEOCODING_ERROR"] = "GEOCODING_ERROR";
    ErrorTypes["LOCATION_ERROR"] = "LOCATION_ERROR";
    ErrorTypes["NAVIGATION_ERROR"] = "NAVIGATION_ERROR";
    ErrorTypes["PARSING_ERROR"] = "PARSING_ERROR";
    ErrorTypes["SERIALIZATION_ERROR"] = "SERIALIZATION_ERROR";
    ErrorTypes["COMPONENT_ERROR"] = "COMPONENT_ERROR";
    ErrorTypes["RENDER_ERROR"] = "RENDER_ERROR";
    ErrorTypes["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorTypes || (ErrorTypes = {}));
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["INFO"] = "INFO";
    ErrorSeverity["WARNING"] = "WARNING";
    ErrorSeverity["ERROR"] = "ERROR";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
export var RecoveryStrategyType;
(function (RecoveryStrategyType) {
    RecoveryStrategyType["RETRY"] = "RETRY";
    RecoveryStrategyType["FALLBACK"] = "FALLBACK";
    RecoveryStrategyType["REDIRECT"] = "REDIRECT";
    RecoveryStrategyType["NOTIFY"] = "NOTIFY";
    RecoveryStrategyType["RESET"] = "RESET";
})(RecoveryStrategyType || (RecoveryStrategyType = {}));
//# sourceMappingURL=error-types.js.map