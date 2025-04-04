import React from 'react';
import { LocationSearchResult } from '../../search/LocationSearch';
import { MeetupFormData } from './LocationFormMode';
export declare enum MeetupCardMode {
    LOCATION_INFO = "location_info",
    CREATE_FORM = "create_form",
    HIDDEN = "hidden"
}
export interface MultiModeMeetupCardProps {
    location?: LocationSearchResult;
    onClose: () => void;
    onCreateMeetup?: (data: MeetupFormData & {
        location: LocationSearchResult;
    }) => Promise<void>;
    onGetDirections?: (location: LocationSearchResult) => void;
    className?: string;
    isLoading?: boolean;
}
declare const MultiModeMeetupCard: React.FC<MultiModeMeetupCardProps>;
export default MultiModeMeetupCard;
