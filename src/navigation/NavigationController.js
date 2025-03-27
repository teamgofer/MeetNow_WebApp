/**
 * NavigationController.js
 * Public API for map navigation operations
 */

import L from 'leaflet';
import NavigationCore, { NavigationMode, NavigationEvent, isValidLocation } from './NavigationCore';
import Logger from '../utils/Logger';

// For legacy compatibility
const MODE_MAP = {
  1: NavigationMode.FREE,
  2: NavigationMode.BIRDS_EYE,
  3: NavigationMode.VICINITY,

  // Also support string conversion
  [NavigationMode.FREE]: NavigationMode.FREE,
  [NavigationMode.BIRDS_EYE]: NavigationMode.BIRDS_EYE,
  [NavigationMode.VICINITY]: NavigationMode.VICINITY
};

// Reverse mapping for legacy code
const LEGACY_MODE_MAP = {
  [NavigationMode.FREE]: 1,
  [NavigationMode.BIRDS_EYE]: 2,
  [NavigationMode.VICINITY]: 3
};

/**
 * Extracts map instance from various reference types
 * @param {Object} mapRef - Map reference object
 * @returns {Object|null} Leaflet map instance or null
 */
function extractMapInstance(mapRef) {
  try {
    if (!mapRef) return null;
    
    // Direct map instance
    if (mapRef._leaflet_id) return mapRef;
    
    // React ref
    if (mapRef.current) {
      // Direct map in ref.current
      if (mapRef.current._leaflet_id) return mapRef.current;
      
      // Map in ref.current._map
      if (mapRef.current._map && mapRef.current._map._leaflet_id) return mapRef.current._map;
      
      // Map available via getInstance()
      if (typeof mapRef.current.getInstance === 'function') {
        const map = mapRef.current.getInstance();
        if (map && map._leaflet_id) return map;
      }
    }
    
    return null;
  } catch (error) {
    Logger.error('NavigationController', 'Error extracting map instance', error);
    return null;
  }
}

/**
 * NavigationController provides the public API for map navigation
 */
