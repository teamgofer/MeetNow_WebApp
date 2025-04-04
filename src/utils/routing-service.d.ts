import { LatLng } from 'leaflet';
export type TransportMode = 'driving-car' | 'cycling-regular' | 'foot-walking';
export interface RouteOptions {
    mode?: TransportMode;
    alternatives?: boolean;
    avoid?: string[];
}
export interface RouteStep {
    distance: number;
    duration: number;
    instruction: string;
    name: string;
    type: number;
}
export interface RouteSegment {
    distance: number;
    duration: number;
    steps: RouteStep[];
}
export interface Route {
    distance: number;
    duration: number;
    geometry: string | [number, number][];
    segments: RouteSegment[];
}
export interface RouteResponse {
    routes: Route[];
    metadata: any;
}
export declare function getDirections(start: [number, number], end: [number, number], transportMode?: TransportMode): Promise<RouteResponse>;
export declare function getIsochrone(center: LatLng, rangeType?: 'time' | 'distance', rangeValue?: number, mode?: TransportMode): Promise<any>;
export declare function decodePolyline(encodedPolyline: string): [number, number][];
export declare function decodePolyline2(encodedPolyline: string): [number, number][];
export declare function formatDuration(seconds: number): string;
export declare function formatDistance(meters: number): string;
export declare function clearRouteCache(): void;
export declare function decodeORSPolyline(encodedPolyline: string): [number, number][];
export declare function getDirectionsFromLatLng(start: LatLng, end: LatLng, transportMode?: TransportMode): Promise<RouteResponse>;
export declare function useRouting(options?: RouteOptions): {
    route: RouteResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchRoute: (start: [number, number], end: [number, number], transportMode?: TransportMode) => Promise<void>;
};
