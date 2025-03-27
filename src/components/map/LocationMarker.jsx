import React, { useEffect, useRef, useState } from 'react';
import { useMap, Marker } from 'react-leaflet';
import PropTypes from 'prop-types';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

const LocationMarker = ({ onLocationSelect, position, icon }) => {
  const map = useMap();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const abortControllerRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    // Track component initialization
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('map', 'locationMarkerInit', duration, {
      success: true,
      hasPosition: !!position,
      hasIcon: !!icon
    });
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Track position updates
  useEffect(() => {
    if (position) {
      const startTime = Date.now();
      PerformanceMonitor.trackOperationTiming('map', 'locationMarkerUpdate', 0, {
        success: true,
        lat: position.lat,
        lng: position.lng,
        hasIcon: !!icon
      });
    }
  }, [position, icon]);

  return (
    <>
      {position && position.lat && position.lng && (
        <Marker
          position={[position.lat, position.lng]}
          icon={icon}
          className="user-marker"
          eventHandlers={{
            click: () => {
              const startTime = Date.now();
              if (onLocationSelect) {
                onLocationSelect(position);
                const duration = Date.now() - startTime;
                PerformanceMonitor.trackOperationTiming('map', 'locationMarkerClick', duration, {
                  success: true,
                  lat: position.lat,
                  lng: position.lng
                });
              }
            }
          }}
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