class NavigationController {
  /**
   * Creates a new NavigationController
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Initialize the core navigation state management
    this.core = new NavigationCore({
      defaultZoom: options.defaultZoom || 15,
      minZoom: options.minZoom || 5,
      maxZoom: options.maxZoom || 18,
      debug: !!options.debug,
      validationErrorLevel: options.validationErrorLevel || 'warn'
    });
    
    // Queue for map operations
    this.operationQueue = [];
    this.isProcessingQueue = false;
    
    // Handle legacy callback style
    this._legacyCallbacks = {
      onModeChange: options.onModeChange || null,
      onLocationChange: options.onLocationChange || null,
      onSelectedLocationChange: options.onSelectedLocationChange || null,
      onZoomChange: options.onZoomChange || null,
      onReady: options.onReady || null
    };
    
    // For backward compatibility
    this.listeners = {
      mode: [],
      location: [],
      selectedLocation: [],
      zoom: [],
      ready: []
    };
    
    // For legacy mode numeric values
    this.FREE_NAVIGATION = LEGACY_MODE_MAP[NavigationMode.FREE];
    this.BIRDS_EYE_VIEW = LEGACY_MODE_MAP[NavigationMode.BIRDS_EYE];
    this.VICINITY_MODE = LEGACY_MODE_MAP[NavigationMode.VICINITY];
    
    // Log creation
    Logger.info('NavigationController', 'Initialized');
    
    // Connect core events to legacy callbacks
    this._connectCoreEvents();
    
    // Set initial mode if provided
    if (options.defaultMode) {
      const mappedMode = MODE_MAP[options.defaultMode] || NavigationMode.FREE;
      this.core.updateState({ mode: mappedMode });
    }
    
    // Handle initial map reference if provided
    if (options.mapRef) {
      this.updateMapReference(options.mapRef);
    }
  }
  
  /**
   * Maps core events to legacy callbacks and listeners
   * @private
   */
  _connectCoreEvents() {
    // Mode changed event
    this.core.on(NavigationEvent.MODE_CHANGED, ({ from, to }) => {
      const legacyTo = LEGACY_MODE_MAP[to];
      const legacyFrom = LEGACY_MODE_MAP[from];
      
      // Call legacy callback
      if (typeof this._legacyCallbacks.onModeChange === 'function') {
        try {
          this._legacyCallbacks.onModeChange(legacyTo, legacyFrom);
        } catch (error) {
          Logger.error('NavigationController', 'Error in onModeChange callback', error);
        }
      }
      
      // Call legacy listeners
      if (this.listeners.mode) {
        this.listeners.mode.forEach(listener => {
          try {
            listener(legacyTo);
          } catch (error) {
            Logger.error('NavigationController', 'Error in mode change listener', error);
          }
        });
      }
    });
    
    // Location changed event
    this.core.on(NavigationEvent.LOCATION_CHANGED, (location) => {
      // Call legacy callback
      if (typeof this._legacyCallbacks.onLocationChange === 'function') {
        try {
          this._legacyCallbacks.onLocationChange(location);
        } catch (error) {
          Logger.error('NavigationController', 'Error in onLocationChange callback', error);
        }
      }
      
      // Call legacy listeners
      if (this.listeners.location) {
        this.listeners.location.forEach(listener => {
          try {
            listener(location);
          } catch (error) {
            Logger.error('NavigationController', 'Error in location change listener', error);
          }
        });
      }
    });
    
    // Selected location changed event
    this.core.on(NavigationEvent.SELECTED_LOCATION_CHANGED, (location) => {
      // Call legacy callback
      if (typeof this._legacyCallbacks.onSelectedLocationChange === 'function') {
        try {
          this._legacyCallbacks.onSelectedLocationChange(location);
        } catch (error) {
          Logger.error('NavigationController', 'Error in onSelectedLocationChange callback', error);
        }
      }
      
      // Call legacy listeners
      if (this.listeners.selectedLocation) {
        this.listeners.selectedLocation.forEach(listener => {
          try {
            listener(location);
          } catch (error) {
            Logger.error('NavigationController', 'Error in selected location change listener', error);
          }
        });
      }
    });
    
    // Zoom changed event
    this.core.on(NavigationEvent.ZOOM_CHANGED, (zoom) => {
      // Call legacy callback
      if (typeof this._legacyCallbacks.onZoomChange === 'function') {
        try {
          this._legacyCallbacks.onZoomChange(zoom);
        } catch (error) {
          Logger.error('NavigationController', 'Error in onZoomChange callback', error);
        }
      }
      
      // Call legacy listeners
      if (this.listeners.zoom) {
        this.listeners.zoom.forEach(listener => {
          try {
            listener(zoom);
          } catch (error) {
            Logger.error('NavigationController', 'Error in zoom change listener', error);
          }
        });
      }
    });
    
    // Map ready event
    this.core.on(NavigationEvent.MAP_READY, (map) => {
      // Call legacy callback
      if (typeof this._legacyCallbacks.onReady === 'function') {
        try {
          this._legacyCallbacks.onReady(this);
        } catch (error) {
          Logger.error('NavigationController', 'Error in onReady callback', error);
        }
      }
      
      // Call legacy listeners
      if (this.listeners.ready) {
        this.listeners.ready.forEach(listener => {
          try {
            listener(this);
          } catch (error) {
            Logger.error('NavigationController', 'Error in ready listener', error);
          }
        });
      }
      
      // Process any queued operations
      this._processQueue();
    });
  }
  
  /**
   * Updates the map reference
   * @param {Object} mapRef - Map reference
   * @returns {boolean} Success status
   */
  updateMapReference(mapRef) {
    try {
      const mapInstance = extractMapInstance(mapRef);
      
      if (!mapInstance) {
        Logger.warn('NavigationController', 'Invalid map reference');
        return false;
      }
      
      // Update the core state with new map
      const success = this.core.updateState({ map: mapInstance });
      
      if (success) {
        Logger.debug('NavigationController', 'Map reference updated successfully');
      }
      
      return success;
    } catch (error) {
      Logger.error('NavigationController', 'Error updating map reference', error);
      return false;
    }
  }
  
  /**
   * Checks if the controller is ready for navigation
   * @returns {boolean} Whether the controller is ready
   */
  isReadyToNavigate() {
    const state = this.core.getState();
    return state.ready && state.map !== null;
  }
  
