export declare class LocationError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class GeolocationNotSupportedError extends LocationError {
    constructor();
}
export declare class GeolocationPermissionDeniedError extends LocationError {
    constructor();
}
export declare class GeolocationPositionUnavailableError extends LocationError {
    constructor();
}
export declare class GeolocationTimeoutError extends LocationError {
    constructor();
}
export declare class LocationCacheError extends LocationError {
    constructor(message: string);
}
export declare class LocationTrackingError extends LocationError {
    readonly retryCount: number;
    constructor(message: string, retryCount: number);
}
export declare class LocationValidationError extends Error {
    constructor(message: string);
}
export declare class GeofenceError extends Error {
    constructor(message: string);
}
export declare class CacheError extends Error {
    constructor(message: string);
}
export declare class LocationHistoryError extends Error {
    constructor(message: string);
}
