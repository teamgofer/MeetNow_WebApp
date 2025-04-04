import { errorHandlingService } from '../utils/ErrorHandlingService';
import { GeofenceService } from './GeofenceService';
import { LocationHistoryService } from './LocationHistoryService';
export class LocationService {
    constructor() {
        this._currentLocation = null;
        this._locationWatchId = null;
        this._errorHandler = errorHandlingService;
        this._errorCategories = this._errorHandler.getErrorCategories();
        this._geofenceService = new GeofenceService();
        this._historyService = new LocationHistoryService();
    }
    async getCurrentLocation() {
        try {
            if (this._currentLocation) {
                return this._currentLocation;
            }
            const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation is not supported by your browser'));
                    return;
                }
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                });
            });
            this._currentLocation = position;
            this._handlePositionSuccess(position);
            return position;
        }
        catch (error) {
            this._errorHandler.handleError(error instanceof Error ? error : new Error('Failed to get location'), this._errorCategories.LOCATION);
            throw error;
        }
    }
    startWatchingLocation(callback) {
        try {
            if (this._locationWatchId !== null) {
                return;
            }
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }
            this._locationWatchId = navigator.geolocation.watchPosition(position => {
                this._currentLocation = position;
                this._handlePositionSuccess(position);
                callback(position);
            }, error => {
                this._errorHandler.handleError(error instanceof Error ? error : new Error('Failed to watch location'), this._errorCategories.LOCATION);
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            });
        }
        catch (error) {
            this._errorHandler.handleError(error instanceof Error ? error : new Error('Failed to start watching location'), this._errorCategories.LOCATION);
            throw error;
        }
    }
    stopWatchingLocation() {
        if (this._locationWatchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(this._locationWatchId);
            this._locationWatchId = null;
        }
    }
    async getCurrentCoordinates() {
        const position = await this.getCurrentLocation();
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
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
    isInsideAnyGeofence(position) {
        return this._geofenceService.isInsideAnyGeofence(position);
    }
    onGeofenceEnter(callback) {
        this._geofenceService.on('enter', callback);
    }
    onGeofenceExit(callback) {
        this._geofenceService.on('exit', callback);
    }
    onGeofenceDwell(callback) {
        this._geofenceService.on('dwell', callback);
    }
    getLocationHistory() {
        return this._historyService.getEntries();
    }
    getRecentHistory(count) {
        return this._historyService.getRecentEntries(count);
    }
    getHistoryInRange(start, end) {
        return this._historyService.getEntriesInRange(start, end);
    }
    clearHistory() {
        this._historyService.clear();
    }
    _handlePositionSuccess(position) {
        this._geofenceService.updateLocation(position);
        this._historyService.addEntry(position);
    }
}
//# sourceMappingURL=LocationService.js.map