  /**
   * Returns a promise that resolves when the controller is ready
   * @returns {Promise} Resolves when ready
   */
  waitUntilReady() {
    if (this.isReadyToNavigate()) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      const unsubscribe = this.core.on(NavigationEvent.MAP_READY, () => {
        unsubscribe();
        resolve();
      });
    });
  }
  
  /**
   * Sets the navigation mode
   * @param {number|string} mode - Target mode (1/FREE, 2/BIRDS_EYE, 3/VICINITY)
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  setNavigationMode(mode, options = {}) {
    // Map legacy numeric values to string mode names
    const mappedMode = MODE_MAP[mode];
    
    if (!mappedMode) {
      Logger.warn('NavigationController', 'Invalid navigation mode', mode);
      return false;
    }
    
    return this.core.updateState({ mode: mappedMode });
  }
  
  /**
   * Gets the current navigation mode
   * @returns {number} Current mode (1, 2, or 3)
   */
  getNavigationMode() {
    const state = this.core.getState();
    return LEGACY_MODE_MAP[state.mode];
  }
  
  /**
   * Sets the user location
   * @param {Object} location - Location object with lat/lng
   * @returns {boolean} Success status
   */
  setUserLocation(location) {
    return this.core.updateState({ userLocation: location });
  }
  
  /**
   * Gets the current user location
   * @returns {Object|null} User location
   */
  getUserLocation() {
    return this.core.getState().userLocation;
  }
  
  /**
   * Sets the selected location
   * @param {Object} location - Location object with lat/lng
   * @returns {boolean} Success status
   */
  setSelectedLocation(location) {
    return this.core.updateState({ selectedLocation: location });
  }
  
  /**
   * Gets the current selected location
   * @returns {Object|null} Selected location
   */
  getSelectedLocation() {
    return this.core.getState().selectedLocation;
  }
  
  /**
   * Sets the zoom level
   * @param {number} zoom - Zoom level
   * @returns {boolean} Success status
   */
  setZoom(zoom) {
    return this.core.updateState({ zoom: zoom });
  }
  
  /**
   * Gets the current zoom level
   * @returns {number} Current zoom
   */
  getZoom() {
    return this.core.getState().zoom;
  }
  
  /**
   * Queues a navigation operation
   * @param {Function} operation - Operation function
   * @returns {Promise} Resolves when operation completes
   * @private
   */
  _queueOperation(operation) {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({ operation, resolve, reject });
      this._processQueue();
    });
  }
  
  /**
   * Process the operation queue
   * @private
   */
  async _processQueue() {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Process operations until queue is empty
    while (this.operationQueue.length > 0) {
      const { operation, resolve, reject } = this.operationQueue.shift();
      
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        Logger.error('NavigationController', 'Operation failed', error);
        reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  /**
   * Navigates to a location
   * @param {Object} location - Target location
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  navigateTo(location, options = {}) {
    if (!isValidLocation(location)) {
      return Promise.reject(new Error('Invalid location'));
    }
    
    return this._queueOperation(async () => {
      // Wait until ready
      if (!this.isReadyToNavigate()) {
        await this.waitUntilReady();
      }
      
      const map = this.core.getState().map;
      if (!map) {
        throw new Error('Map instance not available');
      }
      
      const zoom = options.zoom || this.core.getState().zoom;
      const animate = options.animate !== false;
      
      // Process mode if provided
      if (options.mode) {
        const mappedMode = MODE_MAP[options.mode];
        if (mappedMode) {
          this.core.updateState({ mode: mappedMode });
        }
      }
      
      // Determine navigation method
      const method = options.method || 'flyTo';
      
      // Execute navigation based on method
      switch (method) {
        case 'setView':
          map.setView([location.lat, location.lng], zoom, { animate });
          break;
        
        case 'panTo':
          map.panTo([location.lat, location.lng], { animate });
          break;
        
        case 'flyTo':
        default:
          map.flyTo([location.lat, location.lng], zoom, { 
            animate,
            duration: options.duration || 1
          });
          break;
      }
      
      // Update state with new location if this is a selected location
      if (options.isSelectedLocation) {
        this.setSelectedLocation(location);
      }
      
      // Update zoom in state
      this.setZoom(map.getZoom());
      
      return true;
    });
  }
  
  /**
   * Shows both locations in bird's eye view
   * @param {Object} locationA - First location (typically user)
   * @param {Object} locationB - Second location (typically selected)
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  showBirdsEyeView(locationA, locationB, options = {}) {
    if (!isValidLocation(locationA) || !isValidLocation(locationB)) {
      return Promise.reject(new Error('Invalid locations for Bird\'s Eye View'));
    }
    
    return this._queueOperation(async () => {
      // Set user and selected locations
      this.setUserLocation(locationA);
      this.setSelectedLocation(locationB);
      
      // Switch to bird's eye mode
      this.setNavigationMode(NavigationMode.BIRDS_EYE);
      
      // Wait until ready
      if (!this.isReadyToNavigate()) {
        await this.waitUntilReady();
      }
      
      const map = this.core.getState().map;
      if (!map) {
        throw new Error('Map instance not available');
      }
      
      // Create a bounds object that includes both points
      const bounds = L.latLngBounds(
        [locationA.lat, locationA.lng],
        [locationB.lat, locationB.lng]
      );
      
      // Handle case where points are identical or very close
      const isIdentical = Math.abs(locationA.lat - locationB.lat) < 0.000001 && 
                         Math.abs(locationA.lng - locationB.lng) < 0.000001;
                         
      if (isIdentical) {
        Logger.warn('NavigationController', 'Identical points in Bird\'s Eye View, adding offset');
        bounds.extend([locationA.lat + 0.001, locationA.lng + 0.001]);
      }
      
      // Add padding to the bounds
      const paddedBounds = bounds.pad(0.5);
      
      // Fly to the bounds
      map.flyToBounds(paddedBounds, {
        animate: options.animate !== false,
        duration: options.duration || 1,
        easeLinearity: 0.5,
        maxZoom: 16,
        padding: options.padding || [50, 50]
      });
      
      // Notify map about bird's eye view
      if (map.fire) {
        map.fire('birdseyeview', {
          active: true,
          bounds: paddedBounds,
          locationA,
          locationB
        });
      }
      
      // Store flag on map for compatibility
      map._birdEyeViewActive = true;
      map._birdEyeViewBounds = paddedBounds;
      
      return true;
    });
  }
  
  /**
   * Shows vicinity view centered on user location
   * @param {Object} userLocation - User location
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  showVicinityView(userLocation, options = {}) {
    if (!isValidLocation(userLocation)) {
      return Promise.reject(new Error('Invalid location for Vicinity View'));
    }
    
    return this._queueOperation(async () => {
      // Set user location
      this.setUserLocation(userLocation);
      
      // Switch to vicinity mode
      this.setNavigationMode(NavigationMode.VICINITY);
      
      // Wait until ready
      if (!this.isReadyToNavigate()) {
        await this.waitUntilReady();
      }
      
      const map = this.core.getState().map;
      if (!map) {
        throw new Error('Map instance not available');
      }
      
      // Use a higher zoom for vicinity view
      const zoom = options.zoom || 17;
      
      // Fly to the location
      map.flyTo([userLocation.lat, userLocation.lng], zoom, {
        animate: options.animate !== false,
        duration: options.duration || 1
      });
      
      // Notify map about vicinity mode
      if (map.fire) {
        map.fire('vicinitymode', {
          active: true,
          location: userLocation
        });
      }
      
      // Store flag on map for compatibility
      map._vicinityActive = true;
      
      return true;
    });
  }
  
  /**
   * Legacy callback function for mode changes
   * @param {Function} callback - Mode change callback
   * @returns {Function} Unsubscribe function
   */
  onModeChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.mode.push(callback);
    
    // Call immediately with current mode
    const currentLegacyMode = LEGACY_MODE_MAP[this.core.getState().mode];
    callback(currentLegacyMode);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.mode.indexOf(callback);
      if (index > -1) {
        this.listeners.mode.splice(index, 1);
      }
    };
  }
  
  /**
   * Legacy callback function for location changes
   * @param {Function} callback - Location change callback
   * @returns {Function} Unsubscribe function
   */
  onLocationChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.location.push(callback);
    
    // Call immediately with current location
    const currentLocation = this.core.getState().userLocation;
    if (currentLocation) {
      callback(currentLocation);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.location.indexOf(callback);
      if (index > -1) {
        this.listeners.location.splice(index, 1);
      }
    };
  }
  
  /**
   * Legacy callback function for selected location changes
   * @param {Function} callback - Selected location change callback
   * @returns {Function} Unsubscribe function
   */
  onSelectedLocationChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.selectedLocation.push(callback);
    
    // Call immediately with current selected location
    const currentLocation = this.core.getState().selectedLocation;
    if (currentLocation) {
      callback(currentLocation);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.selectedLocation.indexOf(callback);
      if (index > -1) {
        this.listeners.selectedLocation.splice(index, 1);
      }
    };
  }
  
  /**
   * Legacy callback function for zoom changes
   * @param {Function} callback - Zoom change callback
   * @returns {Function} Unsubscribe function
   */
  onZoomChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.zoom.push(callback);
    
    // Call immediately with current zoom
    callback(this.core.getState().zoom);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.zoom.indexOf(callback);
      if (index > -1) {
        this.listeners.zoom.splice(index, 1);
      }
    };
  }
  
  /**
   * Legacy callback function for ready state
   * @param {Function} callback - Ready callback
   * @returns {Function} Unsubscribe function
   */
  onReady(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.ready.push(callback);
    
    // Call immediately if already ready
    if (this.isReadyToNavigate()) {
      callback(this);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.ready.indexOf(callback);
      if (index > -1) {
        this.listeners.ready.splice(index, 1);
      }
    };
  }
  
  /**
   * Cleans up resources used by the controller
   */
  dispose() {
    this.core.dispose();
    this.operationQueue = [];
    this.isProcessingQueue = false;
    
    this.listeners = {
      mode: [],
      location: [],
      selectedLocation: [],
      zoom: [],
      ready: []
    };
    
    Logger.info('NavigationController', 'Disposed');
  }
}

// Define static properties for backward compatibility
NavigationController.FREE_NAVIGATION = 1;
NavigationController.BIRDS_EYE_VIEW = 2;
NavigationController.VICINITY_MODE = 3;

export default NavigationController; 