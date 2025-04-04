import React from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
export interface ILocation {
    lat: number;
    lng: number;
    lon?: number;
    display_name?: string;
    accuracy?: number;
    name?: string;
    tags?: Record<string, any>;
    address?: Record<string, any>;
    _source?: string;
    [key: string]: any;
}
export interface IMeetup {
    id: string;
    title?: string;
    description?: string;
    location: Location;
    [key: string]: any;
}
export interface INavigationOptions {
    zoom?: number;
    animate?: boolean;
    method?: string;
    duration?: number;
    forceCenter?: boolean;
    [key: string]: any;
}
declare const MapComponent: React.ForwardRefExoticComponent<Omit<MapComponentProps, "ref"> & React.RefAttributes<LeafletMap>>;
export default MapComponent;
