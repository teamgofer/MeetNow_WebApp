import React from 'react';
import { IMeetup } from '../map/MeetupMarkers';
interface SelectedMeetupCardProps {
    meetup: IMeetup;
    onClose: () => void;
    onDirections: () => void;
}
declare const SelectedMeetupCard: React.FC<SelectedMeetupCardProps>;
export default SelectedMeetupCard;
