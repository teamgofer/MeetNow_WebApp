import React from 'react';
import { LatLngExpression } from 'leaflet';
import MeetupMarker from './MeetupMarker';

// Define the interface for a meetup
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
  // Add properties for better timing calculation
  starts_at?: string;
  duration_minutes?: number;
}

// Props for the MeetupMarkers component
interface MeetupMarkersProps {
  meetups: IMeetup[];
  onMeetupClick: (id: string) => void;
  selectedMeetupId: string | null;
  showPopups?: boolean;
}

/**
 * Component to display multiple meetup markers on the map
 */
const MeetupMarkers: React.FC<MeetupMarkersProps> = ({
  meetups,
  onMeetupClick,
  selectedMeetupId,
  showPopups = true,
}) => {
  if (!meetups || meetups.length === 0) {
    return null;
  }

  return (
    <>
      {meetups.map(meetup => (
        <MeetupMarker
          key={meetup.id}
          id={meetup.id}
          position={meetup.position}
          title={meetup.title}
          description={meetup.description}
          address={meetup.address}
          distance={meetup.distance}
          expiresAt={meetup.expiresAt}
          createdAt={meetup.createdAt}
          onClick={onMeetupClick}
          selected={selectedMeetupId === meetup.id}
          showPopup={showPopups && selectedMeetupId === meetup.id}
          status={meetup.status}
        />
      ))}
    </>
  );
};

export default MeetupMarkers;
