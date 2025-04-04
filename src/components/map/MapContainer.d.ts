import React from 'react';
import type { ILocation } from '@/types/location';
import type { IMeetup } from '@/types/meetup';
interface IMapContainerProps {
    location?: ILocation;
    selectedLocation?: ILocation | null;
    meetups?: IMeetup[];
    onLocationSelect: (location: ILocation) => void;
    onCreateMeetup?: (meetup: Partial<IMeetup>) => Promise<IMeetup | null>;
    onMapReady?: () => void;
    onClose?: () => void;
    isMapReady?: boolean;
    className?: string;
    children?: React.ReactNode;
}
declare const MapContainer: React.FC<IMapContainerProps>;
export default MapContainer;
