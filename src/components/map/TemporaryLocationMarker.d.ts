import React from 'react';
import type { DivIcon } from 'leaflet';
import type { ILocation } from '@/types/common';
import type { IMeetupData } from '@/types/meetup';
export interface ITemporaryLocationMarkerProps {
  location: ILocation;
  icon: DivIcon;
  showPopup?: boolean;
  onPopupOpen?: (id: string) => void;
  onCreateMeetup?: (meetup: IMeetupData) => void;
  onClose?: () => void;
}
declare const TemporaryLocationMarker: React.FC<ITemporaryLocationMarkerProps>;
export default TemporaryLocationMarker;
