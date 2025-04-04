import React from 'react';
export interface ILocationMarkerCardProps {
  title: string;
  description?: string | null;
  address?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  distance?: number | null;
  imageUrl?: string | null;
  className?: string;
}
declare const LocationMarkerCard: React.FC<ILocationMarkerCardProps>;
export default LocationMarkerCard;
