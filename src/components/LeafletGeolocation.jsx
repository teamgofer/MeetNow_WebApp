import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import LocationService from '../services/LocationService';

/**
 * Leaflet location control component that adds a geolocation control to a React Leaflet map
 * This component should be used as a child of MapContainer
 */
const LeafletGeolocation = ({ 
  position = 'topleft',
  showAccuracyCircle = true,
  trackUserLocation = true,
  maxZoom = 18,
  onLocationFound,
  onLocationError,
  className = '',
  style = {}
}) => {
  const mapRef = useRef(null);
  const locationControlRef = useRef(null);
  const locationServiceRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize location service
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService({
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds
        maximumAge: 300000 // 5 minutes
      });

      // Set up location listener
      locationServiceRef.current.onLocationChange((location) => {
        if (locationControlRef.current) {
          locationControlRef.current._updateMarkerPosition(location);
        }
        if (onLocationFound) {
          onLocationFound(location);
        }
      });

      // Set up error listener
      locationServiceRef.current.onError((error) => {
        if (onLocationError) {
          onLocationError(error);
        }
      });
    }

    // Create location control with enhanced options
        const locationControl = L.control.locate({
          position,
          drawCircle: showAccuracyCircle,
          follow: trackUserLocation,
          setView: 'always',
          keepCurrentZoomLevel: false,
          showCompass: true,
          locateOptions: {
            enableHighAccuracy: true,
            maxZoom,
        timeout: 30000, // 30 seconds
        maximumAge: 300000, // 5 minutes
            watch: true
          },
          strings: {
            title: "Find my location",
            popup: "You are within {distance} {unit} from this point",
            outsideMapBoundsMsg: "You seem to be located outside the map boundaries"
          },
          flyTo: true,
          clickBehavior: {
            inView: 'stop',
            outOfView: 'setView',
            inViewNotFollowing: 'setView'
          },
          onLocationError: (err) => {
            console.warn('Location error:', err);
        if (onLocationError) {
          onLocationError(err);
        }
        // Try to use cached location if available
        if (locationServiceRef.current?.locationCache.location) {
          const cachedLocation = locationServiceRef.current.locationCache.location;
          if (locationControlRef.current) {
            locationControlRef.current._updateMarkerPosition(cachedLocation);
          }
          if (onLocationFound) {
            onLocationFound(cachedLocation);
          }
        }
          },
          onLocationFound: (e) => {
            if (e && typeof e.latitude === 'number' && typeof e.longitude === 'number') {
              const locationData = {
                lat: e.latitude,
                lng: e.longitude,
                accuracy: e.accuracy,
                heading: e.heading,
                speed: e.speed,
                display_name: 'Your Location'
              };
          if (onLocationFound) {
              onLocationFound(locationData);
          }
            }
          }
        });

    // Store reference to control
    locationControlRef.current = locationControl;

    // Add control to map
    locationControl.addTo(mapRef.current);

    // Start location tracking
    locationServiceRef.current.startTracking().catch((error) => {
      console.warn('Failed to start location tracking:', error);
      // Try to use cached location if available
      if (locationServiceRef.current?.locationCache.location) {
        const cachedLocation = locationServiceRef.current.locationCache.location;
        if (locationControlRef.current) {
          locationControlRef.current._updateMarkerPosition(cachedLocation);
        }
        if (onLocationFound) {
          onLocationFound(cachedLocation);
        }
      }
    });

    // Clean up on unmount
    return () => {
      if (locationControlRef.current) {
        locationControlRef.current.remove();
      }
      if (locationServiceRef.current) {
        locationServiceRef.current.stopTracking();
        locationServiceRef.current.removeAllListeners();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [position, showAccuracyCircle, trackUserLocation, maxZoom, onLocationFound, onLocationError]);

  return null;
};

LeafletGeolocation.propTypes = {
  position: PropTypes.string,
  showAccuracyCircle: PropTypes.bool,
  trackUserLocation: PropTypes.bool,
  maxZoom: PropTypes.number,
  onLocationFound: PropTypes.func,
  onLocationError: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object
};

export default LeafletGeolocation;