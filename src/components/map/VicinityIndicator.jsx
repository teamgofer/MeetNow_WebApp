import React, { useEffect, useState } from 'react';
import { Circle, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import Logger from '../../utils/Logger';

/**
 * A simple, clean vicinity indicator that shows a static circle around the user's location
 * when in vicinity mode. This creates a subtle visual indicator without distracting animations.
 */
const VicinityIndicator = ({ 
  userLocation, 
  radiusMeters = 150,
  navigationController
}) => {
  const map = useMap();
  const [isVicinityMode, setIsVicinityMode] = useState(false);
  
  // Listen to navigation controller mode changes
  useEffect(() => {
    if (navigationController) {
      // Create local handler function
      const handleModeChange = (mode) => {
        // Vicinity mode is 3
        setIsVicinityMode(mode === 3);
      };
      
      // Store the original callback if it exists
      const originalCallback = navigationController.onModeChange;
      
      // Set our callback as the new handler
      navigationController.onModeChange = (newMode, previousMode) => {
        // Call our local handler
        handleModeChange(newMode);
        
        // Call the original callback if it exists and is a function
        if (typeof originalCallback === 'function') {
          originalCallback(newMode, previousMode);
        }
      };
      
      // Check initial mode
      if (navigationController.currentMode === 3) {
        setIsVicinityMode(true);
      }
      
      return () => {
        // Restore original callback on cleanup
        if (navigationController) {
          navigationController.onModeChange = originalCallback;
        }
      };
    } else {
      // Fallback to map events if no controller
      const handleVicinityMode = (e) => {
        setIsVicinityMode(e.active === true);
      };
      
      if (map) {
        // Listen for vicinitymode events
        map.on('vicinitymode', handleVicinityMode);
        
        // Check if map is already in vicinity mode
        if (map._vicinityActive) {
          setIsVicinityMode(true);
        }
      }
      
      return () => {
        if (map) {
          map.off('vicinitymode', handleVicinityMode);
        }
      };
    }
  }, [navigationController, map]);
  
  // Don't render if we don't have a user location or aren't in vicinity mode
  if (!isVicinityMode || !userLocation || !userLocation.lat || !userLocation.lng) {
    return null;
  }
  
  return (
    <>
      {/* Main vicinity circle - semi-transparent blue */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={radiusMeters}
        pathOptions={{
          color: '#4F46E5', // Indigo
          weight: 2,
          dashArray: '5, 5', // Dashed line for a subtle effect
          fillColor: '#4F46E5',
          fillOpacity: 0.05,
          opacity: 0.6
        }}
      />
      
      {/* Inner circle - creates a visual anchor point */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={radiusMeters / 4}
        pathOptions={{
          color: '#10B981', // Green
          weight: 1.5,
          fillColor: '#10B981',
          fillOpacity: 0.1,
          opacity: 0.7
        }}
      />
    </>
  );
};

VicinityIndicator.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  radiusMeters: PropTypes.number,
  navigationController: PropTypes.object
};

export default VicinityIndicator; 