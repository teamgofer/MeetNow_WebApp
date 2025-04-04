import { EventEmitter } from 'events';
import type { Geofence } from '../features/proximity-chat/types/geofence';
import type { GeolocationPosition } from '../features/proximity-chat/types/geolocation';
export declare class GeofenceService extends EventEmitter {
    private geofences;
    private dwellTimers;
    private lastPosition;
    constructor();
    addGeofence(geofence: Geofence): void;
    removeGeofence(id: string): void;
    getActiveGeofences(): Geofence[];
    updateLocation(position: GeolocationPosition): void;
    isInsideAnyGeofence(position: GeolocationPosition): boolean;
    private checkGeofence;
    private isInsideGeofence;
    private handleGeofenceEnter;
    private handleGeofenceExit;
    private handleGeofenceDwell;
    on<K extends keyof GeofenceEventMap>(event: K, listener: (data: GeofenceEventMap[K]) => void): this;
    emit<K extends keyof GeofenceEventMap>(event: K, data: GeofenceEventMap[K]): boolean;
}
