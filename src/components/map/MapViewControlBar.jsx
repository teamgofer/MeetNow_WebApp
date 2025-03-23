import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import Logger from '../../utils/Logger';

// Mode descriptions with enticing text
const ModeDescriptions = {
  1: "Explore Freely",
  2: "Bird's Eye View", 
  3: "Your Vicinity"
};

// Create custom CSS for the component
const createStyles = () => {
  if (document.getElementById('map-view-control-bar-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'map-view-control-bar-styles';
  styleElement.innerHTML = `
    .leaflet-topcentre {
      position: absolute;
      z-index: 1000;
      pointer-events: none;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    }
    
    .leaflet-control-view-mode {
      margin: 15px 0 0 0 !important;
      pointer-events: auto;
    }
    
    .mnw-map-control-bar-container {
      user-select: none;
    }
    
    .mnw-map-control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 220px;
      height: 44px;
      padding: 0 16px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 22px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07), 
                  0 1px 2px rgba(255, 255, 255, 0.4) inset,
                  0 -1px 1px rgba(0, 0, 0, 0.05) inset;
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .mnw-map-control-bar:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .mnw-map-control-bar:active {
      transform: scale(0.98);
    }
    
    .mnw-zoom-indicator {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .mnw-mode-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 16px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .mnw-mode-icon {
      width: 16px;
      height: 16px;
      transition: all 0.3s ease;
    }
    
    .mnw-mode-icon svg {
      width: 100%;
      height: 100%;
      stroke: white;
      fill: none;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    
    .mnw-mode-text {
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.3px;
      transition: opacity 0.3s ease, transform 0.3s ease;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .mnw-mode-text-entering {
      animation: slide-in-text 0.3s ease forwards;
    }
    
    .mnw-mode-text-exiting {
      animation: slide-out-text 0.15s ease forwards;
    }
    
    @keyframes slide-in-text {
      0% {
        opacity: 0;
        transform: translateY(10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slide-out-text {
      0% {
        opacity: 1;
        transform: translateY(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
    
    @media (max-width: 480px) {
      .mnw-map-control-bar {
        width: 180px;
        height: 42px;
      }
      
      .mnw-mode-text {
        font-size: 12px;
      }
    }
    
    .mode-change-animation {
      transform: scale(1.2);
    }
    
    .mnw-pulse-animation {
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
      }
    }
  `;
  
  document.head.appendChild(styleElement);
};

/**
 * MapViewControlBar Component - An elegant multi-function map control
 * 
 * Features:
 * - Tap to cycle through 3 view modes
 * - Slide to control zoom level
 * - Glass morphism design with dynamic text
 */
const MapViewControlBar = forwardRef(({ 
  initialMode = 1, 
  onModeChange, 
  userLocation = null,
  selectedLocation = null,
  navigationController = null // Navigation controller as prop
}, ref) => {
  const map = useMap();
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [textTransition, setTextTransition] = useState(null);
  
  // Ensure styles are added to document
  useEffect(() => {
    createStyles();
  }, []);

  // Set up controller mode subscription
  useEffect(() => {
    // If we have a controller, subscribe to its mode changes
    if (navigationController) {
      // Create local handler function
      const handleModeChange = (mode) => {
        Logger.debug('MapViewControlBar', `Received mode update from controller: ${mode}`);
        // Only update our state if different
        if (mode !== currentMode) {
          setCurrentMode(mode);
        }
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
      
      // Check initial mode if the controller has a current mode
      if (navigationController.currentMode && navigationController.currentMode !== currentMode) {
        setCurrentMode(navigationController.currentMode);
      }
      
      return () => {
        // Restore original callback on cleanup
        if (navigationController) {
          navigationController.onModeChange = originalCallback;
        }
      };
    }
  }, [navigationController, currentMode]);
  
  // Notify parent of initial mode on mount
  useEffect(() => {
    if (onModeChange) {
      onModeChange(currentMode);
    }
  }, []);
  
  // Function to navigate using controller or direct map calls
  const navigateMap = useCallback((location, zoom, options = {}) => {
    if (navigationController) {
      // Use the controller if available
      if (options.useBounds && options.bounds) {
        // For bounds-based navigation, use the fitBounds method
        return navigationController.fitBounds(options.bounds, {
          padding: options.padding,
          animate: options.animate,
          duration: options.duration,
          maxZoom: options.maxZoom
        });
      } else {
        // Choose the appropriate navigation method based on animation preference
        const method = options.method || 'flyTo';
        
        if (method === 'setView') {
          return navigationController.setView(location, zoom, options);
        } else if (method === 'panTo') {
          return navigationController.panTo(location, options);
        } else {
          // Default to flyTo for smooth navigation
          return navigationController.flyTo(location, zoom, options);
        }
      }
    } else if (map) {
      // Fallback to direct map calls if no controller available
      Logger.warn('MapViewControlBar', 'No navigation controller available, using direct map calls');
      if (options.useBounds && options.bounds) {
        map.flyToBounds(options.bounds, {
          animate: options.animate !== false,
          duration: options.duration || 1,
          easeLinearity: 0.5,
          maxZoom: options.maxZoom || 16,
          padding: options.padding || [50, 50]
        });
      } else if (options.method === 'setView') {
        map.setView(location, zoom, {
          animate: options.animate !== false,
          duration: options.duration || 1
        });
      } else if (options.method === 'panTo') {
        map.panTo(location, {
          animate: options.animate !== false,
          duration: options.duration || 1
        });
      } else {
        map.flyTo(location, zoom, {
          animate: options.animate !== false,
          duration: options.duration || 1
        });
      }
    }
  }, [map, navigationController]);
  
  // Apply mode-specific settings to the map
  const applyModeSettings = useCallback((mode, options = {}) => {
    // If we have a navigation controller, use it
    if (navigationController) {
      Logger.debug('MapViewControlBar', `Setting navigation mode to ${mode} via controller`);
      
      // Use the controller's mode switching functionality
      navigationController.setNavigationMode(mode, {
        ...options,
        userLocation,
        selectedLocation
      });
      
      return;
    }
    
    // Fallback to direct map manipulation if no controller
    if (!map) return;
    
    Logger.warn('MapViewControlBar', `No navigation controller, applying map settings for mode ${mode} directly`);
    
    switch(mode) {
      case 1: { // Free Navigation
        // Just disable any auto-centering or constraints
        // Clear any Bird's Eye View flags
        map._birdEyeViewActive = false;
        if (map._birdEyeViewBounds) {
          delete map._birdEyeViewBounds;
        }
        
        // Clear any vicinity mode settings
        if (map._vicinityActive) {
          map._vicinityActive = false;
        }
        
        // Disable auto-centering on user location
        if (map._locationUpdateInterval) {
          clearInterval(map._locationUpdateInterval);
          map._locationUpdateInterval = null;
        }
        
        // Fire an event to indicate we're in Free Navigation mode
        if (map.fire) {
          map.fire('freenavigation', { 
            active: true,
            immediate: options.immediate
          });
        }
        
        break;
      }
      
      case 2: { // Bird's Eye View - show both user and selected location
        // Check if we have both the user location and a selected location
        const userLoc = options.userLocation || userLocation;
        const targetLoc = options.selectedLocation || selectedLocation;
        
        // Determine if we were already in Bird's Eye View mode
        const wasAlreadyInBirdsEyeMode = map._birdEyeViewActive === true;
        
        if (userLoc && targetLoc) {
          // Before setting Bird's Eye View, store the current center for returning to free nav
          if (!wasAlreadyInBirdsEyeMode && !map._lastFreeNavigationCenter) {
            map._lastFreeNavigationCenter = map.getCenter();
            map._lastFreeNavigationZoom = map.getZoom();
          }
          
          // Skip animations if requested (for direct updates)
          const animate = !options.skipAnimation;
          const duration = options.skipAnimation ? 0 : 1.5;
          
          // Create a bounds object that includes both points
          const bounds = L.latLngBounds(
            L.latLng(userLoc.lat, userLoc.lng),
            L.latLng(targetLoc.lat, targetLoc.lng)
          );
          
          // Add padding to the bounds (adjust the value as needed)
          const paddedBounds = bounds.pad(0.5);
          
          // Check if the points are very close together
          const distance = map.distance(
            [userLoc.lat, userLoc.lng],
            [targetLoc.lat, targetLoc.lng]
          );
          
          // Choose the right approach based on distance
          if (distance < 100) {
            // Very close together - use a centered approach with fixed zoom
            console.log('Points are very close - using centered approach with fixed zoom');
            
            // Find the center between the two points
            const center = L.latLng(
              (userLoc.lat + targetLoc.lat) / 2,
              (userLoc.lng + targetLoc.lng) / 2
            );
            
            // Use a high zoom level for nearby points
            navigateMap([center.lat, center.lng], 17, {
              animate: animate,
              duration: duration
            });
          }
          else {
            // Normal distance or far apart - use the standard bounds approach
            console.log('Using standard bounds approach');
            
            // Apply the bounds view
            navigateMap(null, null, {
              useBounds: true,
              bounds: paddedBounds,
              animate: animate,
              duration: duration,
              easeLinearity: 0.5,
              maxZoom: 16,
              padding: [50, 50]
            });
          }
          
          // Fire an event to indicate we're in Bird's Eye View mode
          map.fire('birdseyeview', {
            active: true,
            userLocation: userLoc,
            selectedLocation: targetLoc,
            bounds: paddedBounds,
            immediate: options.immediate,
            isUpdate: wasAlreadyInBirdsEyeMode
          });
          
          // Store information on the map object for other components
          map._birdEyeViewActive = true;
          map._birdEyeViewBounds = paddedBounds;
          
          // Set flag to indicate we've processed this mode successfully
          map._setMapViewMode = 2;
          return true;
        } else {
          console.warn('Cannot enter Bird\'s Eye View mode without both user and selected locations');
          // Maybe fallback to user location or center of map
          if (userLoc) {
            // Just focus on user if no selected location yet
            navigateMap([userLoc.lat, userLoc.lng], 15, {
              animate: !options.skipAnimation,
              duration: options.skipAnimation ? 0 : 1.0
            });
            return true;
          }
          return false;
        }
      }
      
      case 3: { // Your Vicinity - View centered on user's location with 150m perimeter
        // Try to get the actual user location from various sources
        let userLoc = null;
        
        // Option 1: Check if we have it from props
        if (userLocation && userLocation.lat && userLocation.lng) {
          userLoc = userLocation;
          console.log('Vicinity Mode: Using userLocation prop');
        }
        // Option 2: Check if map has stored user location
        else if (map._userLocation) {
          userLoc = map._userLocation;
          console.log('Vicinity Mode: Using stored _userLocation');
        }
        // Option 3: Look for user location marker on the map
        else {
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer.options && layer.options.icon) {
              // If this is the user marker (based on icon class)
              if (layer.options.icon.options && 
                  layer.options.icon.options.className && 
                  layer.options.icon.options.className.includes('user-marker')) {
                userLoc = layer.getLatLng();
              }
            }
          });
          
          if (userLoc) {
            console.log('Vicinity Mode: Found user marker on map');
          }
        }
        
        // Option 4: Fallback to map center if no user location found
        if (!userLoc) {
          userLoc = map.getCenter();
          console.log('Vicinity Mode: No user location found, using map center');
        }
        
        // Calculate appropriate zoom level to show around 300m area
        // Zoom levels are approximate: 18 shows about 150-300m radius
        const vicinityZoom = 18; // Adjusted from 16 to show a 300m area
        
        // Set the view centered on user location with animation
        navigateMap([userLoc.lat, userLoc.lng], vicinityZoom, { 
          animate: true,
          duration: 0.75, // Smoother animation (in seconds)
          method: 'setView' // Explicitly use setView for this
        });
        
        // Mark map as being in vicinity mode (this helps prevent mode resets)
        map._vicinityActive = true;
        map._vicinitySettings = {
          perimeterRadius: 150,
          userLocation: userLoc
        };
        
        // Store a timestamp to avoid rapid mode changes
        map._lastVicinityModeChange = Date.now();
        
        // Store the current user location to check for significant changes
        if (userLoc) {
          map._lastVicinityUserLocation = {
            lat: userLoc.lat,
            lng: userLoc.lng
          };
        }
        
        // Trigger an event to tell other components we're in vicinity mode
        // This allows MapComponent to know when to start auto-centering
        if (map.fire) {
          map.fire('vicinitymode', { 
            active: true,
            userLocation: userLoc,
            showPerimeter: true,
            perimeterRadius: 150 // 150 meters perimeter (reduced from 500m)
          });
        }
        
        break;
      }
        
      default:
        break;
    }
  }, [map, userLocation, selectedLocation, navigateMap, navigationController]);
  
  // Complete mode change with animations
  const completeSetMode = useCallback((newMode, skipAnimation = false) => {
    // Set the new mode
    setCurrentMode(newMode);
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(newMode);
    }
    
    // If entering Bird's Eye View mode with a navigation controller, make sure 
    // to show the Bird's Eye View between user and selected location
    if (newMode === 2 && navigationController && userLocation && selectedLocation) {
      Logger.debug('MapViewControlBar', 'Entering Bird\'s Eye View mode via control bar');
      navigationController.showBirdsEyeView(userLocation, selectedLocation);
    } else {
      // Apply the appropriate map settings for other modes
      applyModeSettings(newMode);
    }
    
    if (!skipAnimation) {
      // Reset text transition status
      setTextTransition('entering');
      
      // Complete the transition
      setTimeout(() => {
        setTextTransition(null);
      }, 300);
    }
  }, [onModeChange, applyModeSettings, navigationController, userLocation, selectedLocation]);
  
  // Handle mode cycling
  const cycleMode = useCallback(() => {
    if (isDragging) return;
    
    // Start text transition animation
    setTextTransition('exiting');
    
    // Update mode after a small delay for animation
    setTimeout(() => {
      const newMode = currentMode === 3 ? 1 : currentMode + 1;
      
      // Use the controller if available
      if (navigationController) {
        navigationController.setNavigationMode(newMode);
      } else {
        completeSetMode(newMode);
      }
    }, 150);
  }, [currentMode, isDragging, completeSetMode, navigationController]);
  
  // Handle external mode setting
  useImperativeHandle(ref, () => ({
    setMode: (mode) => {
      if (mode >= 1 && mode <= 3) {
        // If we have a controller, use it
        if (navigationController) {
          navigationController.setNavigationMode(mode);
          return true;
        }
        
        // Otherwise, use our local implementation
        setTextTransition('exiting');
        
        setTimeout(() => {
          completeSetMode(mode);
        }, 150);
        return true;
      }
      return false;
    }
  }));
  
  // Register mode setting function on the map object
  useEffect(() => {
    // Make the mode-setting function accessible to parent components via the map
    if (map) {
      Logger.debug('MapViewControlBar', 'Registering _setMapViewMode function on map');
      
      map._setMapViewMode = (mode, options = {}) => {
        if (mode >= 1 && mode <= 3) {
          Logger.debug('MapViewControlBar', `Setting map view mode externally to: ${mode}`);
          
          // If we have a controller, use it
          if (navigationController) {
            navigationController.setNavigationMode(mode, options);
            return true;
          }
          
          // Handle immediate mode changes (used by Bird's Eye View)
          if (options.immediate) {
            // Skip animation if immediate is true - directly apply mode
            setCurrentMode(mode);
            
            if (onModeChange) {
              onModeChange(mode);
            }
            
            // If additional location data is provided, use it
            const optionsToUse = {
              ...options,
              skipAnimation: true
            };
            
            // Apply settings immediately
            applyModeSettings(mode, optionsToUse);
            return true;
          }
          
          // Normal mode change with animation
          setTextTransition('exiting');
          
          setTimeout(() => {
            completeSetMode(mode);
          }, 150);
          return true;
        }
        return false;
      };
      
      // Also expose a direct setter for critical uses like mini-map clicks
      // This ensures the most direct path for setting the mode
      map._directSetMode = (mode) => {
        if (mode >= 1 && mode <= 3) {
          Logger.debug('MapViewControlBar', `DIRECT mode change to: ${mode}`);
          
          // If we have a controller, use it directly
          if (navigationController) {
            navigationController.setNavigationMode(mode, { immediate: true });
            return true;
          }
          
          setCurrentMode(mode);
          
          if (onModeChange) {
            onModeChange(mode);
          }
          
          // Apply settings immediately without animation
          applyModeSettings(mode, { skipAnimation: true });
          return true;
        }
        return false;
      };
      
      // Clean up
      return () => {
        if (map && map._setMapViewMode) {
          delete map._setMapViewMode;
        }
        if (map && map._directSetMode) {
          delete map._directSetMode;
        }
      };
    }
  }, [map, completeSetMode, onModeChange, applyModeSettings, navigationController]);
  
  // Create Leaflet custom control
  useEffect(() => {
    if (!map) return;
    
    // Ensure we have a custom "topcentre" position for our control
    if (!L.Control.ViewMode) {
      // Register custom position
      if (!map._controlCorners.topcentre) {
        const topcentre = L.DomUtil.create('div', 'leaflet-top leaflet-topcentre', map._controlContainer);
        map._controlCorners.topcentre = topcentre;
      }
      
      // Define our custom control
      L.Control.ViewMode = L.Control.extend({
        options: {
          position: 'topcentre'
        },
        
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-control-view-mode mnw-map-control-bar-container');
          container.innerHTML = `
            <div class="mnw-map-control-bar">
              <div class="mnw-zoom-indicator mnw-zoom-indicator-minus">-</div>
              <div class="mnw-mode-indicator">
                <div class="mnw-mode-icon" id="mnw-mode-icon-element"></div>
              </div>
              <div class="mnw-zoom-indicator mnw-zoom-indicator-plus">+</div>
              <div class="mnw-mode-text" id="mnw-mode-text-element">${ModeDescriptions[currentMode]}</div>
            </div>
          `;
          
          // Prevent map interactions from triggering when interacting with our control
          L.DomEvent.disableClickPropagation(container);
          L.DomEvent.disableScrollPropagation(container);
          
          // Store references to DOM elements for React to update
          this._container = container;
          this._modeIconElement = container.querySelector('#mnw-mode-icon-element');
          this._modeTextElement = container.querySelector('#mnw-mode-text-element');
          
          return container;
        }
      });
    }
    
    // Create and add our control
    const viewModeControl = new L.Control.ViewMode();
    map.addControl(viewModeControl);
    
    // Store references to elements we need to update
    const modeIconElement = viewModeControl._modeIconElement;
    const modeTextElement = viewModeControl._modeTextElement;
    const controlBar = viewModeControl._container.querySelector('.mnw-map-control-bar');
    
    // Update icon and text based on current mode
    const updateModeDisplay = () => {
      // Clear any existing content
      modeIconElement.innerHTML = '';
      
      // Create SVG for the icon
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      
      // Add mode-specific paths
      if (currentMode === 1) {
        // Free navigation icon
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4");
        svg.appendChild(path);
      }
      else if (currentMode === 2) {
        // Bird's eye view icon
        const path1 = document.createElementNS(svgNS, "path");
        path1.setAttribute("d", "M5 13l4 4L19 7");
        svg.appendChild(path1);
        
        const path2 = document.createElementNS(svgNS, "path");
        path2.setAttribute("d", "M13 17l6-6");
        svg.appendChild(path2);
      }
      else if (currentMode === 3) {
        // Radius view icon
        const outerCircle = document.createElementNS(svgNS, "circle");
        outerCircle.setAttribute("cx", "12");
        outerCircle.setAttribute("cy", "12");
        outerCircle.setAttribute("r", "10");
        svg.appendChild(outerCircle);
        
        const innerCircle = document.createElementNS(svgNS, "circle");
        innerCircle.setAttribute("cx", "12");
        innerCircle.setAttribute("cy", "12");
        innerCircle.setAttribute("r", "4");
        svg.appendChild(innerCircle);
      }
      
      // Append the SVG to the icon element
      modeIconElement.appendChild(svg);
      
      // Add animation class temporarily
      modeIconElement.classList.add('mode-change-animation');
      setTimeout(() => {
        modeIconElement.classList.remove('mode-change-animation');
      }, 300);
      
      // Update text with transition
      if (textTransition === 'exiting') {
        modeTextElement.classList.add('mnw-mode-text-exiting');
      } else if (textTransition === 'entering') {
        modeTextElement.textContent = ModeDescriptions[currentMode];
        modeTextElement.classList.add('mnw-mode-text-entering');
        
        setTimeout(() => {
          modeTextElement.classList.remove('mnw-mode-text-entering');
        }, 10);
      } else {
        modeTextElement.textContent = ModeDescriptions[currentMode];
        modeTextElement.classList.remove('mnw-mode-text-exiting');
        modeTextElement.classList.remove('mnw-mode-text-entering');
      }
    };
    
    // Update display when mode changes
    updateModeDisplay();
    
    // Set up tap/click handler for mode cycling
    const handleTap = (e) => {
      L.DomEvent.preventDefault(e);
      cycleMode();
    };
    
    // Set up touch handlers for zoom control
    const handleTouchStart = (e) => {
      setDragStartX(e.touches[0].clientX);
      L.DomEvent.preventDefault(e);
    };
    
    const handleTouchMove = (e) => {
      const currentX = e.touches[0].clientX;
      const diff = currentX - dragStartX;
      
      if (Math.abs(diff) > 5) {
        setIsDragging(true);
        
        // Calculate zoom change based on drag distance
        const zoomChange = diff * 0.01; // Adjust sensitivity as needed
        
        // Use navigationController for zoom if available
        if (navigationController) {
          const currentZoom = navigationController.getZoom();
          const newZoom = Math.max(1, Math.min(19, currentZoom + zoomChange));
          
          if (newZoom !== currentZoom) {
            navigationController.setZoom(newZoom);
          }
        } else if (map) {
          const currentZoom = map.getZoom();
          const newZoom = Math.max(1, Math.min(19, currentZoom + zoomChange));
          
          if (newZoom !== currentZoom) {
            map.setZoom(newZoom);
          }
        }
        
        setDragStartX(currentX);
      }
      
      L.DomEvent.preventDefault(e);
    };
    
    const handleTouchEnd = () => {
      setTimeout(() => {
        setIsDragging(false);
      }, 50);
    };
    
    // Add event listeners
    L.DomEvent.on(controlBar, 'click', handleTap);
    L.DomEvent.on(controlBar, 'touchstart', handleTouchStart);
    L.DomEvent.on(controlBar, 'touchmove', handleTouchMove);
    L.DomEvent.on(controlBar, 'touchend', handleTouchEnd);
    
    // Watch for mode changes to update the display
    const modeChangeEffect = () => {
      updateModeDisplay();
    };
    
    // Create a mutation observer to watch for text changes
    // This helps ensure our text transitions work correctly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          modeChangeEffect();
        }
      });
    });
    
    // Observe the text element
    observer.observe(modeTextElement, { childList: true, characterData: true });
    
    // Cleanup on unmount
    return () => {
      L.DomEvent.off(controlBar, 'click', handleTap);
      L.DomEvent.off(controlBar, 'touchstart', handleTouchStart);
      L.DomEvent.off(controlBar, 'touchmove', handleTouchMove);
      L.DomEvent.off(controlBar, 'touchend', handleTouchEnd);
      
      observer.disconnect();
      
      if (map && viewModeControl) {
        map.removeControl(viewModeControl);
      }
    };
  }, [map, currentMode, cycleMode, isDragging, textTransition, navigationController]);
  
  // This component doesn't render any React elements directly
  // It creates/modifies DOM elements through Leaflet
  return null;
});

MapViewControlBar.propTypes = {
  initialMode: PropTypes.oneOf([1, 2, 3]),
  onModeChange: PropTypes.func,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  navigationController: PropTypes.object
};

export default MapViewControlBar; 