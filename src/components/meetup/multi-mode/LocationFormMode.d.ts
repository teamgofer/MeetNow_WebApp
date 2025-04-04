import React from 'react';
import { LocationSearchResult } from '../../search/LocationSearch';
export interface MeetupFormData {
    title: string;
    description: string;
    duration: number;
    image?: File | null;
}
export interface LocationFormModeProps {
    location: LocationSearchResult;
    onSubmit: (data: MeetupFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}
declare const LocationFormMode: React.FC<LocationFormModeProps>;
export default LocationFormMode;
