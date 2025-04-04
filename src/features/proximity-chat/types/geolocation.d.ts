export interface IGeolocationCoordinates {
    readonly latitude: number;
    readonly longitude: number;
    readonly accuracy: number;
    readonly altitude: number | null;
    readonly altitudeAccuracy: number | null;
    readonly heading: number | null;
    readonly speed: number | null;
    toJSON(): {
        latitude: number;
        longitude: number;
        accuracy: number;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
    };
}
export interface IGeolocationPosition {
    readonly coords: GeolocationCoordinates;
    readonly timestamp: number;
    toJSON(): {
        coords: GeolocationCoordinates;
        timestamp: number;
    };
}
export interface ILocationCache {
    timestamp: number;
    location: GeolocationPosition | null;
    maxAge: number;
    accuracy: number | null;
    source: 'gps' | 'network' | 'cached' | null;
    stats: {
        hits: number;
        misses: number;
        lastUpdated: number;
    };
}
export interface ILocationOptions {
    enableHighAccuracy: boolean;
    maximumAge: number;
    timeout: number;
    minDistanceThreshold?: number;
    maxRetries?: number;
    cacheMaxAge?: number;
}
export type TLocationCallback = (position: GeolocationPosition) => void;
export type TErrorCallback = (error: Error) => void;
export type TLocationSource = 'gps' | 'network' | 'cached';
export interface ILocationStats {
    hits: number;
    misses: number;
    lastUpdated: number;
    accuracy: number | null;
    source: LocationSource | null;
}
export interface IGeofence {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    onEnter?: () => void;
    onExit?: () => void;
    onDwell?: (duration: number) => void;
    dwellTime?: number;
}
export interface ILocationHistoryEntry {
    position: GeolocationPosition;
    timestamp: number;
    source: 'gps' | 'network' | 'cached';
    accuracy: number;
}
export interface ILocationHistoryOptions {
    maxEntries: number;
    maxAge: number;
    minDistance: number;
}
