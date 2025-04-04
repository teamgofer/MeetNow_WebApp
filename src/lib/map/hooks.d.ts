import L from 'leaflet';
import { RefObject } from 'react';
export declare const useMapZoom: (mapRef: RefObject<L.Map>, onZoomChange?: (zoom: number) => void, onSearchRadiusChange?: (radius: number) => void, initialZoom?: number) => [number, React.Dispatch<React.SetStateAction<number>>];
interface Location {
    lat: number;
    lng: number;
}
interface Meetup {
    location?: {
        lat?: number;
        lng?: number;
    };
    [key: string]: any;
}
export declare const useMeetupBounds: (mapRef: RefObject<L.Map>, location: Location | null, activeMeetups: Meetup[]) => (() => L.LatLngBounds | undefined);
export declare const useMapResize: (mapRef: RefObject<L.Map>) => {
    width: number;
    height: number;
};
export {};
