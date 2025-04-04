import { EventEmitter } from '../../../features/utils/EventEmitter';
import { errorHandlingService } from '../../../utils/ErrorHandlingService';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor';
import { LocationError, GeolocationNotSupportedError, GeolocationPermissionDeniedError, GeolocationPositionUnavailableError, GeolocationTimeoutError, LocationTrackingError, } from '../types/errors';
import { LocationUtils } from '../utils/LocationUtils';
import { GeofenceService } from './GeofenceService';
import { LocationCacheService } from './LocationCacheService';
import { LocationHistoryService } from './LocationHistoryService';
export class LocationService {
    constructor(options) {
        this.lastLocation = null;
        this.watchId = null;
        this.minDistanceThreshold = 10;
        this._isTracking = false;
        this._retryCount = 0;
        this._maxRetries = 3;
        this._options = {
            enableHighAccuracy: true,
            maximumAge: 300000,
            timeout: 30000,
        };
        this._options = { ...this._options, ...options };
        this._locationEmitter = new EventEmitter();
        this._errorEmitter = new EventEmitter();
        this._monitor = PerformanceMonitor;
        this._errorHandler = errorHandlingService;
        this._retryCount = 0;
        this._isTracking = false;
        this._geofenceService = new GeofenceService();
        this._historyService = new LocationHistoryService();
        this._errorHandler.registerRecoveryStrategy(this._errorHandler.getErrorCategories().LOCATION, async (error) => {
            const cached = LocationCacheService.loadCachedLocation();
            if (cached.location) {
                return cached.location;
            }
            return this._getDefaultLocation();
        });
        const cached = LocationCacheService.loadCachedLocation();
        if (cached.location) {
            this.lastLocation = cached.location;
        }
        this._handlePositionSuccess = this._handlePositionSuccess.bind(this);
        this._handlePositionError = this._handlePositionError.bind(this);
    }
    async startTracking() {
        if (this._isTracking) {
            return;
        }
        const startTime = Date.now();
        try {
            if (!navigator.geolocation) {
                throw new GeolocationNotSupportedError();
            }
            this._isTracking = true;
            this._retryCount = 0;
            this.watchId = navigator.geolocation.watchPosition(this._handlePositionSuccess, this._handlePositionError, this._options);
            this._monitor.trackOperationTiming('location', 'startTracking', Date.now() - startTime);
        }
        catch (error) {
            this._monitor.trackOperationTiming('location', 'startTracking', Date.now() - startTime);
            this._handleError(error);
            throw error;
        }
    }
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this._isTracking = false;
    }
    async getCurrentLocation() {
        const startTime = Date.now();
        try {
            const cached = LocationCacheService.loadCachedLocation();
            if (cached.location && !this._isCacheExpired(cached)) {
                LocationCacheService.updateStats(true);
                this._monitor.trackOperationTiming('location', 'getCurrentLocation', Date.now() - startTime);
                return cached.location;
            }
            LocationCacheService.updateStats(false);
            const position = await this._getFreshLocation();
            this._monitor.trackOperationTiming('location', 'getCurrentLocation', Date.now() - startTime);
            return position;
        }
        catch (error) {
            this._monitor.trackOperationTiming('location', 'getCurrentLocation', Date.now() - startTime);
            this._handleError(error);
            throw error;
        }
    }
    onLocationChange(callback) {
        return this._locationEmitter.on(callback);
    }
    offLocationChange(callback) {
        this._locationEmitter.off(callback);
    }
    onError(callback) {
        return this._errorEmitter.on(callback);
    }
    offError(callback) {
        this._errorEmitter.off(callback);
    }
    _handlePositionSuccess(position) {
        try {
            LocationUtils.validatePosition(position);
            if (LocationUtils.hasMovedBeyondThreshold(this.lastLocation, position, this.minDistanceThreshold)) {
                this.lastLocation = position;
                this._notifyLocation(position);
                LocationCacheService.saveToCache(position, 'gps');
                this._geofenceService.updateLocation(position.coords.latitude, position.coords.longitude);
                this._historyService.addEntry(position, 'gps');
            }
            this._retryCount = 0;
        }
        catch (error) {
            this._handleError(error);
        }
    }
    _handlePositionError(error) {
        let locationError;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                locationError = new GeolocationPermissionDeniedError();
                break;
            case error.POSITION_UNAVAILABLE:
                locationError = new GeolocationPositionUnavailableError();
                break;
            case error.TIMEOUT:
                locationError = new GeolocationTimeoutError();
                break;
            default:
                locationError = new LocationError(error.message, 'UNKNOWN_ERROR');
        }
        this._handleError(locationError);
    }
    _handleError(error) {
        this._errorHandler.handleError(error);
        this._notifyError(error);
        if (this._retryCount < this._maxRetries) {
            this._retryCount++;
            this._retryTracking();
        }
        else {
            this.stopTracking();
        }
    }
    _retryTracking() {
        if (this._isTracking) {
            setTimeout(() => {
                if (this._isTracking) {
                    this.startTracking();
                }
            }, 1000 * this._retryCount);
        }
    }
    _getFreshLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(position => {
                try {
                    LocationUtils.validatePosition(position);
                    resolve(position);
                }
                catch (error) {
                    reject(error);
                }
            }, error => {
                reject(new LocationTrackingError(error.message, this._retryCount));
            }, this._options);
        });
    }
    _getDefaultLocation() {
        const coords = {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({
                latitude: 0,
                longitude: 0,
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
            }),
        };
        return {
            coords,
            timestamp: Date.now(),
            toJSON: () => ({
                coords,
                timestamp: Date.now(),
            }),
        };
    }
    _isCacheExpired(cache) {
        return Date.now() - cache.timestamp > cache.maxAge;
    }
    _notifyLocation(position) {
        this._locationEmitter.emit(position);
    }
    _notifyError(error) {
        this._errorEmitter.emit(error);
    }
    getCurrentSpeed() {
        return this.lastLocation?.coords.speed ?? null;
    }
    getCurrentHeading() {
        return this.lastLocation?.coords.heading ?? null;
    }
    getCurrentAccuracy() {
        return this.lastLocation?.coords.accuracy ?? null;
    }
    isIndoors(threshold = 100) {
        const accuracy = this.getCurrentAccuracy();
        return accuracy !== null && accuracy > threshold;
    }
    getCurrentAltitude() {
        return this.lastLocation?.coords.altitude ?? null;
    }
    getCurrentAltitudeAccuracy() {
        return this.lastLocation?.coords.altitudeAccuracy ?? null;
    }
    addGeofence(geofence) {
        this._geofenceService.addGeofence(geofence);
    }
    removeGeofence(id) {
        this._geofenceService.removeGeofence(id);
    }
    getActiveGeofences() {
        return this._geofenceService.getActiveGeofences();
    }
    onGeofenceEnter(callback) {
        return this._geofenceService.onEnter(callback);
    }
    onGeofenceExit(callback) {
        return this._geofenceService.onExit(callback);
    }
    onGeofenceDwell(callback) {
        return this._geofenceService.onDwell(callback);
    }
    getLocationHistory(startTime, endTime) {
        return this._historyService.getEntries(startTime, endTime);
    }
    getRecentHistory(duration) {
        return this._historyService.getRecentEntries(duration);
    }
    getHistoryInRange(latitude, longitude, radius) {
        return this._historyService.getEntriesInRange(latitude, longitude, radius);
    }
    clearHistory() {
        this._historyService.clear();
    }
}
//# sourceMappingURL=locationService.js.map