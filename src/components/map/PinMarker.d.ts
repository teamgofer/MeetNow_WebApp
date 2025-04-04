import React from 'react';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
interface PinMarkerProps {
    id: string;
    position: LatLngExpression;
    title?: string;
    address?: string;
    color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
    isTemporary?: boolean;
    onClick?: (id: string) => void;
    selected?: boolean;
    showPopup?: boolean;
    icon?: Icon | DivIcon;
}
declare const PinMarker: React.FC<PinMarkerProps>;
export default PinMarker;
