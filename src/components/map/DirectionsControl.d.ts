import type { LatLngTuple } from 'leaflet';
import { TransportMode, type RouteResponse } from '../../utils/routing-service';
interface DirectionsControlProps {
    start?: LatLngTuple;
    end?: LatLngTuple;
    onRouteFound?: (route: RouteResponse) => void;
    onClose?: () => void;
    isVisible?: boolean;
    showAlternatives?: boolean;
    isLoading?: boolean;
    error?: string | null;
    transportMode?: TransportMode;
    onTransportModeChange?: (mode: TransportMode) => void;
    routeData?: RouteResponse | null;
    selectedRouteIndex?: number;
    onRouteSelect?: (index: number) => void;
    awaitingSecondPoint?: boolean;
    onCancelMultiPointRoute?: () => void;
}
declare const DirectionsControl: React.FC<DirectionsControlProps>;
export default DirectionsControl;
