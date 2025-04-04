export interface ILocation {
    lat: number;
    lng: number;
    display_name: string;
    accuracy?: number;
    type: string;
    importance: number;
    distance: number | null;
}
export interface ILocationRequestOptions {
    bypassCache?: boolean;
    timeout?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    retryCount?: number;
    retryDelay?: number;
}
export interface ISearchOptions {
    lat?: number;
    lng?: number;
    limit?: number;
    userLocation?: Location;
    proximityRadius?: number;
    proximityFactor?: number;
}
export interface ICachedLocation {
    location: Location;
    timestamp: number;
}
export interface IQueuedRequest {
    resolve: (location: Location) => void;
    reject: (error: Error) => void;
}
export interface IPhotonFeature {
    properties: {
        name: string;
        osm_key?: string;
        osm_value?: string;
        housenumber?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
    geometry: {
        coordinates: [number, number];
    };
}
export interface IPhotonResponse {
    features: PhotonFeature[];
}
declare class LocationRequestManager {
    private cachedLocation;
    private lastRequestTime;
    private requestTimeout;
    private minRequestInterval;
    private maxCacheAge;
    private retryCount;
    private retryDelay;
    private pendingRequest;
    private requestQueue;
    private isRequesting;
    constructor();
    private initializeCache;
    private updateCache;
    requestLocation(options?: LocationRequestOptions): Promise<Location>;
    private resolveQueuedRequests;
    private rejectQueuedRequests;
    private getCurrentPosition;
    clearCache(): void;
}
export declare const locationRequestManager: LocationRequestManager;
export declare function searchLocations(query: string, options?: SearchOptions): Promise<Location[]>;
export declare function reverseGeocode(lat: number, lng: number): Promise<Location[]>;
export {};
