import React from 'react';
import type { INearbyPlace } from '@/types/location';
interface INearbyPlacesProps {
  places: INearbyPlace[];
  className?: string;
}
declare const NearbyPlaces: React.FC<INearbyPlacesProps>;
export default NearbyPlaces;
