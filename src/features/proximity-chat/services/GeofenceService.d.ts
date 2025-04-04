import { EventEmitter } from 'events';
import type { Geofence } from '../types/geofence';
export declare class GeofenceService extends EventEmitter {
    private geofences;
    private activeGeofences;
    private dwellStartTimes;
    addGeofence(geofence: Geofence): void;
    removeGeofence(id: string): void;
    updateLocation(latitude: number, longitude: number): void;
    getActiveGeofences(): Geofence[];
    isInsideAnyGeofence(latitude: number, longitude: number): boolean;
    onEnter(callback: (data: {
        geofence: Geofence;
    }) => void): () => void;
    onExit(callback: (data: {
        geofence: Geofence;
    }) => void): () => void;
    onDwell(callback: (data: {
        geofence: Geofence;
        duration: number;
    }) => void): () => void;
    private _handleEnter;
    private _handleExit;
    on<K extends keyof GeofenceEventMap>(event: K, listener: (data: GeofenceEventMap[K]) => void): this;
    emit<K extends keyof GeofenceEventMap>(event: K, data: GeofenceEventMap[K]): boolean;
}
