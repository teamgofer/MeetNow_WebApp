import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapClickHandlerProps {
  onMapClick: (e: L.LeafletMouseEvent) => void;
}

/**
 * Component that attaches click handlers to the map
 * This component doesn't render anything visible
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Add click handler to map
    map.on('click', onMapClick);

    // Cleanup function to remove event handler when component unmounts
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  // This component doesn't render anything
  return null;
};

export default MapClickHandler;
