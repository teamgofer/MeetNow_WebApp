import React from 'react';
export interface LocationSearchResult {
    place_id?: string;
    osm_id?: string;
    display_name: string;
    lat: number;
    lon: number;
    address?: {
        city?: string;
        country?: string;
        state?: string;
        road?: string;
        suburb?: string;
        town?: string;
        village?: string;
    };
    type?: string;
    importance?: number;
    distance?: number;
    _source?: string;
}
interface LocationSearchProps {
    onLocationSelect: (location: LocationSearchResult) => void;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}
declare const LocationSearch: React.FC<LocationSearchProps>;
export default LocationSearch;
