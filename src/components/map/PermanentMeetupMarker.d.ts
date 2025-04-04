import React from 'react';
import type { DivIcon } from 'leaflet';
import type { IMeetupBase } from '@/types/meetup';
export interface IPermanentMeetupMarkerProps {
  meetup: IMeetupBase;
  icon: DivIcon;
  isSelected?: boolean;
  showPopup?: boolean;
  onMarkerClick?: (meetup: IMeetupBase) => void;
  getPopupConfig: () => {
    className?: string;
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    autoPanPadding?: [number, number];
    keepInView?: boolean;
  };
}
declare const PermanentMeetupMarker: React.FC<IPermanentMeetupMarkerProps>;
export default PermanentMeetupMarker;
