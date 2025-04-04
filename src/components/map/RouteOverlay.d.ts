import { Route, TransportMode } from '../../utils/routing-service';
interface RouteOverlayProps {
    route?: Route;
    transportMode?: TransportMode;
    color?: string;
    weight?: number;
    opacity?: number;
    dashArray?: string;
    showMarkers?: boolean;
    showTooltips?: boolean;
    fitRoute?: boolean;
    animated?: boolean;
}
declare const RouteOverlay: React.FC<RouteOverlayProps>;
export default RouteOverlay;
