import Logger from './Logger';

// Navigation modes
const FREE_NAVIGATION = 1;
const BIRDS_EYE_VIEW = 2;
const VICINITY_MODE = 3;

/**
 * Manages all map navigation operations to ensure consistent behavior
 * and prevent conflicts between multiple navigation requests.
 */
class MapNavigationController {
  /**
   * Creates a new MapNavigationController instance
   * @param {Object} options - Configuration options
   * @param {Object|null} options.mapRef - Optional initial map reference
   * @param {number} options.defaultZoom - Default zoom level (default: 15)
   * @param {number} options.maxZoom - Maximum zoom level (default: 18)
   * @param {number} options.minZoom - Minimum zoom level (default: 5)
   * @param {number} options.defaultMode - Default navigation mode (default: FREE_NAVIGATION)
   * @param {function} options.onModeChange - Mode change callback
   * @param {function} options.onReady - Ready state callback
   * @param {boolean} options.debug - Whether to enable debug logging
   */
  constructor(options = {}) {
    const {
      mapRef = null,
      defaultZoom = 15,
      maxZoom = 18,
      minZoom = 5,
      defaultMode = FREE_NAVIGATION,
      onModeChange = null,
      onReady = null,
      debug = false
    } = options;
    
    // Map reference
    this.mapRef = null;
    this._directMapInstance = null;  // Direct reference to map instance
    
    // Cache for map methods
    this._cachedSetView = null;
    this._cachedFlyTo = null;
    this._cachedPanTo = null;
    this._cachedGetZoom = null;
    
    // Navigation state
    this.currentMode = defaultMode;
    this.currentZoom = defaultZoom;
    this.maxZoom = maxZoom;
    this.minZoom = minZoom; 
    this.selectedLocation = null;
    this.userLocation = null;
    this.previousLocation = null;
    this.lastModeChangeTime = Date.now();
    this.isProcessing = false;
    this.navigationQueue = [];
    
    // Event handlers
    this.onModeChange = onModeChange;
    this.onReady = onReady;
    this.onLocationChange = null;
    this.onSelectedLocationChange = null;
    this.onZoomChange = null;
    
    // Legacy listener arrays for backward compatibility
    this.listeners = {
      mode: [],
      location: [],
      ready: [],
      selectedLocation: [],
      zoom: []
    };
    
    // State tracking
    this.isReady = false;
    this.vicinityModeActive = false;
    this.birdsModeActive = false;
    this.debug = debug;
    
    // Tracking for debounce and mode protection
    this.lastSetModeTime = 0;
    this.lastVicinityModeEnterTime = 0;
    
    // Initialize map reference if provided
    if (mapRef) {
      this.updateMapReference(mapRef);
    }
  }
  
  /**
   * Attempt to initialize map early with exponential backoff
   * @private
   */
  _attemptEarlyMapInitialization() {
    // Check if we've tried too many times already
    if (this._initializeAttempts >= this._maxInitAttempts) {
      Logger.warn('MapNavigationController', 'Max initialization attempts reached');
      return;
    }
    
    this._initializeAttempts++;
    const mapInstance = this.getMapInstance();
    
    if (mapInstance) {
      // Success - cache methods and mark as ready
      Logger.info('MapNavigationController', 'Early map initialization successful');
      
      if (typeof mapInstance.setView === 'function') {
        this._cachedSetView = mapInstance.setView.bind(mapInstance);
      }
      if (typeof mapInstance.flyTo === 'function') {
        this._cachedFlyTo = mapInstance.flyTo.bind(mapInstance);
      }
      if (typeof mapInstance.panTo === 'function') {
        this._cachedPanTo = mapInstance.panTo.bind(mapInstance);
      }
      
      this.isReady = true;
      this._notifyReady();
    } else {
      // Failed - try again with exponential backoff
      const delay = Math.min(100 * Math.pow(2, this._initializeAttempts), 2000);
      Logger.debug('MapNavigationController', `Map not ready, retrying in ${delay}ms (attempt ${this._initializeAttempts})`);
      
      setTimeout(() => {
        this._attemptEarlyMapInitialization();
      }, delay);
    }
  }
  
  /**
   * Process the queue of navigation operations one at a time
   * @private
   */
  async processQueue() {
    // If already processing or queue is empty, just return
    if (this.isProcessing || this.navigationQueue.length === 0) return;
    
    // Set processing flag to prevent concurrent processing
    this.isProcessing = true;
    
    try {
      // Get the next operation from the queue
      const operation = this.navigationQueue.shift();
      
      // Execute the operation with proper error handling
      try {
        await operation();
      } catch (error) {
        Logger.error('MapNavigationController', 'Navigation operation failed', error);
        // We continue processing the queue even if an operation fails
      }
    } catch (error) {
      // Catch any unexpected errors in the queue processing itself
      Logger.error('MapNavigationController', 'Unexpected error in navigation queue processing', error);
    } finally {
      // Always reset processing flag and continue with next operation
      this.isProcessing = false;
      // Process next item if available
      if (this.navigationQueue.length > 0) {
        this.processQueue();
      }
    }
  }
  
