import type React from 'react';
export interface ILocation {
    lat: number;
    lng: number;
    display_name?: string;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp?: number;
    [key: string]: any;
}
export interface IMapNavigationController {
    setUserLocation: (location: Location) => boolean;
    navigateTo: (location: Location, options?: any) => Promise<boolean>;
    [key: string]: any;
}
declare const LeafletGeolocation: React.FC<LeafletGeolocationProps>;
export default LeafletGeolocation;
