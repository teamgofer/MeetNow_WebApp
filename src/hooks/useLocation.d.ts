interface ICoordinates {
    lat: number;
    lng: number;
}
interface ISearchOptions {
    limit?: number;
    language?: string;
    [key: string]: any;
}
interface IGeolocationOptions extends PositionOptions {
    [key: string]: any;
}
interface ILocation extends ICoordinates {
    accuracy?: number;
    timestamp?: number;
    formattedAddress?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    [key: string]: any;
}
interface IUseLocationReturn {
    location: ILocation | null;
    isLoading: boolean;
    error: Error | string | null;
    searchLocations: (query: string, options?: ISearchOptions) => Promise<ILocation[]>;
    reverseGeocode: (coordinates: ICoordinates) => Promise<ILocation[]>;
    getCurrentLocation: (options?: IGeolocationOptions) => Promise<ILocation>;
    calculateDistance: (point1: ICoordinates, point2: ICoordinates) => number;
}
declare const useLocation: () => IUseLocationReturn;
export default useLocation;
