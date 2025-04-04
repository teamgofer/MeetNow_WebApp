import React from 'react';
import L from 'leaflet';
import type { LatLngExpression, DivIcon, Icon } from 'leaflet';
interface MapMarkerProps {
    position: LatLngExpression;
    popupContent?: React.ReactNode;
    icon?: DivIcon | Icon;
    title?: string;
    onClick?: (e: L.LeafletMouseEvent) => void;
    zIndexOffset?: number;
    opacity?: number;
    markerId?: string | number;
    showPopup?: boolean;
    markerClass?: string;
}
declare const MapMarker: React.FC<MapMarkerProps>;
export default MapMarker;
