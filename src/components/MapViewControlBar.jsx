import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import { MAP_CONSTANTS } from '../lib/map/config';

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
    
    .mnw-map-control-bar:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
      border-radius: 22px 22px 0 0;
      pointer-events: none;
    }
    
    .mnw-map-control-bar:active {
      transform: scale(0.98);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .mnw-zoom-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      font-size: 18px;
      font-weight: 300;
      opacity: 0.8;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
    }
    
    .mnw-zoom-indicator:hover {
      opacity: 1;
    }
    
    .mnw-mode-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .mnw-mode-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      margin-bottom: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      color: white;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .mnw-mode-text {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      white-space: nowrap;
      position: absolute;
      bottom: 6px;
      left: 0;
      right: 0;
      text-align: center;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .mnw-mode-text-entering {
      transform: translateY(15px);
      opacity: 0;
    }
    
    .mnw-mode-text-exiting {
      transform: translateY(-15px);
      opacity: 0;
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
  selectedLocation = null 
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
  
  // Notify parent of initial mode on mount
  useEffect(() => {
    if (onModeChange) {
      onModeChange(currentMode);
    }
  }, []);
  
  // Apply mode-specific settings to the map
  const applyModeSettings = useCallback((mode, options = {}) => {
    if (!map) return;
    
    console.log(`Applying map settings for mode: ${mode}`, options);
    
    switch(mode) {
      case 1: // Free Navigation
        // No restrictions, just allow free navigation
        break;
        
      case 2: { // Bird's Eye View
        console.log('Setting Bird\'s Eye View mode');
        
        // Get user location from options or fallback to props
        const userLoc = options.userLocation || userLocation;
        
        // Get selected location from options or fallback to props
        const targetLoc = options.selectedLocation || selectedLocation;
        
        // Check if we have both locations needed for Bird's Eye View
        if (userLoc && targetLoc) {
          console.log('Both user and selected locations available for Bird\'s Eye View');
          console.log('User location:', userLoc, 'Target location:', targetLoc);
          
          // Calculate the bounds to see both the user and the selected location
          const bounds = L.latLngBounds(
            L.latLng(userLoc.lat, userLoc.lng),
            L.latLng(targetLoc.lat, targetLoc.lng)
          );
          
          // Increase padding for more context around both points - increased from 0.3 to 0.5
          const paddedBounds = bounds.pad(0.5);
          
          // Get the center of the bounds
          const center = paddedBounds.getCenter();
          
          // Check if we're already in Bird's Eye View mode
          const wasAlreadyInBirdsEyeMode = map.getZoom() < 14 && 
            map.getBounds().contains(L.latLng(userLoc.lat, userLoc.lng)) &&
            (targetLoc ? map.getBounds().contains(L.latLng(targetLoc.lat, targetLoc.lng)) : true);
          
          // Determine animation settings - use longer animation for initial entry
          const duration = options.skipAnimation ? 0 : (wasAlreadyInBirdsEyeMode ? 1.0 : 2.0);
          const animate = !options.skipAnimation;
          
          console.log(`Bird's Eye View: Using ${animate ? 'animated' : 'immediate'} transition with duration ${duration}`);
          console.log('Flying to bounds:', paddedBounds);
          
          // Calculate distance between the two points
          const distance = L.latLng(userLoc.lat, userLoc.lng).distanceTo(L.latLng(targetLoc.lat, targetLoc.lng));
          console.log('Distance between points:', distance, 'meters');
          
          // Handle zoom level dynamically based on the distance between points
          if (distance < 100) {
            // Very close points - use street-level detail but within available tile limits
            console.log('Points are very close together, using detailed street-level zoom');
            
            // Calculate a zoom level based on distance, but max out at zoom level 19
            // to ensure we stay within available map tiles
            // Use a range between 18 (for ~100m) and 19 (for very close points)
            const zoomLevel = Math.max(18, Math.min(19, 19 - (distance / 100)));
            
            console.log(`Using calculated zoom level: ${zoomLevel.toFixed(2)} for distance ${distance.toFixed(2)}m - street level detail`);
            
            // For very close points, offset the center slightly to show both points clearly
            const offsetCenter = {
              lat: (userLoc.lat + targetLoc.lat) / 2,
              lng: (userLoc.lng + targetLoc.lng) / 2
            };
            
            map.flyTo([offsetCenter.lat, offsetCenter.lng], zoomLevel, {
              animate: animate,
              duration: duration,
              easeLinearity: 0.5
            });
          }
          else if (distance < 300) {
            // Moderately close points - use a higher zoom level appropriate for neighborhood context
            console.log('Points are moderately close, using neighborhood-level zoom');
            
            // Use a zoom level that works well for distances within a neighborhood
            const zoomLevel = 17; // Adjusted from 18 to 17 for better tile availability
            
            map.flyTo(center, zoomLevel, {
              animate: animate,
              duration: duration,
              easeLinearity: 0.5
            });
          } 
          else {
            // Normal distance or far apart - use the standard bounds approach with higher min zoom
            console.log('Using standard bounds approach with increased detail level');
            
            // Apply the bounds view with increased padding
            map.flyToBounds(paddedBounds, {
              animate: animate,
              duration: duration,
              easeLinearity: 0.5,
              maxZoom: 16, // Adjusted from 17 to 16 for better tile availability
              padding: [50, 50] // Additional padding in pixels
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
            map.flyTo([userLoc.lat, userLoc.lng], 15, {
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
        map.setView([userLoc.lat, userLoc.lng], vicinityZoom, { 
          animate: true,
          duration: 0.75 // Smoother animation (in seconds)
        });
        
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
  }, [map, userLocation, selectedLocation]);
  
  // Complete mode change with animations
  const completeSetMode = useCallback((newMode, skipAnimation = false) => {
    // Set the new mode
    setCurrentMode(newMode);
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(newMode);
    }
    
    // Apply the appropriate map settings
    applyModeSettings(newMode);
    
    if (!skipAnimation) {
      // Reset text transition status
      setTextTransition('entering');
      
      // Complete the transition
      setTimeout(() => {
        setTextTransition(null);
      }, 300);
    }
  }, [onModeChange, applyModeSettings]);
  
  // Handle mode cycling
  const cycleMode = useCallback(() => {
    if (isDragging) return;
    
    // Start text transition animation
    setTextTransition('exiting');
    
    // Update mode after a small delay for animation
    setTimeout(() => {
      const newMode = currentMode === 3 ? 1 : currentMode + 1;
      completeSetMode(newMode);
    }, 150);
  }, [currentMode, isDragging, completeSetMode]);
  
  // Handle external mode setting
  useEffect(() => {
    // Make the setCurrentMode function accessible to parent components via the map
    if (map) {
      console.log('Registering _setMapViewMode function on map');
      
      map._setMapViewMode = (mode, options = {}) => {
        if (mode >= 1 && mode <= 3) {
          console.log(`Setting map view mode externally to: ${mode}`, options);
          
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
          console.log(`DIRECT mode change to: ${mode}`);
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
      };
    }
  }, [map, currentMode, completeSetMode, onModeChange, applyModeSettings]);
  
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
      if (!modeIconElement || !modeTextElement) return;
      
      // Update icon - FIXED: Use proper DOM manipulation instead of React elements
      modeIconElement.innerHTML = '';
      
      // Create SVG element directly with DOM API instead of using React elements
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("width", "20");
      svg.setAttribute("height", "20");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      
      // Add the appropriate path elements based on current mode
      if (currentMode === 1) {
        // Location marker icon
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z");
        svg.appendChild(path);
        
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "10");
        circle.setAttribute("r", "3");
        svg.appendChild(circle);
      } 
      else if (currentMode === 2) {
        // Route icon
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "12");
        line.setAttribute("y1", "2");
        line.setAttribute("x2", "12");
        line.setAttribute("y2", "22");
        svg.appendChild(line);
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6");
        svg.appendChild(path);
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
        const currentZoom = map.getZoom();
        const newZoom = Math.max(
          MAP_CONSTANTS.MIN_ZOOM, 
          Math.min(MAP_CONSTANTS.MAX_ZOOM, currentZoom + zoomChange)
        );
        
        if (newZoom !== currentZoom) {
          map.setZoom(newZoom);
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
    
    // Cleanup on unmount
    return () => {
      L.DomEvent.off(controlBar, 'click', handleTap);
      L.DomEvent.off(controlBar, 'touchstart', handleTouchStart);
      L.DomEvent.off(controlBar, 'touchmove', handleTouchMove);
      L.DomEvent.off(controlBar, 'touchend', handleTouchEnd);
      
      if (map && viewModeControl) {
        map.removeControl(viewModeControl);
      }
    };
  }, [map, currentMode, cycleMode, isDragging, textTransition]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setMode: (mode) => {
      console.log(`Setting mode via ref to: ${mode}`);
      setTextTransition('exiting');
      
      setTimeout(() => {
        completeSetMode(mode);
      }, 150);
      return true;
    },
    setModeImmediate: (mode) => {
      console.log(`Setting mode immediately via ref to: ${mode}`);
      setCurrentMode(mode);
      
      if (onModeChange) {
        onModeChange(mode);
      }
      
      applyModeSettings(mode, { skipAnimation: true });
      return true;
    }
  }));
  
  // The component doesn't render anything itself - it adds the control directly to the map
  return null;
});

MapViewControlBar.propTypes = {
  initialMode: PropTypes.number,
  onModeChange: PropTypes.func,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  })
};

export default MapViewControlBar; 