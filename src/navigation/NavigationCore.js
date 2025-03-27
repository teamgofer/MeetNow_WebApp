/**
 * NavigationCore.js
 * Core navigation state management with strict validation
 */

import EventEmitter from 'events';
import Logger from '../utils/Logger';

// Navigation modes as enum
export const NavigationMode = Object.freeze({
  FREE: 'FREE_NAVIGATION',
  BIRDS_EYE: 'BIRDS_EYE_VIEW',
  VICINITY: 'VICINITY_MODE'
});

// Event types for the navigation system
export const NavigationEvent = Object.freeze({
  MODE_CHANGED: 'navigation:mode-changed',
  LOCATION_CHANGED: 'navigation:location-changed',
  SELECTED_LOCATION_CHANGED: 'navigation:selected-location-changed',
  ZOOM_CHANGED: 'navigation:zoom-changed',
  MAP_READY: 'navigation:map-ready',
  ERROR: 'navigation:error'
});

/**
 * Validates a location object
 * @param {Object} location - Location object to validate
 * @returns {boolean} Whether the location is valid
 */
export function isValidLocation(location) {
  if (!location) return false;
  if (typeof location !== 'object') return false;
  if (typeof location.lat !== 'number' || isNaN(location.lat)) return false;
  if (typeof location.lng !== 'number' || isNaN(location.lng)) return false;
  return true;
}

/**
 * Core navigation state management with events
 */
class NavigationCore {
  constructor(options = {}) {
    // Initialize event system
    this.events = new EventEmitter();
    
    // Set maximum listeners to prevent memory leaks
    this.events.setMaxListeners(20);
    
    // Initialize state with defaults and provided options
    this.state = {
      mode: NavigationMode.FREE,
      userLocation: null,
      selectedLocation: null,
      zoom: options.defaultZoom || 15,
      minZoom: options.minZoom || 5,
      maxZoom: options.maxZoom || 18,
      map: null,
      ready: false
    };
    
    // Validation error log level (info, warn, error)
    this.validationErrorLevel = options.validationErrorLevel || 'warn';
    
    // Debug mode
    this.debug = !!options.debug;
    
    // Initialize navigation mode transition definition
    this.transitions = {
      [NavigationMode.FREE]: {
        enter: this._enterFreeMode.bind(this),
        exit: this._exitFreeMode.bind(this),
        allowedTransitions: [NavigationMode.BIRDS_EYE, NavigationMode.VICINITY]
      },
      [NavigationMode.BIRDS_EYE]: {
        enter: this._enterBirdsEyeMode.bind(this),
        exit: this._exitBirdsEyeMode.bind(this),
        allowedTransitions: [NavigationMode.FREE, NavigationMode.VICINITY]
      },
      [NavigationMode.VICINITY]: {
        enter: this._enterVicinityMode.bind(this),
        exit: this._exitVicinityMode.bind(this),
        allowedTransitions: [NavigationMode.FREE, NavigationMode.BIRDS_EYE]
      }
    };
    
    // Log initialization
    if (this.debug) {
      Logger.debug('NavigationCore', 'Initialized with options:', options);
    }
  }
  
  /**
   * Subscribe to navigation events
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    if (typeof callback !== 'function') {
      Logger.warn('NavigationCore', 'Invalid callback provided for event subscription');
      return () => {};
    }
    
    this.events.on(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      this.events.removeListener(eventType, callback);
    };
  }
  
  /**
   * Update navigation state with validation
   * @param {Object} newState - Partial state to merge
   * @returns {boolean} Whether the update was successful
   */
  updateState(newState) {
    if (!newState || typeof newState !== 'object') {
      this.logValidationError('Invalid state update');
      return false;
    }
    
    const validatedState = {};
    let hasChanges = false;
    
    // Process mode change separately to use state machine
    if (newState.mode !== undefined && newState.mode !== this.state.mode) {
      const success = this._changeMode(newState.mode);
      if (!success) {
        return false;
      }
      hasChanges = true;
    }
    
    // Validate and apply user location
    if (newState.userLocation !== undefined) {
      if (newState.userLocation === null || isValidLocation(newState.userLocation)) {
        if (JSON.stringify(newState.userLocation) !== JSON.stringify(this.state.userLocation)) {
          validatedState.userLocation = newState.userLocation;
          hasChanges = true;
        }
      } else {
        this.logValidationError('Invalid user location', newState.userLocation);
      }
    }
    
    // Validate and apply selected location
    if (newState.selectedLocation !== undefined) {
      if (newState.selectedLocation === null || isValidLocation(newState.selectedLocation)) {
        if (JSON.stringify(newState.selectedLocation) !== JSON.stringify(this.state.selectedLocation)) {
          validatedState.selectedLocation = newState.selectedLocation;
          hasChanges = true;
        }
      } else {
        this.logValidationError('Invalid selected location', newState.selectedLocation);
      }
    }
    
    // Validate and apply zoom
    if (newState.zoom !== undefined) {
      const zoom = Number(newState.zoom);
      if (!isNaN(zoom) && zoom >= this.state.minZoom && zoom <= this.state.maxZoom) {
        if (zoom !== this.state.zoom) {
          validatedState.zoom = zoom;
          hasChanges = true;
        }
      } else {
        this.logValidationError('Invalid zoom level', newState.zoom);
      }
    }
    
    // Apply map reference
    if (newState.map !== undefined) {
      validatedState.map = newState.map;
      
      // Update ready state based on map presence
      const newReadyState = !!validatedState.map;
      if (newReadyState !== this.state.ready) {
        validatedState.ready = newReadyState;
        hasChanges = true;
      }
    }
    
    // Apply changes if any
    if (hasChanges) {
      this.state = { ...this.state, ...validatedState };
      
      // Emit relevant events
      if (validatedState.userLocation !== undefined) {
        this.events.emit(NavigationEvent.LOCATION_CHANGED, this.state.userLocation);
      }
      
      if (validatedState.selectedLocation !== undefined) {
        this.events.emit(NavigationEvent.SELECTED_LOCATION_CHANGED, this.state.selectedLocation);
      }
      
      if (validatedState.zoom !== undefined) {
        this.events.emit(NavigationEvent.ZOOM_CHANGED, this.state.zoom);
      }
      
      if (validatedState.ready !== undefined && validatedState.ready) {
        this.events.emit(NavigationEvent.MAP_READY, this.state.map);
      }
    }
    
    return hasChanges;
  }
  
