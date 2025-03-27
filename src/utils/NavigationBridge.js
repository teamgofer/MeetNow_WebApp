/**
 * NavigationBridge
 * 
 * This is a temporary bridge to maintain basic functionality
 * during the transition from the old navigation system to the new one.
 * 
 * IMPORTANT: This file is temporary and will be removed once the 
 * new navigation system is fully implemented.
 */

import Logger from './Logger';

// Navigation mode constants
export const FREE_NAVIGATION = 1;
export const BIRDS_EYE_VIEW = 2;
export const VICINITY_MODE = 3;

class NavigationBridge {
  constructor() {
    // Basic state
    this.currentMode = FREE_NAVIGATION;
    this.currentZoom = 15;
    this.mapRef = null;
    this.userLocation = null;
    this.selectedLocation = null;
    
    // Stub callbacks
    this.onModeChange = null;
    this.onLocationChange = null;
    this.onSelectedLocationChange = null;
    this.onZoomChange = null;
    this.onReady = null;
    
    // For backward compatibility
    this.listeners = {
      mode: [],
      location: [],
      selectedLocation: [],
      zoom: [],
      ready: []
    };
    
    // Log creation of bridge
    Logger.info('NavigationBridge', 'Temporary navigation bridge created');
  }
  
  // Core functionality only
  
  updateMapReference(mapRef) {
    Logger.debug('NavigationBridge', 'Map reference updated');
    this.mapRef = mapRef;
    return true;
  }
  
  getMapInstance() {
    if (this.mapRef && this.mapRef.current) {
      return this.mapRef.current;
    }
    return null;
  }
  
  setNavigationMode(mode) {
    Logger.debug('NavigationBridge', `Navigation mode set to ${mode}`);
    const oldMode = this.currentMode;
    this.currentMode = mode;
    
    // Call callback if provided
    if (typeof this.onModeChange === 'function') {
      try {
        this.onModeChange(mode, oldMode);
      } catch (e) {
        Logger.error('NavigationBridge', 'Error in mode change callback', e);
      }
    }
    
    // Support legacy listeners
    if (this.listeners.mode) {
      this.listeners.mode.forEach(listener => {
        try {
          listener(mode);
        } catch (e) {
          Logger.error('NavigationBridge', 'Error in mode change listener', e);
        }
      });
    }
    
    return true;
  }
  
  getNavigationMode() {
    return this.currentMode;
  }
  
  setUserLocation(location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return false;
    }
    
    this.userLocation = location;
    
    // Call callback if provided
    if (typeof this.onLocationChange === 'function') {
      try {
        this.onLocationChange(location);
      } catch (e) {
        Logger.error('NavigationBridge', 'Error in location change callback', e);
      }
    }
    
    // Support legacy listeners
    if (this.listeners.location) {
      this.listeners.location.forEach(listener => {
        try {
          listener(location);
        } catch (e) {
          Logger.error('NavigationBridge', 'Error in location change listener', e);
        }
      });
    }
    
    return true;
  }
  
  setSelectedLocation(location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return false;
    }
    
    this.selectedLocation = location;
    
    // Call callback if provided
    if (typeof this.onSelectedLocationChange === 'function') {
      try {
        this.onSelectedLocationChange(location);
      } catch (e) {
        Logger.error('NavigationBridge', 'Error in selected location change callback', e);
      }
    }
    
    // Support legacy listeners
    if (this.listeners.selectedLocation) {
      this.listeners.selectedLocation.forEach(listener => {
        try {
          listener(location);
        } catch (e) {
          Logger.error('NavigationBridge', 'Error in selected location change listener', e);
        }
      });
    }
    
    return true;
  }
  
  // Simplified flyTo implementation
  flyTo(location, zoom, options = {}) {
    const map = this.getMapInstance();
    if (!map || !map.flyTo) return false;
    
    try {
      map.flyTo([location.lat, location.lng], zoom || this.currentZoom, {
        animate: options.animate !== false,
        duration: options.duration || 1
      });
      return true;
    } catch (e) {
      Logger.error('NavigationBridge', 'Error in flyTo', e);
      return false;
    }
  }
  
  // Helper to check if controller is ready
  isReadyToNavigate() {
    return !!this.getMapInstance();
  }
  
  // Stub implementation for backward compatibility
  showBirdsEyeView(userLocation, selectedLocation) {
    this.setNavigationMode(BIRDS_EYE_VIEW);
    
    const map = this.getMapInstance();
    if (!map) return false;
    
    try {
      const bounds = map.getBounds ? map.getBounds() : null;
      if (!bounds && map.flyTo && userLocation && selectedLocation) {
        // Center between the two points
        const centerLat = (userLocation.lat + selectedLocation.lat) / 2;
        const centerLng = (userLocation.lng + selectedLocation.lng) / 2;
        map.flyTo([centerLat, centerLng], 15);
      }
      return true;
    } catch (e) {
      Logger.error('NavigationBridge', 'Error in showBirdsEyeView', e);
      return false;
    }
  }
  
  // Stub implementation for backward compatibility
  showVicinityView(userLocation) {
    this.setNavigationMode(VICINITY_MODE);
    
    const map = this.getMapInstance();
    if (!map || !userLocation) return false;
    
    try {
      if (map.flyTo) {
        map.flyTo([userLocation.lat, userLocation.lng], 17);
      }
      return true;
    } catch (e) {
      Logger.error('NavigationBridge', 'Error in showVicinityView', e);
      return false;
    }
  }
}

export default NavigationBridge; 