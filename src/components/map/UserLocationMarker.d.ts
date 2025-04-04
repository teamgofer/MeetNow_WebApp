import React from 'react';
import type { LatLngTuple } from 'leaflet';
interface UserLocationMarkerProps {
    position: LatLngTuple;
    accuracy?: number;
    showPopup?: boolean;
}
declare const UserLocationMarker: React.FC<UserLocationMarkerProps>;
export default UserLocationMarker;
