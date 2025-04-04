import type { GeolocationPosition, Geofence, LocationHistoryEntry } from '../features/proximity-chat/types/geolocation';
export declare class LocationService {
    private _errorHandler;
    private _errorCategories;
    private _currentLocation;
    private _locationWatchId;
    private _geofenceService;
    private _historyService;
    constructor();
    getCurrentLocation(): Promise<GeolocationPosition>;
    startWatchingLocation(callback: (position: GeolocationPosition) => void): void;
    stopWatchingLocation(): void;
    getCurrentCoordinates(): Promise<{
        latitude: number;
        longitude: number;
    }>;
    addGeofence(geofence: Geofence): void;
    removeGeofence(id: string): void;
    getActiveGeofences(): Geofence[];
    isInsideAnyGeofence(position: GeolocationPosition): boolean;
    onGeofenceEnter(callback: (geofence: Geofence) => void): void;
    onGeofenceExit(callback: (geofence: Geofence) => void): void;
    onGeofenceDwell(callback: (geofence: Geofence, duration: number) => void): void;
    getLocationHistory(): LocationHistoryEntry[];
    getRecentHistory(count: number): LocationHistoryEntry[];
    getHistoryInRange(start: number, end: number): LocationHistoryEntry[];
    clearHistory(): void;
    private _handlePositionSuccess;
}
