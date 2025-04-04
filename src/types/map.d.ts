import type { Location } from './common';
import type { Meetup } from './meetup';
export interface IMapViewport {
    center: Location;
    zoom: number;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}
export interface IMapMarker {
    id: string;
    position: Location;
    type: 'user' | 'meetup' | 'selected';
    meetup?: Meetup;
    icon?: string;
    popupContent?: React.ReactNode;
    zIndexOffset?: number;
}
export interface IMapNavigationOptions {
    zoom?: number;
    animate?: boolean;
    forceCenter?: boolean;
    duration?: number;
}
export interface IMapNavigationController {
    onReady: (isReady: boolean) => void;
    onLocationChange: (location: Location) => void;
    onMapClick: (event: any) => void;
    onLocationSelect: (location: Location) => void;
    onReverseGeocodingStart: () => void;
    onReverseGeocodingEnd: (address: string) => void;
    onSearchAddressUpdate: (displayName: string) => void;
    onError: (error: Error) => void;
    dispose: () => void;
    updateMapReference: (map: any) => boolean;
    navigateTo: (location: Location, options?: MapNavigationOptions) => Promise<boolean>;
    setUserLocation: (location: Location) => void;
    setSelectedLocation: (location: Location) => void;
}
export interface IMapComponentProps {
    location: Location | null;
    selectedLocation: Location | null;
    onLocationSelect: (location: Location) => void;
    navigationController: MapNavigationController | null;
    matchedMeetups: Meetup[];
    children?: React.ReactNode;
    onZoomChange?: (zoom: number) => void;
    initialZoom?: number;
    onMapClick?: (event: L.LeafletMouseEvent) => void;
    onSearchRadiusChange?: (radius: number) => void;
}
export interface IMapMarkerProps {
    id: string;
    position: Location;
    type: 'user' | 'meetup' | 'selected';
    meetup?: Meetup;
    icon?: string;
    popupContent?: React.ReactNode;
    zIndexOffset?: number;
    onClick?: () => void;
}
export interface IMapSearchResult {
    display_name: string;
    lat: number;
    lng: number;
    type: string;
    importance?: number;
    address?: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
}
