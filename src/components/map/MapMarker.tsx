import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { LatLngExpression, DivIcon, Icon } from 'leaflet';

interface MapMarkerProps {
  position: LatLngExpression;
  popupContent?: React.ReactNode;
  icon?: DivIcon | Icon;
  title?: string;
  onClick?: (e: L.LeafletMouseEvent) => void;
  zIndexOffset?: number;
  opacity?: number;
  markerId?: string | number;
  showPopup?: boolean;
  markerClass?: string;
}

/**
 * A reusable map marker component that handles interaction and popup display
 */
const MapMarker: React.FC<MapMarkerProps> = ({
  position,
  popupContent,
  icon,
  title = '',
  onClick,
  zIndexOffset = 0,
  opacity = 1,
  markerId,
  showPopup = false,
  markerClass = '',
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(showPopup);

  // Handle showing/hiding popup based on prop changes
  useEffect(() => {
    setIsPopupOpen(showPopup);
  }, [showPopup]);

  // Create event handler for marker click
  const handleMarkerClick = (e: L.LeafletMouseEvent) => {
    setIsPopupOpen(true);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Marker
      position={position}
      icon={icon}
      title={title}
      eventHandlers={{
        click: handleMarkerClick,
      }}
      zIndexOffset={zIndexOffset}
      opacity={opacity}
      key={`marker-${markerId || position.toString()}`}
    >
      {popupContent && (
        <Popup autoPan={true} closeButton={true} className="marker-popup">
          {popupContent}
        </Popup>
      )}
    </Marker>
  );
};

export default MapMarker;
