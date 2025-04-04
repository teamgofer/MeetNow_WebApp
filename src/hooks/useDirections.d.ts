import type { LatLngTuple } from 'leaflet';
import { RouteResponse, TransportMode } from '../utils/routing-service';
interface DirectionsState {
    isDirectionsActive: boolean;
    startPoint: LatLngTuple | undefined;
    endPoint: LatLngTuple | undefined;
    routeData: RouteResponse | null;
    isLoading: boolean;
    error: string | null;
    selectedRouteIndex: number;
    transportMode: TransportMode;
    awaitingSecondPoint: boolean;
    firstSelectedPoint: LatLngTuple | undefined;
}
interface DirectionsActions {
    showDirections: (start: LatLngTuple, end: LatLngTuple) => void;
    hideDirections: () => void;
    setRouteData: (data: RouteResponse) => void;
    setSelectedRouteIndex: (index: number) => void;
    setTransportMode: (mode: TransportMode) => void;
    refreshRoute: () => Promise<void>;
    clearCache: () => void;
    prepareMultiPointRoute: (firstPoint: LatLngTuple) => void;
    cancelMultiPointRoute: () => void;
}
export default function useDirections(options?: {
    showAlternatives?: boolean;
    autoRefresh?: boolean;
}): [DirectionsState, DirectionsActions];
export {};
