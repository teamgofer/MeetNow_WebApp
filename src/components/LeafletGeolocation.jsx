import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

/**
 * Leaflet location control component that adds a geolocation control to a React Leaflet map
 * This component should be used as a child of MapContainer
 */
const LeafletGeolocation = ({ 
  position = 'topright',
  trackUserLocation = true,
  showUserLocation = true,
  showAccuracyCircle = true,
  autoTrigger = false,
  maxZoom = 18,
  onLocationFound = () => {}
}) => {
  const map = useMap();
  const controlRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const mountCountRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 500;
  
  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedRef.current) {
      return;
    }

    // Increment mount count
    mountCountRef.current += 1;
    const currentMount = mountCountRef.current;

    const initializeLocateControl = () => {
      // Skip if this isn't the latest mount
      if (mountCountRef.current !== currentMount) {
        return false;
      }

      // Wait for map to be initialized and container to be available
      if (!map || !map._container || !map._loaded) {
        console.debug('Map container not available yet');
        return false;
      }

      try {
        // Check if a locate control already exists on the map
        const existingControl = Array.from(document.querySelectorAll('.leaflet-control-locate')).find(
          el => el.closest('.leaflet-control-container')?.closest('.leaflet-container') === map._container
        );

        if (existingControl) {
          console.debug('Locate control already exists on map');
          return true;
        }

        // Remove existing control if it exists
        if (controlRef.current) {
          try {
            // Clean up event listeners before removing
            if (controlRef.current._map) {
              // Remove specific event listeners
              const events = ['locationfound', 'locationerror', 'locationstart', 'locationstop'];
              events.forEach(event => {
                try {
                  // Only call off if the map and off method exist
                  if (controlRef.current._map && typeof controlRef.current._map.off === 'function') {
                    controlRef.current._map.off(event);
                  }
                } catch (e) {
                  console.debug(`Error removing ${event} listener:`, e);
                }
              });
              controlRef.current._map = null;
            }
            
            // Only try to remove if the control has a remove method
            if (typeof controlRef.current.remove === 'function') {
              controlRef.current.remove();
            }
          } catch (e) {
            console.debug('Error removing existing control:', e);
          }
        }

        // Create location control
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
            timeout: 10000,
            maximumAge: 0,
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
              onLocationFound(locationData);
            }
          }
        });

        // Patch the _unload method to prevent "Cannot read properties of null" errors
        if (locationControl && locationControl._unload) {
          const originalUnload = locationControl._unload;
          locationControl._unload = function() {
            try {
              // Only call the original _unload if this._map exists and has an off method
              if (this._map && typeof this._map.off === 'function') {
                originalUnload.call(this);
              }
            } catch (e) {
              console.debug('Error in patched _unload method:', e);
            }
          };
        }

        // Store reference to control
        controlRef.current = locationControl;

        // Add control to map only if container is ready and this is still the latest mount
        if (map._loaded && map._container && mountCountRef.current === currentMount) {
          try {
            locationControl.addTo(map);
            console.debug('Locate control initialized successfully');
            hasInitializedRef.current = true;

            // Trigger the control if autoTrigger is true
            if (autoTrigger) {
              // Delay the auto-trigger to ensure user has time to see the control
              setTimeout(() => {
                if (locationControl && locationControl.start && document.hasFocus() && 
                    mountCountRef.current === currentMount) {
                  locationControl.start();
                }
              }, 2000);
            }
            return true;
          } catch (error) {
            console.error('Error adding control to map:', error);
            return false;
          }
        }

        return false;
      } catch (error) {
        console.error('Error initializing locate control:', error);
        return false;
      }
    };

    const tryInitialize = () => {
      // Skip if this isn't the latest mount or if already initialized
      if (mountCountRef.current !== currentMount || hasInitializedRef.current) {
        return;
      }

      if (retryCountRef.current >= MAX_RETRIES) {
        console.error('Max retries reached for locate control initialization');
        return;
      }

      if (!initializeLocateControl()) {
        retryCountRef.current += 1;
        console.debug(`Retrying locate control initialization (${retryCountRef.current}/${MAX_RETRIES})`);
        retryTimeoutRef.current = setTimeout(() => {
          if (mountCountRef.current === currentMount && !hasInitializedRef.current) {
            tryInitialize();
          }
        }, RETRY_DELAY);
      }
    };

    // Start initialization process
    if (map) {
      retryCountRef.current = 0;
      tryInitialize();
    }

    // Clean up on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Only clean up if this is the current mount being unmounted
      if (controlRef.current && mountCountRef.current === currentMount) {
        try {
          // Stop location tracking if it's active
          if (controlRef.current._active && typeof controlRef.current.stop === 'function') {
            try {
              controlRef.current.stop();
            } catch (e) {
              console.debug('Error stopping locate control:', e);
            }
          }
          
          // Clean up event listeners before removing
          if (controlRef.current._map) {
            // Remove specific event listeners
            const events = ['locationfound', 'locationerror', 'locationstart', 'locationstop'];
            events.forEach(event => {
              try {
                if (controlRef.current._map && typeof controlRef.current._map.off === 'function') {
                  controlRef.current._map.off(event);
                }
              } catch (e) {
                console.debug(`Error removing ${event} listener:`, e);
              }
            });
            
            // Safely clear the map reference
            try {
              controlRef.current._map = null;
            } catch (e) {
              console.debug('Error clearing map reference:', e);
            }
          }
          
          // Only try to remove if the map is still available
          if (map && !map._isDestroyed) {
            // Safely remove the control from the map
            try {
              // Check if the control has a remove method and if it's still attached to a map
              if (controlRef.current.remove && controlRef.current._container) {
                controlRef.current.remove();
              }
            } catch (e) {
              console.debug('Error removing control:', e);
            }
          }
          
          // Clear the reference
          controlRef.current = null;
        } catch (e) {
          console.debug('Error during cleanup:', e);
        }
      }
    };
  }, [map, position, trackUserLocation, showUserLocation, showAccuracyCircle, autoTrigger, maxZoom, onLocationFound]);

  // This component doesn't render anything visible
  return null;
};

LeafletGeolocation.propTypes = {
  position: PropTypes.string,
  trackUserLocation: PropTypes.bool,
  showUserLocation: PropTypes.bool,
  showAccuracyCircle: PropTypes.bool,
  autoTrigger: PropTypes.bool,
  maxZoom: PropTypes.number,
  onLocationFound: PropTypes.func
};

export default LeafletGeolocation;