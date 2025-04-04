import React from 'react';
import type { ILocationWithStats } from '@/types/location';
import type { IMeetupData } from '@/types/meetup';
interface ITemporaryLocationMarkerCardProps {
  location: ILocationWithStats;
  onCreateMeetup?: (meetup: IMeetupData) => void;
  className?: string;
  onClose?: () => void;
}
declare const TemporaryLocationMarkerCard: React.FC<ITemporaryLocationMarkerCardProps>;
export default TemporaryLocationMarkerCard;
