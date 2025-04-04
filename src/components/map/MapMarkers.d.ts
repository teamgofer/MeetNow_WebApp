import React from 'react';
import type { LatLngExpression, DivIcon, Icon } from 'leaflet';
interface Marker {
    id: string | number;
    position: LatLngExpression;
    popupContent?: React.ReactNode;
    icon?: DivIcon | Icon;
    title?: string;
    zIndexOffset?: number;
    opacity?: number;
    showPopup?: boolean;
}
interface MapMarkersProps {
    markers: Marker[];
    onMarkerClick?: (markerId: string | number, e: L.LeafletMouseEvent) => void;
    selectedMarkerId?: string | number | null;
}
declare const MapMarkers: React.FC<MapMarkersProps>;
export default MapMarkers;
import { Marker } from 'react-leaflet';
export interface ILocation {
    lat: number;
    lng: number;
    display_name?: string;
    address?: Record<string, string>;
    tags?: Record<string, any>;
    isUserSelected?: boolean;
    [key: string]: any;
}
export interface IMeetup {
    id: string;
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location: Location;
    attendees?: number;
    categories?: string[];
    status?: string;
    url?: string;
    distance?: number;
    [key: string]: any;
}
export interface IMapMarkerIcons {
    userIcon: DivIcon;
    meetupIcon: DivIcon;
}
export interface IPopupConfig {
    maxWidth?: number;
    minWidth?: number;
    closeButton?: boolean;
    autoPan?: boolean;
    closeOnClick?: boolean;
    className?: string;
}
export interface IMapMarkersProps {
    currentCenter?: Location;
    activeMeetups?: Meetup[];
    icons: MapMarkerIcons;
    getPopupConfig: () => PopupConfig;
    handlePopupOpen?: () => void;
    onMarkerClick?: (location: Location) => void;
    selectedMeetupId?: string;
    highlightSelected?: boolean;
    showPopups?: boolean;
}
export default MapMarkers;
