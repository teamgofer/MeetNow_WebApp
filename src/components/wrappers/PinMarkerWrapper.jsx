import L from 'leaflet';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';

const PinMarkerWrapper = ({
  id,
  position,
  icon,
  popupContent,
  isVisible = true,
  zIndexOffset = 0,
  eventHandlers = {},
  className = '',
  ...props
}) => {
  const markerRef = useRef(null);

  // Default icon if none provided
  const defaultIcon = L.divIcon({
    className: `custom-marker ${className}`,
    html: `
      <div class="marker-pin"></div>
      <div class="marker-pulse"></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  // Handle marker visibility
  useEffect(() => {
    if (markerRef.current) {
      if (isVisible) {
        markerRef.current.getElement().classList.remove('hidden');
      } else {
        markerRef.current.getElement().classList.add('hidden');
      }
    }
  }, [isVisible]);

  // Handle position updates
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  if (!isVisible || !position) return null;

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon || defaultIcon}
      zIndexOffset={zIndexOffset}
      eventHandlers={eventHandlers}
      {...props}
    >
      {popupContent && <Popup>{popupContent}</Popup>}
    </Marker>
  );
};

PinMarkerWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  icon: PropTypes.object,
  popupContent: PropTypes.node,
  isVisible: PropTypes.bool,
  zIndexOffset: PropTypes.number,
  eventHandlers: PropTypes.object,
  className: PropTypes.string,
};

export default PinMarkerWrapper;
