/**
 * Base class for all location-related errors
 */
export class LocationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

/**
 * Error thrown when geolocation is not supported
 */
export class GeolocationNotSupportedError extends LocationError {
  constructor() {
    super('Geolocation is not supported by this browser', 'GEOLOCATION_NOT_SUPPORTED');
    this.name = 'GeolocationNotSupportedError';
  }
}

/**
 * Error thrown when geolocation permission is denied
 */
export class GeolocationPermissionDeniedError extends LocationError {
  constructor() {
    super('Geolocation permission denied', 'PERMISSION_DENIED');
    this.name = 'GeolocationPermissionDeniedError';
  }
}

/**
 * Error thrown when geolocation position is unavailable
 */
export class GeolocationPositionUnavailableError extends LocationError {
  constructor() {
    super('Geolocation position unavailable', 'POSITION_UNAVAILABLE');
    this.name = 'GeolocationPositionUnavailableError';
  }
}

/**
 * Error thrown when geolocation request times out
 */
export class GeolocationTimeoutError extends LocationError {
  constructor() {
    super('Geolocation request timed out', 'TIMEOUT');
    this.name = 'GeolocationTimeoutError';
  }
}

/**
 * Error thrown when location cache is invalid
 */
export class LocationCacheError extends LocationError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR');
    this.name = 'LocationCacheError';
  }
}

/**
 * Error thrown when location tracking fails
 */
export class LocationTrackingError extends LocationError {
  constructor(
    message: string,
    public readonly retryCount: number
  ) {
    super(message, 'TRACKING_ERROR');
    this.name = 'LocationTrackingError';
  }
}

/**
 * Error thrown when location validation fails
 */
export class LocationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationValidationError';
  }
}

export class GeofenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeofenceError';
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class LocationHistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationHistoryError';
  }
}
