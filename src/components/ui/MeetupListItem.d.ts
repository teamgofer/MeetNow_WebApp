import React from 'react';
export interface ILocation {
    lat: number;
    lng: number;
}
export interface IMeetup {
    id: string;
    location: ILocation;
    address: string;
    title?: string;
    description?: string;
    created_at: string;
    expires_at: string;
    status: 'active' | 'cancelled';
    image?: string;
}
export interface IMeetupListItemProps {
    meetup: IMeetup;
    currentLocation: ILocation;
    isSelected: boolean;
    colorScheme: 'A' | 'B';
    onSelect: (id: string) => void;
    onHover?: (id: string | null) => void;
    useStopwatch?: boolean;
}
export declare const MeetupListItem: React.FC<IMeetupListItemProps>;
export default MeetupListItem;
