import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GeolocateControl } from 'maplibre-gl';
import PropTypes from 'prop-types';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibreGeolocation component that adds a geolocation control to a React Leaflet map
 * This component should be used as a child of MapContainer
 */
const MapLibreGeolocation = ({ 
  position = 'top-right',
  trackUserLocation = true,
  showUserLocation = true,
  showAccuracyCircle = true,
  autoTrigger = false,
  maxZoom = 18
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Create the geolocate control
    const geolocateControl = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation,
      showUserLocation,
      showAccuracyCircle,
      fitBoundsOptions: {
        maxZoom
      }
    });

    // Add the control to the map
    map.addControl(geolocateControl, position);

    // Trigger the control if autoTrigger is true
    if (autoTrigger) {
      // Small delay to ensure the map is fully loaded
      setTimeout(() => {
        geolocateControl.trigger();
      }, 1000);
    }

    // Clean up on unmount
    return () => {
      if (map && geolocateControl) {
        map.removeControl(geolocateControl);
      }
    };
  }, [map, position, trackUserLocation, showUserLocation, showAccuracyCircle, autoTrigger, maxZoom]);

  // This component doesn't render anything visible
  return null;
};

MapLibreGeolocation.propTypes = {
  position: PropTypes.string,
  trackUserLocation: PropTypes.bool,
  showUserLocation: PropTypes.bool,
  showAccuracyCircle: PropTypes.bool,
  autoTrigger: PropTypes.bool,
  maxZoom: PropTypes.number
};

export default MapLibreGeolocation;