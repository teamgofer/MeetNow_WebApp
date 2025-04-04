import React from 'react';
import { IMeetup } from '../map/MeetupMarkers';
import { LocationSearchResult } from '../search/LocationSearch';
import { CardMode } from '../../constants/card-modes';
export interface MeetupFormData {
    title: string;
    description: string;
    duration: number;
    image?: File | null;
    image_url?: string | undefined;
}
export interface UnifiedMeetupCardProps {
    meetup?: IMeetup;
    locationData?: LocationSearchResult;
    mode?: CardMode;
    onClose: () => void;
    onDirections?: (data: IMeetup | LocationSearchResult) => void;
    onCreateMeetup?: (data: MeetupFormData & {
        location: LocationSearchResult;
    }) => Promise<void>;
    onEditMeetup?: (id: string, data: MeetupFormData) => Promise<void>;
    className?: string;
    isLoading?: boolean;
    isDirectionsActive?: boolean;
    awaitingSecondPoint?: boolean;
}
declare const UnifiedMeetupCard: React.FC<UnifiedMeetupCardProps>;
export default UnifiedMeetupCard;