  /**
   * Get the current state
   * @returns {Object} Current navigation state
   */
  getState() {
    // Return a copy to prevent direct mutation
    return { ...this.state };
  }
  
  /**
   * Change navigation mode using state machine
   * @param {string} newMode - Target navigation mode
   * @returns {boolean} Whether the mode change was successful
   * @private
   */
  _changeMode(newMode) {
    // Validate mode
    if (!Object.values(NavigationMode).includes(newMode)) {
      this.logValidationError('Invalid navigation mode', newMode);
      return false;
    }
    
    // No change needed
    if (newMode === this.state.mode) {
      return true;
    }
    
    // Check if transition is allowed
    const currentModeDefinition = this.transitions[this.state.mode];
    if (!currentModeDefinition.allowedTransitions.includes(newMode)) {
      this.logValidationError(
        `Transition from ${this.state.mode} to ${newMode} not allowed`
      );
      return false;
    }
    
    // Get transition definitions
    const exitFn = currentModeDefinition.exit;
    const enterFn = this.transitions[newMode].enter;
    
    try {
      // Execute exit action for current mode
      if (typeof exitFn === 'function') {
        exitFn(this.state);
      }
      
      // Remember old mode for event
      const oldMode = this.state.mode;
      
      // Update mode
      this.state.mode = newMode;
      
      // Execute enter action for new mode
      if (typeof enterFn === 'function') {
        enterFn(this.state);
      }
      
      // Emit mode change event
      this.events.emit(NavigationEvent.MODE_CHANGED, {
        from: oldMode,
        to: newMode
      });
      
      return true;
    } catch (error) {
      // Log error and emit event
      Logger.error('NavigationCore', 'Error during mode transition', error);
      this.events.emit(NavigationEvent.ERROR, {
        type: 'mode_transition',
        message: 'Error during mode transition',
        error
      });
      
      return false;
    }
  }
  
  /**
   * Log validation errors with configurable level
   * @param {string} message - Error message
   * @param {*} data - Additional error data
   * @private
   */
  logValidationError(message, data) {
    const logFn = Logger[this.validationErrorLevel] || Logger.warn;
    logFn('NavigationCore', message, data);
    
    // Also emit error event
    this.events.emit(NavigationEvent.ERROR, {
      type: 'validation',
      message,
      data
    });
  }
  
  /**
   * Actions when entering free navigation mode
   * @param {Object} state - Current state
   * @private
   */
  _enterFreeMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Entering FREE navigation mode');
    }
    
    // Free mode has no special setup requirements
    return true;
  }
  
  /**
   * Actions when exiting free navigation mode
   * @param {Object} state - Current state
   * @private
   */
  _exitFreeMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Exiting FREE navigation mode');
    }
    
    // No cleanup needed
    return true;
  }
  
  /**
   * Actions when entering bird's eye view mode
   * @param {Object} state - Current state
   * @private
   */
  _enterBirdsEyeMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Entering BIRDS_EYE navigation mode');
    }
    
    // Requires both user location and selected location
    if (!state.userLocation || !state.selectedLocation) {
      this.logValidationError(
        'Bird\'s Eye View mode requires both user and selected locations',
        { userLocation: state.userLocation, selectedLocation: state.selectedLocation }
      );
      return false;
    }
    
    return true;
  }
  
  /**
   * Actions when exiting bird's eye view mode
   * @param {Object} state - Current state
   * @private
   */
  _exitBirdsEyeMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Exiting BIRDS_EYE navigation mode');
    }
    
    // No special cleanup needed
    return true;
  }
  
  /**
   * Actions when entering vicinity mode
   * @param {Object} state - Current state
   * @private
   */
  _enterVicinityMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Entering VICINITY navigation mode');
    }
    
    // Requires user location
    if (!state.userLocation) {
      this.logValidationError(
        'Vicinity mode requires user location',
        { userLocation: state.userLocation }
      );
      return false;
    }
    
    return true;
  }
  
  /**
   * Actions when exiting vicinity mode
   * @param {Object} state - Current state
   * @private
   */
  _exitVicinityMode(state) {
    if (this.debug) {
      Logger.debug('NavigationCore', 'Exiting VICINITY navigation mode');
    }
    
    // No special cleanup needed
    return true;
  }
  
  /**
   * Dispose of the navigation core and clean up event listeners
   */
  dispose() {
    this.events.removeAllListeners();
    this.state = null;
    
    if (this.debug) {
      Logger.debug('NavigationCore', 'Disposed');
    }
  }
}

export default NavigationCore; 