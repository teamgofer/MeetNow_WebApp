import React, { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import Logger from '../../utils/Logger';

// This component creates a flight path animation between user and selected location
const BirdsEyePathOverlay = ({ 
  userLocation, 
  selectedLocation,
  customStartIcon,
  customEndIcon,
  navigationController
}) => {
  const map = useMap();
  const pathRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const planeMarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastSelectedLocationRef = useRef(null);
  const stylesInitializedRef = useRef(false);
  const pathCreationCountRef = useRef(0);
  const [pathUpdateTrigger, setPathUpdateTrigger] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // Subscribe to navigation controller mode changes
  useEffect(() => {
    if (navigationController) {
      // Create local handler function
      const handleModeChange = (mode) => {
        // Bird's Eye View is mode 2
        setIsActive(mode === 2);
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
      if (navigationController.currentMode === 2) {
        setIsActive(true);
      }
      
      return () => {
        // Restore original callback on cleanup
        if (navigationController) {
          navigationController.onModeChange = originalCallback;
        }
      };
    } else {
      // If no controller, check map state directly
      const checkMapState = () => {
        if (map && map._birdEyeViewActive) {
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      };
      
      // Initial check
      checkMapState();
      
      // Listen for birdseyeview event
      map.on('birdseyeview', (e) => {
        setIsActive(e.active);
      });
      
      return () => {
        map.off('birdseyeview');
      };
    }
  }, [navigationController, map]);
  
  // Cleanup function to remove previous paths
  const cleanup = () => {
    Logger.debug('BirdsEyePathOverlay', 'Cleaning up flight path elements');
    
    // Clear any running animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove path
    if (pathRef.current) {
      map.removeLayer(pathRef.current);
      pathRef.current = null;
    }
    
    // Remove start marker
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    
    // Remove end marker
    if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }
    
    // Remove plane marker
    if (planeMarkerRef.current) {
      map.removeLayer(planeMarkerRef.current);
      planeMarkerRef.current = null;
    }
    
    // Clear path points from map
    if (map._birdsEyePathPoints) {
      delete map._birdsEyePathPoints;
    }
  };
  
  // Create special styles for the flight path animation - only when needed
  const createFlightPathStyles = () => {
    if (document.getElementById('birds-eye-flight-path-styles')) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'birds-eye-flight-path-styles';
    styleElement.innerHTML = `
      @keyframes dash {
        to {
          stroke-dashoffset: 1000;
        }
      }
      
      .flight-path {
        animation: dash 20s linear infinite;
        stroke-dasharray: 10, 10;
      }
      
      .start-point {
        animation: pulse 1.5s infinite;
      }
      
      .end-point {
        animation: pulse 1.5s infinite;
      }
      
      .plane-icon {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        transition: transform 0.3s ease;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
        }
        
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
        }
        
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
        }
      }
    `;
    
    document.head.appendChild(styleElement);
    stylesInitializedRef.current = true;
  };
  
  // Create curved path between two points
  const createCurvedPath = (start, end, curvature = 0.3) => {
    try {
      // Thorough input validation
      if (!start || !end) {
        Logger.error('BirdsEyePathOverlay', 'Missing start or end point for path');
        return [];
      }
      
      // Normalize the input to ensure we have lat/lng values
      let startLatLng, endLatLng;
      
      if (Array.isArray(start)) {
        if (start.length < 2 || typeof start[0] !== 'number' || typeof start[1] !== 'number') {
          Logger.error('BirdsEyePathOverlay', 'Invalid array coordinates for start point', start);
          return [];
        }
        startLatLng = [start[0], start[1]];
      } else if (start && typeof start.lat === 'number' && typeof start.lng === 'number') {
        startLatLng = [start.lat, start.lng];
      } else {
        Logger.error('BirdsEyePathOverlay', 'Invalid start point format', start);
        return [];
      }
      
      if (Array.isArray(end)) {
        if (end.length < 2 || typeof end[0] !== 'number' || typeof end[1] !== 'number') {
          Logger.error('BirdsEyePathOverlay', 'Invalid array coordinates for end point', end);
          return [];
        }
        endLatLng = [end[0], end[1]];
      } else if (end && typeof end.lat === 'number' && typeof end.lng === 'number') {
        endLatLng = [end.lat, end.lng];
      } else {
        Logger.error('BirdsEyePathOverlay', 'Invalid end point format', end);
        return [];
      }
      
      // Check for NaN or invalid values
      if (isNaN(startLatLng[0]) || isNaN(startLatLng[1]) || 
          isNaN(endLatLng[0]) || isNaN(endLatLng[1])) {
        Logger.error('BirdsEyePathOverlay', 'Coordinates contain NaN values', { 
          start: startLatLng, 
          end: endLatLng 
        });
        return [];
      }
      
      // Check for identical start and end points
      if (Math.abs(startLatLng[0] - endLatLng[0]) < 0.000001 && 
          Math.abs(startLatLng[1] - endLatLng[1]) < 0.000001) {
        Logger.warn('BirdsEyePathOverlay', 'Start and end points are identical, creating minimal path');
        // Return a minimal path with small offset to avoid issues
        return [
          startLatLng,
          [startLatLng[0] + 0.0001, startLatLng[1] + 0.0001],
          endLatLng
        ];
      }
      
      const latlngs = [];
      
      // Add starting point
      latlngs.push(startLatLng);
      
      // Calculate the midpoint
      const midLat = (startLatLng[0] + endLatLng[0]) / 2;
      const midLng = (startLatLng[1] + endLatLng[1]) / 2;
      
      // Calculate distance between points
      const dx = endLatLng[1] - startLatLng[1]; 
      const dy = endLatLng[0] - startLatLng[0];
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Create curved path points
      const steps = Math.max(Math.floor(dist * 5), 12); // More points for longer paths
      
      // Calculate the control point height (perpendicular to the line)
      const curveHeight = dist * curvature;
      
      // Create control point perpendicular to the line
      const nx = -dy / dist; // Normalized perpendicular vector
      const ny = dx / dist;
      
      const cpLat = midLat + nx * curveHeight;
      const cpLng = midLng + ny * curveHeight;
      
      // Add bezier curve points
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const t1 = 1 - t;
        
        // Quadratic bezier formula
        const lat = t1 * t1 * startLatLng[0] + 2 * t1 * t * cpLat + t * t * endLatLng[0];
        const lng = t1 * t1 * startLatLng[1] + 2 * t1 * t * cpLng + t * t * endLatLng[1];
        
        latlngs.push([lat, lng]);
      }
      
      // Add ending point
      latlngs.push(endLatLng);
      
      return latlngs;
    } catch (error) {
      Logger.error('BirdsEyePathOverlay', 'Error creating curved path', error);
      return [];
    }
  };

  // Create a plane icon for the animation - only called when needed
  const createPlaneIcon = () => {
    return L.divIcon({
      html: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="plane-icon">
          <path d="M22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2C9.34784 2 6.8043 3.05357 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C6.8043 20.9464 9.34784 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12Z" stroke="#4F46E5" stroke-width="2"/>
          <path d="M16 8L8 16" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8L8 12" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 12L12 16" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      className: 'flight-plane',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Start the plane animation along the path
  const startPlaneAnimation = (points) => {
    if (!points || points.length < 2 || !planeMarkerRef.current) {
      return;
    }
    
    let currentIndex = 0;
    const totalPoints = points.length;
    const animationSpeed = 0.05; // Lower is slower
    
    // Animation function using requestAnimationFrame
    const animate = () => {
      // Increment position
      currentIndex += animationSpeed;
      
      // Loop back if we reached the end
      if (currentIndex >= totalPoints - 1) {
        currentIndex = 0;
      }
      
      // Get the current point
      const currentIndexFloor = Math.floor(currentIndex);
      const nextIndex = (currentIndexFloor + 1) % totalPoints;
      
      // Interpolate between current and next point
      const t = currentIndex - currentIndexFloor;
      const currentPoint = points[currentIndexFloor];
      const nextPoint = points[nextIndex];
      
      // Calculate interpolated position
      const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * t;
      const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * t;
      
      // Update marker position
      planeMarkerRef.current.setLatLng([lat, lng]);
      
      // Calculate rotation angle from current to next point
      const angle = Math.atan2(
        nextPoint[1] - currentPoint[1],
        nextPoint[0] - currentPoint[0]
      ) * (180 / Math.PI);
      
      // Rotate the plane icon to face the direction of travel
      if (planeMarkerRef.current._icon) {
        const iconElement = planeMarkerRef.current._icon.querySelector('.plane-icon');
        if (iconElement) {
          iconElement.style.transform = `rotate(${angle + 90}deg)`;
        }
      }
      
      // Continue the animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Main effect to create/update the flight path when active
  useEffect(() => {
    if (isActive && map) {
      // Create styles if not already created
      if (!stylesInitializedRef.current) {
        createFlightPathStyles();
      }
      
      // Validate both locations before proceeding
      if (!userLocation || !selectedLocation ||
          typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number' ||
          typeof selectedLocation.lat !== 'number' || typeof selectedLocation.lng !== 'number') {
        Logger.warn('BirdsEyePathOverlay', 'Invalid location data, cannot create path', {
          userLocation,
          selectedLocation
        });
        cleanup(); // Clean up any existing path
        return;
      }
      
      // Check if selected location has changed
      const selectedLocationChanged = 
        !lastSelectedLocationRef.current || 
        lastSelectedLocationRef.current.lat !== selectedLocation.lat || 
        lastSelectedLocationRef.current.lng !== selectedLocation.lng;
      
      // Also check if user location has changed significantly
      const userLocationChanged = 
        !lastSelectedLocationRef.current ||
        !lastSelectedLocationRef.current._userLat ||
        Math.abs(lastSelectedLocationRef.current._userLat - userLocation.lat) > 0.0001 ||
        Math.abs(lastSelectedLocationRef.current._userLng - userLocation.lng) > 0.0001;
      
      if (selectedLocationChanged || userLocationChanged) {
        Logger.debug('BirdsEyePathOverlay', 'Location changed, updating flight path');
        
        // Store both locations for change detection
        lastSelectedLocationRef.current = { 
          ...selectedLocation,
          _userLat: userLocation.lat,
          _userLng: userLocation.lng
        };
        
        // Clean up previous path elements
        cleanup();
        
        // Create curved path between user and selected location
        const pathPoints = createCurvedPath(userLocation, selectedLocation);
        
        // If path creation failed, don't proceed
        if (!pathPoints || pathPoints.length < 2) {
          Logger.warn('BirdsEyePathOverlay', 'Failed to create path points');
          return;
        }
        
        // Store path on map for other components to access
        map._birdsEyePathPoints = pathPoints;
        
        try {
          // Create visually appealing path with proper styling
          pathRef.current = L.polyline(pathPoints, {
            color: '#4F46E5', // Indigo color
            weight: 3,
            opacity: 0.7,
            className: 'flight-path',
            smoothFactor: 1
          }).addTo(map);
          
          // Create start point marker (user location)
          const startIcon = customStartIcon || L.divIcon({
            className: 'start-point-container',
            html: '<div class="start-point" style="width: 14px; height: 14px; background-color: #4F46E5; border-radius: 50%; box-shadow: 0 0 0 2px white;"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          
          startMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: startIcon,
            zIndexOffset: 1000
          }).addTo(map);
          
          // Create end point marker (selected location)
          const endIcon = customEndIcon || L.divIcon({
            className: 'end-point-container',
            html: '<div class="end-point" style="width: 14px; height: 14px; background-color: #7C3AED; border-radius: 50%; box-shadow: 0 0 0 2px white;"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          
          endMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
            icon: endIcon,
            zIndexOffset: 1000
          }).addTo(map);
          
          // Add plane marker for animation
          planeMarkerRef.current = L.marker(pathPoints[0], {
            icon: createPlaneIcon(),
            zIndexOffset: 1001
          }).addTo(map);
          
          // Start the plane animation along the path
          startPlaneAnimation(pathPoints);
          
          // Increment path creation counter for debugging
          pathCreationCountRef.current += 1;
          Logger.debug('BirdsEyePathOverlay', `Path created (count: ${pathCreationCountRef.current})`);
          
          // NOTE: We no longer handle map positioning here
          // Map positioning is now managed by MapNavigationController.showBirdsEyeView
          // This avoids duplicate animations when locations change
        } catch (error) {
          Logger.error('BirdsEyePathOverlay', 'Error creating path elements', error);
          cleanup(); // Clean up partially created elements
        }
      }
    } else {
      // Clean up if component is not active
      cleanup();
    }
    
    // Clean up on unmount
    return () => {
      cleanup();
    };
  }, [isActive, userLocation, selectedLocation, pathUpdateTrigger, map, customStartIcon, customEndIcon]);
  
  // Effect for handling native map events
  useEffect(() => {
    // Define handler for birdseyeview event from maps or other components
    const handleBirdsEyeView = (e) => {
      if (e.active && !isActive) {
        // Mode was enabled
        setIsActive(true);
        setPathUpdateTrigger(prev => prev + 1);
      } else if (!e.active && isActive) {
        // Mode was disabled
        setIsActive(false);
      }
    };
    
    // Listen for birdseyeview event
    if (map) {
      map.on('birdseyeview', handleBirdsEyeView);
    }
    
    // Clean up listener on unmount
    return () => {
      if (map) {
        map.off('birdseyeview', handleBirdsEyeView);
      }
    };
  }, [map, isActive]);
  
  // This component doesn't render any visible React elements
  return null;
};

BirdsEyePathOverlay.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  customStartIcon: PropTypes.object,
  customEndIcon: PropTypes.object,
  navigationController: PropTypes.object
};

export default BirdsEyePathOverlay; 