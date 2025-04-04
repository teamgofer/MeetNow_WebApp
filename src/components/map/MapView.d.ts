import React from 'react';
import { LatLngExpression } from 'leaflet';
import { IMeetup } from './MeetupMarkers';
interface IPinnedLocation {
    id: string;
    position: LatLngExpression;
    title?: string;
    address?: string;
    color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
    isTemporary?: boolean;
}
interface MapViewProps {
    meetups?: IMeetup[];
    pins?: IPinnedLocation[];
    onMapClick?: (position: LatLngExpression) => void;
    onMeetupClick?: (id: string) => void;
    onPinClick?: (id: string) => void;
    selectedMeetupId?: string | null;
    selectedPinId?: string | null;
    showUserLocation?: boolean;
    centerOnUserLocation?: boolean;
    fitAllMarkers?: boolean;
    height?: string;
    width?: string;
    className?: string;
}
declare const MapView: React.FC<MapViewProps>;
export default MapView;
