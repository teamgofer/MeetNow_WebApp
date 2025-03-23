import React, { useEffect, useRef, useState } from 'react';
import { useMap, Marker } from 'react-leaflet';
import PropTypes from 'prop-types';

const LocationMarker = ({ onLocationSelect, position, icon }) => {
  const map = useMap();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      {position && position.lat && position.lng && (
        <Marker
          position={[position.lat, position.lng]}
          icon={icon}
          className="user-marker"
        />
      )}
      {isGeocoding && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600">
          Getting location details...
        </div>
      )}
    </>
  );
};

LocationMarker.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired,
  icon: PropTypes.object.isRequired
};

export default LocationMarker; 