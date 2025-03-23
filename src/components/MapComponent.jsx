/**
 * MeetNow - Real-time Local Meetup Platform
 * Copyright (c) 2025 Arthur Maslo and Team Gofer. All Rights Reserved.
 * 
 * This file is part of the MeetNow Software.
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { createMapIcons } from '../utils/map-icons';
import { getSystemInfo, getAdaptiveConfig } from '../utils/system-detection';
import ErrorBoundary from './ErrorBoundary';
import BottomSheet from './BottomSheet';
import MapUpdater from './map/MapUpdater';
import LocationMarker from './map/LocationMarker';
import MapMarkers from './map/MapMarkers';
import BirdsEyePathOverlay from './map/BirdsEyePathOverlay';
import LeafletGeolocation from './LeafletGeolocation';
import MapViewControlBar from './MapViewControlBar';
import VicinityIndicator from './map/VicinityIndicator';
import Logger from '../utils/Logger';

// Import our new modular map utilities
import { TILE_SERVERS, MAP_CONSTANTS, MAP_STYLES } from '../lib/map/config';
import { useMapZoom, useMeetupBounds, useMapResize } from '../lib/map/hooks';
import { initializeLeaflet, isValidLocation } from '../lib/map/utils';

// Initialize Leaflet
initializeLeaflet();

// Create map icons
const createIcons = () => {
  const icons = createMapIcons();
  return {
    userIcon: icons.userIcon,
    meetupIcon: icons.meetupIcon
  };
};

// Ensure Leaflet is properly initialized
if (!L.Icon.Default.imagePath) {
  L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
}

// Add CORS-enabled tile servers with HTTPS
const TILE_SERVERS_LIST = [
  {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous'
  },
  {
    url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous'
  },
  {
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous'
  }
];

const MapComponent = forwardRef(({ 
  location, 
  matchedMeetups = [], 
  onLocationSelect, 
  children, 
  onZoomChange, 
  initialZoom = MAP_CONSTANTS.DEFAULT_ZOOM,
  onMapClick,
  onSearchRadiusChange,
  selectedLocation = null,
  navigationController = null,
}, ref) => {
  // Use mapRef internally - we'll sync this with the forwarded ref
  const mapRef = useRef(null);
  const instantMeetupRef = useRef(null);

  // State
  const [currentCenter, setCurrentCenter] = useState(() => 
    isValidLocation(location) ? {
      lat: location.lat,
      lng: location.lng
    } : null
  );
  const [isWaitingForLocation, setIsWaitingForLocation] = useState(!location);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);
  const [localSelectedLocation, setLocalSelectedLocation] = useState(selectedLocation);
  const [icons] = useState(createIcons);
  const [systemInfo] = useState(getSystemInfo());
  const [adaptiveConfig] = useState(getAdaptiveConfig());
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [shouldUseAdaptiveLayout, setShouldUseAdaptiveLayout] = useState(false);
  const [shouldUseCompactLayout, setShouldUseCompactLayout] = useState(false);
  const [localMeetups, setLocalMeetups] = useState(matchedMeetups);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [currentTileServer, setCurrentTileServer] = useState(0);
  const [tileLoadErrors, setTileLoadErrors] = useState(0);
  const isInitialMount = useRef(true);
  const [currentNavigationMode, setCurrentNavigationMode] = useState(navigationController ? navigationController.currentMode : 1);
  const [flightPathKey, setFlightPathKey] = useState(Date.now());
  // Reference to store the interval ID for location updates
  const locationUpdateIntervalRef = useRef(null);
  // Store the user's manually set zoom level
  const userSetZoomRef = useRef(null);
  
  // Effect to register the map with the navigation controller
  useEffect(() => {
    if (mapRef.current && navigationController) {
      Logger.debug('MapComponent', 'Registering map with navigation controller');
      
      // Register the map reference and check if it was successful
      const registrationSuccess = navigationController.updateMapReference(mapRef);
      
      if (!registrationSuccess) {
        // If registration failed, try again after a short delay to allow the map to fully initialize
        const retryTimeout = setTimeout(() => {
          Logger.debug('MapComponent', 'Retrying map registration with navigation controller');
          navigationController.updateMapReference(mapRef);
        }, 500);
        
        return () => clearTimeout(retryTimeout);
      }
    }
  }, [mapRef.current, navigationController]);
  
  // Effect to update map when navigation mode changes from controller
  useEffect(() => {
    if (navigationController) {
      // Create handler function for mode changes
      const handleModeChange = (newMode) => {
        Logger.debug('MapComponent', `Navigation mode changed from controller: ${newMode}`);
        setCurrentNavigationMode(newMode);
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
      
      // Get initial mode from controller
      setCurrentNavigationMode(navigationController.currentMode);
      
      return () => {
        // Restore original callback on cleanup
        if (navigationController) {
          navigationController.onModeChange = originalCallback;
        }
      };
    }
  }, [navigationController]);

  // Effect to handle location changes from the controller
  useEffect(() => {
    if (navigationController) {
      // Create handler for location changes
      const handleLocationChange = (updatedLocation) => {
        Logger.debug('MapComponent', 'Location change from controller', updatedLocation);
        
        // Update the map view based on the current navigation mode
        if (mapRef.current && updatedLocation) {
          // In vicinity mode, always center on user location
          if (currentNavigationMode === 3) {
            Logger.debug('MapComponent', 'Updating map view in vicinity mode with new location');
            
            // Get current zoom or use a default high zoom for vicinity
            const zoomToUse = userSetZoomRef.current || 18;
            
            mapRef.current.setView(
              [updatedLocation.lat, updatedLocation.lng], 
              zoomToUse, 
              { animate: true }
            );
          }
        }
      };
      
      // Store the original callback if it exists
      const originalLocationCallback = navigationController.onLocationChange;
      
      // Set our callback as the new handler
      navigationController.onLocationChange = (updatedLocation) => {
        // Call our local handler
        handleLocationChange(updatedLocation);
        
        // Call the original callback if it exists and is a function
        if (typeof originalLocationCallback === 'function') {
          originalLocationCallback(updatedLocation);
        }
      };
      
      return () => {
        // Restore original callback on cleanup
        if (navigationController) {
          navigationController.onLocationChange = originalLocationCallback;
        }
      };
    }
  }, [navigationController, currentNavigationMode]);

  // Memoized values
  const activeMeetups = useMemo(() => {
    const now = new Date();
    return localMeetups.filter(meetup => {
      const isActive = meetup.status === 'active';
      
      // Check expiration using either approach
      let isNotExpired = false;
      if (meetup.expires_at) {
        // Legacy approach
        isNotExpired = new Date(meetup.expires_at) > now;
      } else if (meetup.starts_at && meetup.duration_minutes) {
        // New duration-based approach
        const expiryTime = new Date(meetup.starts_at);
        expiryTime.setMinutes(expiryTime.getMinutes() + meetup.duration_minutes);
        isNotExpired = expiryTime > now;
      }
      
      const hasValidLocation = isValidLocation(meetup.location);
      return isActive && isNotExpired && hasValidLocation;
    });
  }, [localMeetups]);

  // Custom hooks
  const [currentZoom, setCurrentZoom] = useMapZoom(
    mapRef,
    onZoomChange,
    onSearchRadiusChange,
    initialZoom
  );
  
  const windowSize = useMapResize(mapRef);
  const updateBounds = useMeetupBounds(mapRef, location, activeMeetups);

  // Popup configuration
  const getPopupConfig = useCallback(() => {
    const { mobile, tablet } = systemInfo;
    const base = {
      maxWidth: mobile ? 300 : 400,
      minWidth: mobile ? 200 : 250,
      autoPan: true,
      closeButton: false,
      className: `custom-popup ${mobile ? 'mobile-popup' : ''}`
    };

    if (tablet) {
      return {
        ...base,
        maxWidth: 400,
        minWidth: 300,
        offset: L.point(0, -40)
      };
    }

    return {
      ...base,
      offset: L.point(0, -45),
      autoPanPadding: [50, mobile ? 150 : 50]
    };
  }, [systemInfo]);

  // Handlers
  const handlePopupOpen = useCallback((e) => {
    const popup = e.popup;
    const map = mapRef.current;
    
    if (map && popup) {
      const point = map.project(popup.getLatLng());
      const containerPoint = map.getContainer().getBoundingClientRect();
      const controlsHeight = systemInfo.mobile ? 140 : 100;
      
      if (point.y > containerPoint.height - controlsHeight) {
        const overlap = point.y - (containerPoint.height - controlsHeight);
        map.panBy([0, -(overlap + 20)], { animate: true });
      }
    }
  }, [systemInfo]);

  const handleMapLoad = () => {
    setIsMapLoading(false);
    if (mapRef.current && !hasInitialCentered && location) {
      if (navigationController) {
        // Let the navigation controller handle the initial centering
        navigationController.setUserLocation(location);
        navigationController.navigateTo(location, { zoom: initialZoom });
      } else {
        // Fallback to direct map manipulation
        const bounds = updateBounds();
        if (bounds) {
          mapRef.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: Math.min(MAP_CONSTANTS.MAX_ZOOM, systemInfo.mobile ? 16 : 17)
          });
        }
      }
      setHasInitialCentered(true);
    }
  };

  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(error.message || 'An error occurred while loading the map');
    setIsMapLoading(false);
  };

  const handleTileError = () => {
    setTileLoadErrors(prev => {
      const newCount = prev + 1;
      if (newCount > 3) {
        const nextServer = (currentTileServer + 1) % TILE_SERVERS_LIST.length;
        setCurrentTileServer(nextServer);
        return 0;
      }
      return newCount;
    });
  };

  // Handle navigation mode changes - now primarily updates internal state to match controller
  const handleNavigationModeChange = useCallback((mode) => {
    Logger.debug(`Map navigation mode changed to: ${mode} ${mode === 1 ? '(Free Navigation)' : mode === 2 ? '(Bird\'s Eye View)' : '(Vicinity Mode)'}`);
    
    if (navigationController) {
      // Let the navigation controller handle the mode change
      navigationController.setNavigationMode(mode);
    } else {
      // Fallback to old behavior
      setCurrentNavigationMode(mode);
    }
    
    // Mode-specific local actions (still needed for backward compatibility)
    if (mode === 2) {
      // Force update of flight path key to regenerate the path
      setFlightPathKey(Date.now());
    }
  }, [navigationController]);

  // Handle location selection and make sure to respect current mode
  const handleLocationSelectionInternal = useCallback((locationData) => {
    // Check if this is a location with our special flag to preserve Bird's Eye View
    const preserveBirdsEyeView = locationData && locationData._preserveBirdsEyeView;
    const isBirdsEyeView = preserveBirdsEyeView || currentNavigationMode === 2;
    
    // Only reset to Free Navigation mode if we're not in Bird's Eye View
    // and there's no explicit flag to preserve Bird's Eye View
    if (!isBirdsEyeView && navigationController) {
      navigationController.setNavigationMode(1); // Reset to free navigation
    } else if (!isBirdsEyeView) {
      setCurrentNavigationMode(1);
    }
    
    // If we're already in Bird's Eye View mode and have a navigation controller,
    // trigger Bird's Eye View repositioning with the new selected location
    if (isBirdsEyeView && navigationController && location) {
      Logger.debug('MapComponent', 'Re-centering Bird\'s Eye View with new selected location');
      
      // Show bird's eye view between user location and newly selected location
      navigationController.showBirdsEyeView(location, locationData, {
        animate: true,
        duration: 1.2
      });
    }
    
    // Pass to parent component
    if (onLocationSelect) {
      onLocationSelect(locationData);
    }
    
    // Update local state
    setLocalSelectedLocation(locationData);
  }, [onLocationSelect, currentNavigationMode, navigationController, location]);
  
  // Reset to free navigation if clicking on map in vicinity mode
  const handleMapClickInternal = useCallback((e) => {
    if (onMapClick) {
      onMapClick(e);
    }

    // Don't automatically reset vicinity mode on every map click
    // Only reset mode if we're explicitly in vicinity mode AND
    // the click wasn't part of a drag operation AND
    // the user actually clicked more than 300ms ago (debounce)
    if (currentNavigationMode === 3) {
      // Get current time for debounce check
      const now = Date.now();
      
      // Check if we have a last click time to debounce
      if (!mapRef.current._lastMapClickTime || 
          now - mapRef.current._lastMapClickTime > 300) {
        
        // Check if the map is in a dragging state or was recently dragged
        const isDragging = mapRef.current._dragging || 
                          (mapRef.current._lastDragTime && 
                           now - mapRef.current._lastDragTime < 200);
        
        if (!isDragging) {
          Logger.debug('MapComponent', 'Clicking out of vicinity mode into free navigation');
          
          if (navigationController) {
            navigationController.setNavigationMode(1);
          } else {
            setCurrentNavigationMode(1);
          }
        } else {
          Logger.debug('MapComponent', 'Ignoring map click during drag operation');
        }
      }
      
      // Update last click time
      mapRef.current._lastMapClickTime = now;
    }
  }, [onMapClick, currentNavigationMode, navigationController]);
  
  // Update location centering during vicinity mode
  useEffect(() => {
    if (currentNavigationMode === 3 || !hasInitialCentered) {
      // Always recenter in vicinity mode when location changes
      if (currentNavigationMode === 3 && userSetZoomRef.current !== null) {
        setCurrentCenter({
          lat: location?.lat,
          lng: location?.lng,
          _preserveZoom: true
        });
      } else {
        setCurrentCenter({
          lat: location?.lat,
          lng: location?.lng
        });
      }
    }
  }, [location, currentNavigationMode, hasInitialCentered]);
  
  // Ensure selected location is properly synced
  useEffect(() => {
    if (selectedLocation !== localSelectedLocation) {
      setLocalSelectedLocation(selectedLocation);
      
      // Update navigation controller with selected location
      if (navigationController && selectedLocation) {
        navigationController.setSelectedLocation(selectedLocation);
      }
    }
  }, [selectedLocation, navigationController]);

  // Synchronize map with location
  useEffect(() => {
    if (mapRef.current && location && !isWaitingForLocation) {
      // If we have a navigation controller, let it handle updating the user location
      if (navigationController) {
        navigationController.setUserLocation(location);
        
        // Only let controller handle location if in vicinity mode
        if (currentNavigationMode === 3) {
          // Let the controller decide whether to update the map view
          // This avoids conflicting with other mode behaviors
          return;
        }
      }
      
      // Only manipulate center with map directly in vicinity mode or initial centering
      if (currentNavigationMode === 3 || !hasInitialCentered) {
        Logger.debug('MapComponent', `Setting center to user location in ${currentNavigationMode === 3 ? 'Vicinity Mode' : 'initial centering'}, lat: ${location.lat}, lng: ${location.lng}`);
        
        if (currentNavigationMode === 3 && userSetZoomRef.current !== null) {
          // Preserve zoom level in vicinity mode
          mapRef.current.setView([location.lat, location.lng], userSetZoomRef.current, {
            animate: false
          });
        } else {
          // Default behavior - keeps current zoom
          mapRef.current.setView([location.lat, location.lng], currentZoom, {
            animate: false
          });
        }
        
        if (!hasInitialCentered) {
          setHasInitialCentered(true);
        }
      }
    }
  }, [location, hasInitialCentered, currentZoom, currentNavigationMode, userSetZoomRef.current, navigationController]);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  // Forward map instance through ref
  useEffect(() => {
    if (ref && mapRef.current) {
      if (typeof ref === 'function') {
        ref(mapRef.current);
      } else {
        ref.current = mapRef.current;
      }
    }
    
    // Register mode control with parent component if provided
    // This is being kept for backward compatibility
    if (navigationController) {
      if (typeof registerModeControl === 'function') {
        registerModeControl((mode) => navigationController.setNavigationMode(mode));
      }
    }
  }, [mapRef.current, ref, registerModeControl, navigationController]);

  // Update local meetups when prop changes
  useEffect(() => {
    setLocalMeetups(matchedMeetups);
  }, [matchedMeetups]);

  // Update local selected location when prop changes
  useEffect(() => {
    setLocalSelectedLocation(selectedLocation);
  }, [selectedLocation]);

  // Handlers for map events
  const handleVicinityMode = (e) => {
    if (navigationController) {
      navigationController.showVicinityView(location);
    } else {
      // Fallback to old method
      Logger.debug("Vicinity mode activated (fallback)");
      setCurrentNavigationMode(3);
      setCurrentCenter({
        lat: location?.lat, 
        lng: location?.lng
      });
    }
  };

  const handleBirdsEyeView = (e) => {
    if (navigationController && localSelectedLocation && location) {
      navigationController.showBirdsEyeView(location, localSelectedLocation);
    } else {
      // Fallback to old method
      Logger.debug("Bird's eye view activated (fallback)");
      setCurrentNavigationMode(2);
      setFlightPathKey(Date.now());
    }
  };

  // Map click event handler component
  const MapClickHandler = ({ 
    currentNavigationMode, 
    onLocationSelect,
    mapRef,
    navigationController
  }) => {
    const map = useMapEvents({
      click: (e) => {
        const isBirdsEyeView = currentNavigationMode === 2;
        
        // Create location data from the click
        const locationData = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          isUserSelected: true,
          display_name: 'Selected Location',
          // Add preserveZoom flag to indicate that we want to maintain the current zoom level
          // This will be respected by handleLocationSelect in MeetNowApp.jsx
          _preserveZoom: true
        };
        
        // Special handling for Bird's Eye View mode to ensure it persists
        if (isBirdsEyeView) {
          console.log('Preserving Bird\'s Eye View mode while selecting new location');
          
          // Immediately store the location on the map for other components to use
          if (mapRef.current) {
            // Store updated selected location, but don't change mode or center yet
            mapRef.current._selectedLocation = locationData;
            
            // Important: prevent any map movements until we explicitly handle them
            // This stops the map from zooming inappropriately
            mapRef.current._skipNextViewUpdate = true;
          }
          
          // Do all preparation work first before triggering any location changes
          // This ensures other components don't react until we're ready
          
          // 1. First, synchronously update local state without triggering handlers
          setLocalSelectedLocation(locationData);
          
          // 2. Directly update any map properties needed for Bird's Eye View
          // This is critical to ensure no intermediate states occur
          if (mapRef.current && location) {
            // Calculate the bounds to see both user and selected location
            const bounds = L.latLngBounds(
              L.latLng(location.lat, location.lng),
              L.latLng(locationData.lat, locationData.lng)
            );
            
            // Add some padding to the bounds
            const paddedBounds = bounds.pad(0.3);
            
            // Store on map for immediate use by other components
            mapRef.current._birdEyeViewBounds = paddedBounds;
          }
          
          // 3. Forward the location with special flag to indicate preserving mode
          if (onLocationSelect) {
            // Add a flag to indicate we're in bird's eye view and don't want mode change
            const locationWithFlag = {
              ...locationData,
              _preserveBirdsEyeView: true,
              _directUpdate: true  // Add a flag to indicate this is a direct update
            };
            onLocationSelect(locationWithFlag);
          }
          
          // 4. Now explicitly refresh Bird's Eye View mode
          // Using a very short timeout to ensure all synchronous state updates complete first
          setTimeout(() => {
            if (mapRef.current) {
              // Clear the skip flag first
              mapRef.current._skipNextViewUpdate = false;
              
              // Explicitly set the navigation mode
              setCurrentNavigationMode(2);
              
              // Then refresh the Bird's Eye View directly through the map control
              if (mapRef.current._setMapViewMode) {
                mapRef.current._setMapViewMode(2, { 
                  immediate: true, 
                  userLocation: location,
                  selectedLocation: locationData 
                });
              }
            }
          }, 10); // Very short delay just to ensure all synchronous code completes
        } else {
          // Normal handling for other modes
          if (onLocationSelect) {
            onLocationSelect(locationData);
          }
        }
      },
      // Add drag handlers to flag user interaction
      dragstart: () => {
        console.log('🧪 TEST: User started dragging the map');
        // Set flag on map to indicate this is user interaction
        if (mapRef.current) {
          mapRef.current._userDragging = true;
          console.log('🧪 TEST: _userDragging flag set to true');
        }
      },
      dragend: () => {
        console.log('🧪 TEST: User finished dragging the map');
        // Keep the user dragging flag for a short time to prevent unwanted auto-centering
        if (mapRef.current) {
          mapRef.current._userDragging = false;
          console.log('🧪 TEST: _userDragging flag set to false');
        }
      },
      moveend: (e) => {
        console.log('🧪 TEST: Map movement ended');
        // Check if this was a user-initiated move or programmatic
        const isUserMovement = mapRef.current && mapRef.current._userDragging;
        
        // If current center doesn't match the map center and this was user movement, 
        // update current center with user interaction flag
        if (mapRef.current && isUserMovement) {
          const center = mapRef.current.getCenter();
          // Update current center with user interaction flag to prevent auto-recenter
          setCurrentCenter({
            lat: center.lat,
            lng: center.lng,
            _userInteraction: true
          });
          
          console.log('🧪 TEST: User moved map - setting _userInteraction flag to true');
        }
      },
      // Add zoom event handler to capture user's manually set zoom level
      zoomend: () => {
        // Store the user's manually set zoom level, especially important for Vicinity Mode
        if (mapRef.current) {
          const newZoom = mapRef.current.getZoom();
          console.log(`🧪 TEST: User changed zoom level to ${newZoom}`);
          
          // In Vicinity mode, store the user's zoom choice for future location updates
          if (currentNavigationMode === 3) {
            userSetZoomRef.current = newZoom;
            console.log(`🧪 TEST: Stored user's zoom preference in Vicinity Mode: ${newZoom}`);
          }
        }
      }
    });
    
    return null;
  };

  // Reset the user interaction flag after a delay to allow automatic centering to resume
  useEffect(() => {
    if (currentCenter && currentCenter._userInteraction) {
      console.log('🧪 TEST: Starting 5-second timer to clear user interaction flag');
      // After a short delay, update the center again without the user interaction flag
      // This allows auto-centering to resume when appropriate
      const timer = setTimeout(() => {
        setCurrentCenter({
          lat: currentCenter.lat,
          lng: currentCenter.lng
          // No user interaction flag, allowing auto centering to resume
        });
        console.log('🧪 TEST: 5-second timer completed - cleared user interaction flag');
      }, 5000); // 5 second delay before allowing auto centering again
      
      return () => {
        console.log('🧪 TEST: Cleanup - clearing interaction timer');
        clearTimeout(timer);
      }
    }
  }, [currentCenter]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (locationUpdateIntervalRef.current) {
        console.log('Cleaning up location update interval on unmount');
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  // In the component, add this useEffect for cleanup 
  useEffect(() => {
    return () => {
      // Clean up Leaflet map when component unmounts
      if (mapRef.current) {
        console.log('Removing map instance');
        mapRef.current.remove(); // Properly removes the map
        mapRef.current = null;
      }
    };
  }, [mapRef.current]);

  // Ensure Bird's Eye View is maintained when locations change
  useEffect(() => {
    // Only proceed if we're in Bird's Eye View mode with valid locations
    if (currentNavigationMode === 2 && 
        navigationController && 
        location && 
        localSelectedLocation) {
      
      Logger.debug('MapComponent', 'Bird\'s Eye View: Locations updated, repositioning view');
      
      // Reposition the Bird's Eye View with current locations
      navigationController.showBirdsEyeView(location, localSelectedLocation, {
        animate: true,
        duration: 0.8
      });
    }
  }, [currentNavigationMode, navigationController, location, localSelectedLocation]);

  // Render loading state
  if (isWaitingForLocation) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Waiting for location access...</p>
      </div>
    );
  }

  // Render error state
  if (mapError) {
    return <div className="map-error">{mapError}</div>;
  }

  const mapContainerStyle = {
    ...MAP_STYLES.container,
    ...(shouldUseCompactLayout ? MAP_STYLES.compact : {})
  };

  return (
    <ErrorBoundary>
      <div style={mapContainerStyle} className="map-container">
        <MapContainer
          center={currentCenter || [0, 0]}
          zoom={currentZoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={!systemInfo.mobile}
          attributionControl={true}
          whenReady={(map) => {
            console.log('Map ready event received');
            // Store the map instance in our ref
            mapRef.current = map.target;
            
            // Also update the forwarded ref
            if (ref) {
              // Create an API for the parent component with invalidateSize method
              const mapAPI = {
                invalidateSize: (options) => {
                  console.log('Invalidating map size via forwarded ref');
                  mapRef.current.invalidateSize(options);
                },
                getInstance: () => mapRef.current,
                getCenter: () => mapRef.current.getCenter(),
                getZoom: () => mapRef.current.getZoom(),
                setView: (center, zoom, options) => mapRef.current.setView(center, zoom, options),
                flyTo: (center, zoom, options) => mapRef.current.flyTo(center, zoom, options)
              };
              
              if (typeof ref === 'function') {
                ref(mapAPI);
              } else {
                ref.current = mapAPI;
              }
              
              // Also register with control if provided
              if (navigationController) {
                navigationController.updateMapReference({ current: mapRef.current });
              }
            }
            
            handleMapLoad();
          }}
          ref={mapRef}
        >
          <TileLayer
            url={TILE_SERVERS_LIST[currentTileServer].url}
            attribution={TILE_SERVERS_LIST[currentTileServer].attribution}
            crossOrigin={TILE_SERVERS_LIST[currentTileServer].crossOrigin}
            onError={handleTileError}
          />
          
          <MapUpdater 
            center={currentCenter} 
            zoom={currentZoom} 
            selectedLocation={localSelectedLocation}
            currentMode={currentNavigationMode}
          />
          
          <MapViewControlBar 
            initialMode={1}
            onModeChange={handleNavigationModeChange}
            userLocation={location}
            selectedLocation={localSelectedLocation}
            ref={(control) => {
              // Store the control directly on the map for direct access
              if (mapRef.current && control && control.setMode) {
                console.log('Registering MapViewControlBar reference on map instance');
                mapRef.current._viewModeControl = control;
              }
            }}
          />
          
          <LeafletGeolocation
            position="bottomright"
            onLocationFound={handleLocationSelectionInternal}
            onLocationError={handleMapError}
            startupBehavior="manual"
          />

          {location && (
            <LocationMarker
              position={location}
              icon={icons.userIcon}
              onLocationSelect={handleLocationSelectionInternal}
            />
          )}
          
          {/* Vicinity perimeter circle - only visible in mode 3 */}
          <VicinityIndicator 
            currentMode={currentNavigationMode}
            userLocation={location}
            radiusMeters={mapRef.current && mapRef.current._vicinitySettings ? mapRef.current._vicinitySettings.perimeterRadius : 150}
          />
          
          {/* Bird's Eye View flight path - only created when Bird's Eye View mode is active */}
          <BirdsEyePathOverlay 
            isActive={currentNavigationMode === 2}
            userLocation={location}
            selectedLocation={localSelectedLocation}
            key={`path-${localSelectedLocation ? localSelectedLocation.lat + '-' + localSelectedLocation.lng : 'none'}-${currentNavigationMode === 2 ? 'active' : 'inactive'}-${flightPathKey}`}
          />
            
          <MapMarkers
            currentCenter={currentCenter}
            activeMeetups={activeMeetups}
            icons={icons}
            getPopupConfig={getPopupConfig}
            handlePopupOpen={handlePopupOpen}
            onMarkerClick={handleLocationSelectionInternal}
          />

          <MapClickHandler 
            currentNavigationMode={currentNavigationMode}
            onLocationSelect={handleLocationSelectionInternal}
            mapRef={mapRef}
            navigationController={navigationController}
          />

          {children}
        </MapContainer>
        
        {shouldUseAdaptiveLayout && (
          <BottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
          >
            {children}
          </BottomSheet>
        )}
      </div>
    </ErrorBoundary>
  );
});

MapComponent.propTypes = {
  location: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  matchedMeetups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired
      }).isRequired,
      status: PropTypes.string.isRequired,
      expires_at: PropTypes.string,
      starts_at: PropTypes.string,
      duration_minutes: PropTypes.number,
      title: PropTypes.string,
      description: PropTypes.string,
      creator_name: PropTypes.string,
      current_participants: PropTypes.number,
      max_participants: PropTypes.number,
      distance_meters: PropTypes.number
    })
  ),
  onLocationSelect: PropTypes.func,
  children: PropTypes.node,
  onZoomChange: PropTypes.func,
  initialZoom: PropTypes.number,
  onMapClick: PropTypes.func,
  onSearchRadiusChange: PropTypes.func,
  navigationController: PropTypes.object,
  registerModeControl: PropTypes.func
};

MapComponent.displayName = 'MapComponent';

export default MapComponent;