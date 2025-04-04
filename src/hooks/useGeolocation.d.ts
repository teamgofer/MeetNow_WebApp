export interface ILocation {
    lat: number;
    lng: number;
    display_name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
}
export interface IGeolocationOptions {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
    retryCount: number;
    retryDelay: number;
    useCaching: boolean;
}
export interface IGeolocationState {
    location: Location | null;
    error: string | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
}
export declare const useGeolocation: (options?: Partial<GeolocationOptions>) => GeolocationState;
export default useGeolocation;
