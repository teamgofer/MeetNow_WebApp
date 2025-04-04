import type React from 'react';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import { isValidLocation } from '../../lib/map/utils';
import type { Location } from '../../types';

interface IMapUpdaterProps {
  center: Location;
  zoom: number;
  selectedLocation: Location | null;
  onUpdate: (location: Location) => void;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, zoom, selectedLocation, onUpdate }) => {
  const map = useMap();

  useEffect(() => {
    if (!isValidLocation(center)) {
      return;
    }

    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    if (!selectedLocation ?? !isValidLocation(selectedLocation)) {
      return;
    }

    map.setView([selectedLocation.lat, selectedLocation.lng], zoom);
  }, [selectedLocation, zoom, map]);

  return null;
};

export default MapUpdater;
