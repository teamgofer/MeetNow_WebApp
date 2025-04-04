import type { DivIcon } from 'leaflet';
import React from 'react';
export interface ILocationPosition {
    lat: number;
    lng: number;
    accuracy?: number;
    display_name?: string;
    [key: string]: any;
}
export interface ILocationMarkerProps {
    position: LocationPosition;
    icon: DivIcon;
    onLocationSelect?: (location: LocationPosition) => void;
    showInfoByDefault?: boolean;
    zIndexOffset?: number;
    pulsate?: boolean;
    interactive?: boolean;
}
declare const LocationMarker: React.FC<LocationMarkerProps>;
export default LocationMarker;
