import React from 'react';
import type { LatLngTuple } from 'leaflet';
interface AnimatedUserLocationMarkerProps {
    position: LatLngTuple;
    accuracy?: number;
    showPopup?: boolean;
}
declare const AnimatedUserLocationMarker: React.FC<AnimatedUserLocationMarkerProps>;
export default AnimatedUserLocationMarker;
