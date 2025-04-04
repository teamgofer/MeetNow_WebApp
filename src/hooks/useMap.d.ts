import { Map, LatLngBounds, LatLngExpression, FitBoundsOptions } from 'leaflet';
interface IMapLocation {
    lat: number;
    lng: number;
    [key: string]: any;
}
interface IUseMapReturn {
    map: Map | null;
    bounds: LatLngBounds | null;
    zoom: number;
    center: [number, number];
    flyTo: (target: LatLngExpression | IMapLocation, options?: IFlyToOptions) => void;
    fitBounds: (targetBounds: LatLngBounds, options?: FitBoundsOptions) => void;
    resetView: () => void;
    centerOnUser: (coordinates?: IMapLocation) => void;
}
interface IFlyToOptions {
    duration?: number | undefined;
    zoom?: number | undefined;
    [key: string]: any;
}
declare const useMap: () => IUseMapReturn;
export default useMap;