  /**
   * Check if the controller is ready to navigate
   * @returns {boolean} True if ready to navigate
   */
  isReadyToNavigate() {
    return this.isReady && this.mapRef && this.mapRef.current;
  }
  
  /**
   * Waits until the controller is ready to navigate
   * @returns {Promise} Resolves when controller is ready
   */
  waitUntilReady() {
    if (this.isReadyToNavigate()) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      const unsubscribe = this.onReady(() => {
        unsubscribe();
        resolve();
      });
    });
  }
  
  /**
   * Subscribe to mode changes
   * @param {Function} callback - Function to call when mode changes
   * @returns {Function} Unsubscribe function
   */
  onModeChange(callback) {
    // If a callback is being registered via legacy method
    if (typeof callback === 'function') {
      // Store in listeners array for backward compatibility
      this.listeners.mode.push(callback);
      
      // Call immediately with current value
      callback(this.currentMode);
      
      // Return unsubscribe function
      return () => {
        this.listeners.mode = this.listeners.mode.filter(cb => cb !== callback);
      };
    }
    
    // Otherwise, return the callback property's current value
    return this.onModeChange;
  }
  
  /**
   * Subscribe to user location changes
   * @param {Function} callback - Function to call when location changes
   * @returns {Function} Unsubscribe function
   */
  onLocationChange(callback) {
    // If a callback is being registered via legacy method
    if (typeof callback === 'function') {
      // Store in listeners array
      this.listeners.location.push(callback);
      
      // Call immediately with current value if available
      if (this.userLocation) {
        callback(this.userLocation);
      }
      
      // Return unsubscribe function
      return () => {
        this.listeners.location = this.listeners.location.filter(cb => cb !== callback);
      };
    }
    
    // Otherwise, return the callback property's current value
    return this.onLocationChange;
  }
  
  /**
   * Subscribe to selected location changes
   * @param {Function} callback - Function to call when selected location changes
   * @returns {Function} Unsubscribe function
   */
  onSelectedLocationChange(callback) {
    // If a callback is being registered via legacy method
    if (typeof callback === 'function') {
      // Store in listeners array
      this.listeners.selectedLocation.push(callback);
      
      // Call immediately with current value if available
      if (this.selectedLocation) {
        callback(this.selectedLocation);
      }
      
      // Return unsubscribe function
      return () => {
        this.listeners.selectedLocation = this.listeners.selectedLocation.filter(cb => cb !== callback);
      };
    }
    
    // Otherwise, return the callback property's current value
    return this.onSelectedLocationChange;
  }
  
  /**
   * Subscribe to zoom changes
   * @param {Function} callback - Function to call when zoom changes
   * @returns {Function} Unsubscribe function
   */
  onZoomChange(callback) {
    // If a callback is being registered via legacy method
    if (typeof callback === 'function') {
      // Store in listeners array
      this.listeners.zoom.push(callback);
      
      // Call immediately with current value
      callback(this.currentZoom);
      
      // Return unsubscribe function
      return () => {
        this.listeners.zoom = this.listeners.zoom.filter(cb => cb !== callback);
      };
    }
    
    // Otherwise, return the callback property's current value
    return this.onZoomChange;
  }
  
  /**
   * Subscribe to controller ready state
   * @param {Function} callback - Function to call when controller becomes ready
   * @returns {Function} Unsubscribe function
   */
  onReady(callback) {
    // If a callback is being registered via legacy method
    if (typeof callback === 'function') {
      // If already ready, call immediately
      if (this.isReadyToNavigate()) {
        callback();
        return () => {}; // Empty unsubscribe function
      }
      
      // Store in listeners array
      this.listeners.ready.push(callback);
      
      // Return unsubscribe function
      return () => {
        this.listeners.ready = this.listeners.ready.filter(cb => cb !== callback);
      };
    }
    
    // Otherwise, return the callback property's current value
    return this.onReady;
  }
  
  /**
   * Update the map reference to the current map
   * @param {Object} mapRef - A reference to the map object (either a React ref or direct map object)
   * @returns {boolean} - Whether a valid map instance was found and stored
   */
  updateMapReference(mapRef) {
    try {
      if (!mapRef) {
        Logger.warn('MapNavigationController', 'Null or undefined map reference provided');
        return false;
      }

      // Store the raw reference
      this.mapRef = mapRef;
      
      // Try to extract the map instance from various reference types
      let mapInstance = null;
      let source = 'unknown';
      
      // Handle React refs
      if (mapRef.current) {
        source = 'react-ref';
        // React ref with a current property
        if (mapRef.current instanceof Object) {
          Logger.debug('MapNavigationController', 'Map reference is a React ref with current as object');
          
          // If current is the map instance (has expected methods)
          if (typeof mapRef.current.setView === 'function' || 
              typeof mapRef.current.flyTo === 'function' ||
              typeof mapRef.current.panTo === 'function') {
            mapInstance = mapRef.current;
          }
          // If current has a mapObject property (old pattern)
          else if (mapRef.current.mapObject && typeof mapRef.current.mapObject === 'object') {
            mapInstance = mapRef.current.mapObject;
            source = 'react-ref-mapObject';
          }
          // If current has a leafletElement property (react-leaflet pattern)
          else if (mapRef.current.leafletElement && typeof mapRef.current.leafletElement === 'object') {
            mapInstance = mapRef.current.leafletElement;
            source = 'react-ref-leaflet';
          }
        }
      }
      // Handle direct map objects
      else if (typeof mapRef === 'object') {
        // If it has map methods directly
        if (typeof mapRef.setView === 'function' || 
            typeof mapRef.flyTo === 'function' ||
            typeof mapRef.panTo === 'function') {
          mapInstance = mapRef;
          source = 'direct-map';
        }
        // If it's a wrapper with a map property
        else if (mapRef.map && typeof mapRef.map === 'object') {
          mapInstance = mapRef.map;
          source = 'wrapper-map';
        }
        // If it's a wrapper with a mapObject property
        else if (mapRef.mapObject && typeof mapRef.mapObject === 'object') {
          mapInstance = mapRef.mapObject;
          source = 'wrapper-mapObject';
        }
      }
      
      if (!mapInstance) {
        Logger.warn('MapNavigationController', 'Could not extract map instance from reference', { 
          hasRef: !!mapRef,
          hasCurrent: !!(mapRef && mapRef.current),
          type: mapRef ? typeof mapRef : 'null'
        });
        return false;
      }
      
      // Store the direct map instance for stability
      this._directMapInstance = mapInstance;
      
      Logger.info('MapNavigationController', `Map reference updated (source: ${source})`);
      
      // Cache the commonly used map methods for faster access and stability
      if (typeof mapInstance.setView === 'function') {
        this._cachedSetView = mapInstance.setView.bind(mapInstance);
      }
      
      if (typeof mapInstance.flyTo === 'function') {
        this._cachedFlyTo = mapInstance.flyTo.bind(mapInstance);
      }
      
      if (typeof mapInstance.panTo === 'function') {
        this._cachedPanTo = mapInstance.panTo.bind(mapInstance);
      }
      
      if (typeof mapInstance.getZoom === 'function') {
        this._cachedGetZoom = mapInstance.getZoom.bind(mapInstance);
        // Update our current zoom level with the actual map zoom
        this.currentZoom = mapInstance.getZoom();
      }
      
      // Check if we're now ready for navigation
      this.checkReadyStatus();
      
      return true;
    } catch (error) {
      Logger.error('MapNavigationController', 'Error updating map reference', error);
      return false;
    }
  }
  
  /**
   * Get the current map instance from the reference
   * @returns {Object|null} - The map instance if available, null otherwise
   */
  getMapInstance() {
    try {
      // First, try to use our cached direct map instance (most reliable)
      if (this._directMapInstance) {
        // Verify it's still valid by checking for a key method
        if (typeof this._directMapInstance.setView === 'function') {
          return this._directMapInstance;
        } else {
          Logger.warn('MapNavigationController', 'Cached direct map instance is no longer valid');
        }
      }
      
      // Next, try to use the current reference
      const { mapRef } = this;
      
      if (!mapRef) {
        Logger.warn('MapNavigationController', 'No map reference available');
        return null;
      }
      
      let mapInstance = null;
      
      // Try React ref pattern
      if (mapRef.current) {
        // Check if current is directly the map
        if (mapRef.current && typeof mapRef.current.setView === 'function') {
          mapInstance = mapRef.current;
        }
        // Check for various wrapper patterns
        else if (mapRef.current.mapObject && typeof mapRef.current.mapObject.setView === 'function') {
          mapInstance = mapRef.current.mapObject;
        }
        else if (mapRef.current.leafletElement && typeof mapRef.current.leafletElement.setView === 'function') {
          mapInstance = mapRef.current.leafletElement;
        }
      }
      // Try direct object pattern
      else if (typeof mapRef.setView === 'function') {
        mapInstance = mapRef;
      }
      // Try wrapper patterns
      else if (mapRef.map && typeof mapRef.map.setView === 'function') {
        mapInstance = mapRef.map;
      }
      else if (mapRef.mapObject && typeof mapRef.mapObject.setView === 'function') {
        mapInstance = mapRef.mapObject;
      }
      
      // If we found a valid instance, update our cache and return it
      if (mapInstance) {
        this._directMapInstance = mapInstance;
        return mapInstance;
      }
      
      // If we still don't have a map instance, log the issue
      Logger.warn('MapNavigationController', 'Could not extract map instance from reference', {
        hasRef: !!mapRef,
        hasCurrent: !!(mapRef && mapRef.current),
        refType: mapRef ? typeof mapRef : 'null'
      });
      
      return null;
    } catch (error) {
      Logger.error('MapNavigationController', 'Error getting map instance', error);
      return null;
    }
  }
  
  /**
   * Reset any mode-specific overrides on the map
   * @param {number} targetMode - The mode to set (1=Free, 2=BirdEye, 3=Vicinity)
   * @private
   */
  resetModeOverrides(targetMode = 1) {
    const map = this.getMapInstance();
    if (!map) return;
    
    // Clear any mode-specific constraints
    if (map._overrideCenter) map._overrideCenter = false;
    if (map._birdEyeViewActive && targetMode !== 2) map._birdEyeViewActive = false;
    if (map._vicinityActive && targetMode !== 3) map._vicinityActive = false;
    
    // Reset to specified navigation mode if needed
    if (map._directSetMode && targetMode !== undefined) {
      map._directSetMode(targetMode);
      Logger.debug('MapNavigationController', `Set map mode to ${targetMode}`);
    }
  }
  
  /**
   * Set the current navigation mode
   * @param {number} mode - Target navigation mode (FREE_NAVIGATION, BIRDS_EYE_VIEW, VICINITY_MODE)
   * @param {Object} options - Options for mode change
   * @param {boolean} options.animate - Whether to animate the transition
   * @param {boolean} options.immediate - Skip debounce checks
   * @param {boolean} options.silent - Don't notify listeners
   * @param {boolean} options.force - Force mode change even if same mode
   * @returns {Promise} Resolves when mode change completes
   */
  setNavigationMode(mode, options = {}) {
    const { animate = true, immediate = false, silent = false, force = false } = options;
    
    Logger.debug('MapNavigationController', `Requested mode change to ${mode}`, options);
    
    // Don't change to the same mode unless forced to do so
    if (mode === this.currentMode && !force) {
      Logger.debug('MapNavigationController', `Already in mode ${mode}, ignoring request`);
      return Promise.resolve();
    }
    
    // Get current time for debounce checks
    const now = Date.now();
    
    // Debounce mode changes to prevent rapid switching
    if (!immediate && now - this.lastSetModeTime < 500) {
      Logger.debug('MapNavigationController', 'Ignoring mode change request (debounced)');
      return Promise.resolve();
    }
    
    // Extra protection for vicinity mode to prevent accidental exit
    if (this.currentMode === VICINITY_MODE && mode !== VICINITY_MODE) {
      // If we just entered vicinity mode within the last 2 seconds, don't allow leaving it
      if (now - this.lastVicinityModeEnterTime < 2000) {
        Logger.debug('MapNavigationController', 'Blocking quick exit from vicinity mode');
        return Promise.resolve();
      }
    }
    
    // Store the time of this mode change
    this.lastSetModeTime = now;
    
    // If entering vicinity mode, record the time
    if (mode === VICINITY_MODE) {
      this.lastVicinityModeEnterTime = now;
    }
    
    // Save previous mode
    const previousMode = this.currentMode;
    
    // Update current mode
    this.currentMode = mode;
    
    Logger.info('MapNavigationController', `Navigation mode changed from ${previousMode} to ${mode}`);
    
    // Notify listeners of mode change
    if (!silent && typeof this.onModeChange === 'function') {
      try {
        this.onModeChange(mode, previousMode);
      } catch (error) {
        Logger.error('MapNavigationController', 'Error in onModeChange callback', error);
      }
    }
    
    return Promise.resolve();
  }
  
  /**
   * Get the current navigation mode
   * @returns {number} The current mode
   */
  getNavigationMode() {
    return this.currentMode;
  }
  
  /**
   * Set the user's location
   * @param {Object} location - The user's location
   */
  setUserLocation(location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      Logger.warn('MapNavigationController', 'Invalid user location', location);
      return;
    }
    
    this.userLocation = location;
    
    // Store on map instance for other components
    const map = this.getMapInstance();
    if (map) {
      map._userLocation = location;
    }
    
    // Notify listeners
    this._notifyLocationChange();
  }
  
  /**
   * Get the user's location
   * @returns {Object|null} The user's location or null
   */
  getUserLocation() {
    return this.userLocation;
  }
  
  /**
   * Set the selected location
   * @param {Object} location - The selected location
   */
  setSelectedLocation(location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      Logger.warn('MapNavigationController', 'Invalid selected location', location);
      return;
    }
    
    this.selectedLocation = location;
    
    // Store on map instance for other components
    const map = this.getMapInstance();
    if (map) {
      map._selectedLocation = location;
    }
    
    // Notify listeners
    this._notifySelectedLocationChange();
  }
  
  /**
   * Get the selected location
   * @returns {Object|null} The selected location or null
   */
  getSelectedLocation() {
    return this.selectedLocation;
  }
  
  /**
   * Set the current zoom level
   * @param {number} zoom - The zoom level
   */
  setZoom(zoom) {
    this.currentZoom = zoom;
    
    const map = this.getMapInstance();
    if (map && typeof map.setZoom === 'function') {
      map.setZoom(zoom);
    }
    
    // Notify listeners
    this._notifyZoomChange();
  }
  
  /**
   * Get the current zoom level
   * @returns {number} The current zoom
   */
  getZoom() {
    const map = this.getMapInstance();
    if (map && typeof map.getZoom === 'function') {
      // Always get the latest from the map
      this.currentZoom = map.getZoom();
    }
    return this.currentZoom;
  }
  
  /**
   * Navigate to a specific location
   * @param {Object} location - Location with lat/lng properties
   * @param {Object} options - Navigation options
   * @param {number|string} options.mode - Target navigation mode (1/free, 2/birdseye, 3/vicinity) or animation style (smooth, instant, pan)
   * @param {number|null} options.zoom - Zoom level, or null to use current zoom
   * @param {boolean} options.resetMode - Whether to reset mode overrides
   * @param {boolean} options.animate - Whether to animate the transition
   * @returns {Promise} Resolves when navigation completes or fails
   */
  navigateTo(location, options = {}) {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      Logger.error('MapNavigationController', 'Invalid location', location);
      return Promise.reject(new Error('Invalid location'));
    }
    
    Logger.info('MapNavigationController', 'Queuing navigation to location', {
      location: [location.lat, location.lng],
      options
    });
    
    // Queue this navigation operation
    const promise = new Promise((resolve, reject) => {
      this.navigationQueue.push(async () => {
        return new Promise((innerResolve) => {
          setTimeout(() => {
            try {
              // Target location coordinates
              const locationArray = Array.isArray(location) 
                ? location 
                : [location.lat, location.lng];
              
              // Parse options
              const { 
                mode = this.currentMode, // Use current mode if not specified
                zoom = null, 
                resetMode = true,
                animate = true,
                duration = 0.5
              } = options;
              
              // Get zoom level to use
              const currentZoom = zoom !== null ? zoom : this.currentZoom;
              this.currentZoom = currentZoom;
              
              // Process navigation mode changes if needed
              let animationStyle = 'setView'; // default
              
              // Handle string modes (smooth, instant, pan)
              if (typeof mode === 'string') {
                switch (mode.toLowerCase()) {
                  case 'smooth':
                  case 'fly':
                    animationStyle = 'flyTo';
                    break;
                  case 'instant':
                  case 'set':
                    animationStyle = 'setView';
                    break;
                  case 'pan':
                    animationStyle = 'panTo';
                    break;
                  default:
                    animationStyle = 'setView';
                }
              } else if (typeof mode === 'number') {
                // If a numeric navigation mode was specified, update it
                if (mode !== this.currentMode) {
                  this.setNavigationMode(mode, { silent: true });
                }
                // Use smooth animation for mode transitions by default
                animationStyle = animate ? 'flyTo' : 'setView';
              }
              
              // Determine the navigation method to use
              let navigationMethod = null;
              let navigationParams = null;
              
              // Try to use cached methods first (most reliable)
              switch (animationStyle) {
                case 'flyTo':
                  if (this._cachedFlyTo) {
                    navigationMethod = this._cachedFlyTo;
                    navigationParams = [locationArray, currentZoom, { duration, animate }];
                  }
                  break;
                case 'panTo':
                  if (this._cachedPanTo) {
                    navigationMethod = this._cachedPanTo;
                    navigationParams = [locationArray, { animate }];
                  }
                  break;
                case 'setView':
                default:
                  if (this._cachedSetView) {
                    navigationMethod = this._cachedSetView;
                    navigationParams = [locationArray, currentZoom, { animate }];
                  }
                  break;
              }
              
              // If we don't have a cached method, try to get the map instance
              if (!navigationMethod) {
                const map = this.getMapInstance();
                
                if (!map) {
                  Logger.error('MapNavigationController', 'Map instance not available for navigation');
                  reject(new Error('Map instance not available'));
                  innerResolve();
                  return;
                }
                
                // Now try to use the map's methods
                switch (animationStyle) {
                  case 'flyTo':
                    if (typeof map.flyTo === 'function') {
                      navigationMethod = map.flyTo.bind(map);
                      navigationParams = [locationArray, currentZoom, { duration, animate }];
                    } else if (typeof map.setView === 'function') {
                      // Fallback to setView if flyTo not available
                      Logger.warn('MapNavigationController', 'flyTo not available, falling back to setView');
                      navigationMethod = map.setView.bind(map);
                      navigationParams = [locationArray, currentZoom, { animate }];
                    }
                    break;
                  case 'panTo':
                    if (typeof map.panTo === 'function') {
                      navigationMethod = map.panTo.bind(map);
                      navigationParams = [locationArray, { animate }];
                    } else if (typeof map.setView === 'function') {
                      // Fallback to setView if panTo not available
                      Logger.warn('MapNavigationController', 'panTo not available, falling back to setView');
                      navigationMethod = map.setView.bind(map);
                      navigationParams = [locationArray, currentZoom, { animate }];
                    }
                    break;
                  case 'setView':
                  default:
                    if (typeof map.setView === 'function') {
                      navigationMethod = map.setView.bind(map);
                      navigationParams = [locationArray, currentZoom, { animate }];
                    }
                    break;
                }
              }
              
              // If we still don't have a method, we can't navigate
              if (!navigationMethod) {
                Logger.error('MapNavigationController', 'No navigation methods available');
                reject(new Error('No navigation methods available'));
                innerResolve();
                return;
              }
              
              // Finally, execute the navigation
              try {
                Logger.debug('MapNavigationController', `Navigating using ${animationStyle}`, {
                  lat: location.lat,
                  lng: location.lng,
                  zoom: currentZoom
                });
                
                // Apply the navigation
                navigationMethod(...navigationParams);
                
                // Update the selected location if requested
                if (options.updateSelectedLocation) {
                  this.setSelectedLocation(location);
                }
                
                resolve();
              } catch (error) {
                Logger.error('MapNavigationController', 'Error during navigation execution', error);
                reject(error);
              }
              
              innerResolve();
            } catch (error) {
              Logger.error('MapNavigationController', 'Error during navigation', error);
              reject(error);
              innerResolve();
            }
          }, 0);
        });
      });
      
      // Start processing the queue if it's not already being processed
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
    
    return promise;
  }
  
  /**
   * Show both user location and selected location with an aerial view
   * @param {Object} locationA - The first location (typically user location)
   * @param {Object} locationB - The second location (typically selected location)
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  showBirdsEyeView(locationA, locationB, options = {}) {
    return new Promise((resolve, reject) => {
      this.navigationQueue.push(async () => {
        try {
          // Validate locations first
          if (!locationA || !locationB || 
              typeof locationA.lat !== 'number' || typeof locationA.lng !== 'number' ||
              typeof locationB.lat !== 'number' || typeof locationB.lng !== 'number') {
            Logger.error('MapNavigationController', 'Invalid locations for Bird\'s Eye View', {
              locationA,
              locationB
            });
            reject(new Error('Invalid locations for Bird\'s Eye View'));
            return;
          }

          const map = this.getMapInstance();
          if (!map) {
            throw new Error('Map instance not available');
          }
          
          // Always make sure we're in Bird's Eye View mode
          this.currentMode = 2;
          this._notifyModeChange();
          
          // Set flag on map to indicate bird's eye mode
          map._birdEyeViewActive = true;
          
          // Calculate the center and distance between points
          const centerLat = (locationA.lat + locationB.lat) / 2;
          const centerLng = (locationA.lng + locationB.lng) / 2;
          const center = L.latLng(centerLat, centerLng);
          
          // Calculate distance between points in meters
          const distance = map.distance(
            [locationA.lat, locationA.lng],
            [locationB.lat, locationB.lng]
          );
          
          // Create a bounds object that includes both points
          const bounds = L.latLngBounds(
            [locationA.lat, locationA.lng],
            [locationB.lat, locationB.lng]
          );
          
          // Handle case where points are identical or very nearly identical
          const isIdentical = Math.abs(locationA.lat - locationB.lat) < 0.000001 && 
                             Math.abs(locationA.lng - locationB.lng) < 0.000001;
                             
          if (isIdentical) {
            Logger.warn('MapNavigationController', 'Identical points in Bird\'s Eye View, adding offset');
            // Create a slightly expanded bounds
            bounds.extend([locationA.lat + 0.001, locationA.lng + 0.001]);
          }
          
          // Add padding to the bounds - higher padding for longer distances
          // This ensures a consistent aerial perspective regardless of distance
          const paddingFactor = Math.min(1, Math.max(0.3, distance / 5000)); // 0.3 to 1 based on distance
          const paddedBounds = bounds.pad(paddingFactor);
          
          // Store the original bounds on the map
          map._birdEyeViewBounds = paddedBounds;
          
          // Fire an event to notify components
          if (map.fire) {
            map.fire('birdseyeview', {
              active: true,
              bounds: paddedBounds,
              center: center,
              locationA,
              locationB
            });
          }
          
          // Choose an appropriate navigation method based on distance
          if (distance < 100 || isIdentical) {
            // Very close together - use a centered approach with fixed zoom
            // Use a high zoom level for nearby points
            map.flyTo([center.lat, center.lng], 17, {
              animate: options.animate !== false,
              duration: options.duration || 1
            });
          } else if (distance < 500) {
            // Somewhat close - use moderate zoom
            map.flyTo([center.lat, center.lng], 16, {
              animate: options.animate !== false,
              duration: options.duration || 1
            });
          } else {
            // Normal or far distance - use bounds approach
            // This automatically calculates the right zoom level
            map.flyToBounds(paddedBounds, {
              animate: options.animate !== false,
              duration: options.duration || 1,
              easeLinearity: 0.5,
              maxZoom: 16,
              padding: options.padding || [50, 50]
            });
          }
          
          // Update internal zoom state after navigation
          setTimeout(() => {
            if (map && map.getZoom) {
              this.currentZoom = map.getZoom();
              this._notifyZoomChange();
            }
            resolve();
          }, 1000);
        } catch (error) {
          Logger.error('MapNavigationController', 'Error in Bird\'s Eye View', error);
          reject(error);
        }
      });
      
      // Start processing the queue
      this.processQueue();
    });
  }
  
  /**
   * Show vicinity view centered on user location
   * @param {Object} userLocation - User location
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  showVicinityView(userLocation, options = {}) {
    return new Promise((resolve, reject) => {
      this.navigationQueue.push(async () => {
        try {
          const map = this.getMapInstance();
          if (!map) {
            throw new Error('Map instance not available');
          }
          
          // Set the current mode
          this.currentMode = 3;
          this._notifyModeChange();
          
          // Set flag on map to indicate vicinity mode
          map._vicinityActive = true;
          
          // Calculate appropriate zoom level for vicinity view
          const vicinityZoom = options.zoom || 18;
          
          // Navigate to user location
          map.setView([userLocation.lat, userLocation.lng], vicinityZoom, {
            animate: options.animate !== false,
            duration: options.duration || 0.75
          });
          
          // Update internal zoom state
          this.currentZoom = vicinityZoom;
          this._notifyZoomChange();
          
          // Fire an event to notify components
          if (map.fire) {
            map.fire('vicinitymode', {
              active: true,
              center: [userLocation.lat, userLocation.lng],
              zoom: vicinityZoom
            });
          }
          
          resolve();
        } catch (e) {
          Logger.error('MapNavigationController', 'Vicinity view failed', e);
          reject(e);
        }
      });
      
      this.processQueue();
    });
  }
  
  /**
   * Fit the map view to bounds
   * @param {Object} bounds - Leaflet bounds object
   * @param {Object} options - Options for fitBounds
   * @returns {Promise} Resolves when fitBounds completes
   */
  fitBounds(bounds, options = {}) {
    return new Promise((resolve, reject) => {
      this.navigationQueue.push(async () => {
        try {
          const map = this.getMapInstance();
          if (!map) {
            throw new Error('Map instance not available');
          }
          
          map.fitBounds(bounds, {
            padding: options.padding || [50, 50],
            animate: options.animate !== false,
            duration: options.duration || 0.5,
            maxZoom: options.maxZoom || 16
          });
          
          // Update zoom state after bounds fit
          setTimeout(() => {
            if (map && map.getZoom) {
              this.currentZoom = map.getZoom();
              this._notifyZoomChange();
            }
          }, 100);
          
          Logger.debug('MapNavigationController', 'fitBounds successful');
          resolve();
        } catch (e) {
          Logger.error('MapNavigationController', 'fitBounds failed', e);
          reject(e);
        }
      });
      
      this.processQueue();
    });
  }
  
  /**
   * Set the view to a specific location (convenience method)
   * @param {Object|Array} location - Location with lat/lng or as [lat, lng] array
   * @param {number} zoom - Zoom level
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  setView(location, zoom, options = {}) {
    // Handle array format [lat, lng]
    if (Array.isArray(location)) {
      location = { lat: location[0], lng: location[1] };
    }
    
    return this.navigateTo(location, {
      ...options,
      mode: 'instant',
      zoom
    });
  }
  
  /**
   * Smoothly fly to a location (convenience method)
   * @param {Object|Array} location - Location with lat/lng or as [lat, lng] array
   * @param {number} zoom - Zoom level
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  flyTo(location, zoom, options = {}) {
    // Handle array format [lat, lng]
    if (Array.isArray(location)) {
      location = { lat: location[0], lng: location[1] };
    }
    
    return this.navigateTo(location, {
      ...options,
      mode: 'smooth',
      zoom
    });
  }
  
  /**
   * Pan to a location without changing zoom (convenience method)
   * @param {Object|Array} location - Location with lat/lng or as [lat, lng] array
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when navigation completes
   */
  panTo(location, options = {}) {
    // Handle array format [lat, lng]
    if (Array.isArray(location)) {
      location = { lat: location[0], lng: location[1] };
    }
    
    return this.navigateTo(location, {
      ...options,
      mode: 'pan'
    });
  }
  
  /**
   * Invalidate the map size (useful after container resizing)
   */
  invalidateSize() {
    const map = this.getMapInstance();
    if (map && typeof map.invalidateSize === 'function') {
      map.invalidateSize();
      Logger.debug('MapNavigationController', 'Map size invalidated');
    } else {
      Logger.warn('MapNavigationController', 'Could not invalidate map size - method not available');
    }
  }
  
  /**
   * Clear the navigation queue
   */
  clearQueue() {
    Logger.info('MapNavigationController', 'Clearing navigation queue', {
      queueSize: this.navigationQueue.length
    });
    this.navigationQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * Dispose of the controller and clean up resources
   */
  dispose() {
    this.clearQueue();
    this.mapRef = null;
    this.listeners = {
      mode: [],
      location: [],
      ready: [],
      selectedLocation: [],
      zoom: []
    };
    Logger.info('MapNavigationController', 'Controller disposed');
  }
  
  /**
   * Notify listeners of mode changes
   * @private
   */
  _notifyModeChange() {
    // Call the callback if provided
    if (typeof this.onModeChange === 'function') {
      try {
        this.onModeChange(this.currentMode);
      } catch (e) {
        Logger.error('MapNavigationController', 'Error in onModeChange callback', e);
      }
    }
    
    // Support legacy listeners for backward compatibility
    if (this.listeners && this.listeners.mode) {
      this.listeners.mode.forEach(listener => {
        try {
          listener(this.currentMode);
        } catch (e) {
          Logger.error('MapNavigationController', 'Error in mode change listener', e);
        }
      });
    }
  }
  
  /**
   * Notify listeners of location changes
   * @private
   */
  _notifyLocationChange() {
    // Call the callback if provided
    if (typeof this.onLocationChange === 'function') {
      try {
        this.onLocationChange(this.userLocation);
      } catch (e) {
        Logger.error('MapNavigationController', 'Error in onLocationChange callback', e);
      }
    }
    
    // Support legacy listeners for backward compatibility
    if (this.listeners && this.listeners.location) {
      this.listeners.location.forEach(listener => {
        try {
          listener(this.userLocation);
        } catch (e) {
          Logger.error('MapNavigationController', 'Error in location change listener', e);
        }
      });
    }
  }
  
  /**
   * Notify listeners of selected location changes
   * @private
   */
  _notifySelectedLocationChange() {
    // Call the callback if provided
    if (typeof this.onSelectedLocationChange === 'function') {
      try {
        this.onSelectedLocationChange(this.selectedLocation);
      } catch (e) {
        Logger.error('MapNavigationController', 'Error in onSelectedLocationChange callback', e);
      }
    }
    
    // Support legacy listeners for backward compatibility
    if (this.listeners && this.listeners.selectedLocation) {
      this.listeners.selectedLocation.forEach(listener => {
        try {
          listener(this.selectedLocation);
        } catch (e) {
          Logger.error('MapNavigationController', 'Error in selected location change listener', e);
        }
      });
    }
  }
  
  /**
   * Notify listeners of zoom changes
   * @private
   */
  _notifyZoomChange() {
    // Call the callback if provided
    if (typeof this.onZoomChange === 'function') {
      try {
        this.onZoomChange(this.currentZoom);
      } catch (e) {
        Logger.error('MapNavigationController', 'Error in onZoomChange callback', e);
      }
    }
    
    // Support legacy listeners for backward compatibility
    if (this.listeners && this.listeners.zoom) {
      this.listeners.zoom.forEach(listener => {
        try {
          listener(this.currentZoom);
        } catch (e) {
          Logger.error('MapNavigationController', 'Error in zoom change listener', e);
        }
      });
    }
  }
  
  /**
   * Notify listeners that the controller is ready
   * @private
   */
  _notifyReady() {
    // Call the onReady callback if provided
    if (typeof this.onReady === 'function') {
      try {
        this.onReady(this);
      } catch (error) {
        Logger.error('MapNavigationController', 'Error in onReady callback', error);
      }
    }
    
    // Support legacy listeners for backward compatibility
    if (this.listeners && this.listeners.ready) {
      this.listeners.ready.forEach(listener => {
        try {
          listener();
        } catch (error) {
          Logger.error('MapNavigationController', 'Error in ready listener', error);
        }
      });
    }
    
    // Process any queued navigation operations
    if (this.navigationQueue.length > 0) {
      Logger.info('MapNavigationController', `Processing ${this.navigationQueue.length} queued navigation operations`);
      this.processQueue();
    }
  }
  
  /**
   * Check if the controller is ready for navigation
   * If it becomes ready, it will notify listeners
   * @returns {boolean} Whether the controller is ready
   */
  checkReadyStatus() {
    // If already marked as ready, no need to check again
    if (this.isReady) {
      return true;
    }
    
    // Check if we have a valid map instance
    const hasValidMap = this._directMapInstance !== null || 
                        this._cachedSetView !== null || 
                        this._cachedFlyTo !== null || 
                        this._cachedPanTo !== null;
    
    // If we have a valid map, mark as ready
    if (hasValidMap && !this.isReady) {
      this.isReady = true;
      Logger.info('MapNavigationController', 'Navigation controller is now ready');
      this._notifyReady();
    }
    
    return this.isReady;
  }
}

export default MapNavigationController;

// Export constants as static properties
MapNavigationController.FREE_NAVIGATION = FREE_NAVIGATION;
MapNavigationController.BIRDS_EYE_VIEW = BIRDS_EYE_VIEW;
MapNavigationController.VICINITY_MODE = VICINITY_MODE; 