export class LocationError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'LocationError';
    }
}
export class GeolocationNotSupportedError extends LocationError {
    constructor() {
        super('Geolocation is not supported by this browser', 'GEOLOCATION_NOT_SUPPORTED');
        this.name = 'GeolocationNotSupportedError';
    }
}
export class GeolocationPermissionDeniedError extends LocationError {
    constructor() {
        super('Geolocation permission denied', 'PERMISSION_DENIED');
        this.name = 'GeolocationPermissionDeniedError';
    }
}
export class GeolocationPositionUnavailableError extends LocationError {
    constructor() {
        super('Geolocation position unavailable', 'POSITION_UNAVAILABLE');
        this.name = 'GeolocationPositionUnavailableError';
    }
}
export class GeolocationTimeoutError extends LocationError {
    constructor() {
        super('Geolocation request timed out', 'TIMEOUT');
        this.name = 'GeolocationTimeoutError';
    }
}
export class LocationCacheError extends LocationError {
    constructor(message) {
        super(message, 'CACHE_ERROR');
        this.name = 'LocationCacheError';
    }
}
export class LocationTrackingError extends LocationError {
    constructor(message, retryCount) {
        super(message, 'TRACKING_ERROR');
        this.retryCount = retryCount;
        this.name = 'LocationTrackingError';
    }
}
export class LocationValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LocationValidationError';
    }
}
export class GeofenceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GeofenceError';
    }
}
export class CacheError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CacheError';
    }
}
export class LocationHistoryError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LocationHistoryError';
    }
}
//# sourceMappingURL=errors.js.map