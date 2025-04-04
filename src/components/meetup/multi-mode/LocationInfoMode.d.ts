import React from 'react';
import { LocationSearchResult } from '../../search/LocationSearch';
export interface LocationInfoModeProps {
    location: LocationSearchResult;
    onCreateMeetup: () => void;
    onGetDirections?: (location: LocationSearchResult) => void;
}
declare const LocationInfoMode: React.FC<LocationInfoModeProps>;
export default LocationInfoMode;
