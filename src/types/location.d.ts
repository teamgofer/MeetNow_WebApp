export interface ILocation {
    lat: number;
    lng: number;
    display_name?: string;
    accuracy?: number;
}
export interface ILocationSearchOptions {
    limit?: number;
    userLocation?: Location;
    proximityRadius?: number;
    proximityFactor?: number;
}
export interface ILocationSearchResult {
    display_name: string;
    lat: number;
    lng: number;
    type?: string;
    class?: string;
    importance?: number;
    address?: {
        [key: string]: string;
    };
}
export interface ILocationRequestOptions {
    bypassCache?: boolean;
    timeout?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    retryCount?: number;
    retryDelay?: number;
}
export interface ILocationCache {
    location: Location;
    timestamp: number;
}
