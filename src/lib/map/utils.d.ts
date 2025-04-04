import L from 'leaflet';
export interface IMapLocation {
    lat: number;
    lng?: number;
    lon?: number;
}
export declare const initializeLeaflet: () => void;
export declare const createBounds: (center: IMapLocation, points?: IMapLocation[]) => L.LatLngBounds;
export declare const calculateDistance: (point1: IMapLocation, point2: IMapLocation) => number;
export declare const isValidLocation: (location: any) => location is IMapLocation;
