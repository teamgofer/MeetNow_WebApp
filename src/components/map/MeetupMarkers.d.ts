import React from 'react';
import { LatLngExpression } from 'leaflet';
export interface IMeetup {
    id: string;
    title: string;
    position: LatLngExpression;
    description: string;
    address: string;
    distance: number;
    status: 'active' | 'pending' | 'expired';
    createdAt: string;
    expiresAt: string;
    image_url?: string | null;
    signed_image_url?: string | null;
    starts_at?: string;
    duration_minutes?: number;
}
interface MeetupMarkersProps {
    meetups: IMeetup[];
    onMeetupClick: (id: string) => void;
    selectedMeetupId: string | null;
    showPopups?: boolean;
}
declare const MeetupMarkers: React.FC<MeetupMarkersProps>;
export default MeetupMarkers;
