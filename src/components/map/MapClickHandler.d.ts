import React from 'react';
import L from 'leaflet';
interface MapClickHandlerProps {
    onMapClick: (e: L.LeafletMouseEvent) => void;
}
declare const MapClickHandler: React.FC<MapClickHandlerProps>;
export default MapClickHandler;
