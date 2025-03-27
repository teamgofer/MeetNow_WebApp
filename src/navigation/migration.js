/**
 * Navigation System Migration Utilities
 * 
 * These utilities help integrate the new navigation system
 * with code that was built for the old MapNavigationController.
 */

import { 
  NavigationController, 
  NavigationMode,
  isValidLocation 
} from './index';
import Logger from '../utils/Logger';

/**
 * Creates a new navigation controller that's compatible with the old API
 * @param {Object} options - Configuration options
 * @returns {NavigationController} Controller instance
 */
export function createLegacyCompatibleController(options = {}) {
  const logger = Logger.forComponent('NavigationMigration');
  logger.info('Creating legacy-compatible navigation controller');
  
  // Map old numeric mode constants to new string constants
  const modeMap = {
    1: NavigationMode.FREE,
    2: NavigationMode.BIRDS_EYE,
    3: NavigationMode.VICINITY
  };
  
  // Map default mode if provided
  let defaultMode = options.defaultMode;
  if (typeof defaultMode === 'number' && modeMap[defaultMode]) {
    defaultMode = modeMap[defaultMode];
  }
  
  const controller = new NavigationController({
    ...options,
    defaultMode
  });
  
  // Add legacy properties that may be accessed directly
  controller.mapRef = options.mapRef || null;
  
  // Log wrapper for monitoring legacy API usage
  const logLegacyApiUsage = (methodName) => {
    logger.debug(`Legacy API used: ${methodName}`);
  };
  
  // Wrap legacy methods to add logging and better compatibility
  const originalNavigateTo = controller.navigateTo.bind(controller);
  controller.navigateTo = (location, options = {}) => {
    logLegacyApiUsage('navigateTo');
    
    // Handle legacy API for mode overrides
    if (options.modeOverride && typeof options.modeOverride === 'number') {
      options.mode = options.modeOverride;
    }
    
    return originalNavigateTo(location, options);
  };
  
  const originalShowBirdsEyeView = controller.showBirdsEyeView.bind(controller);
  controller.showBirdsEyeView = (locationA, locationB, options = {}) => {
    logLegacyApiUsage('showBirdsEyeView');
    
    // Add migration-specific handling here
    // For example, validate locations more thoroughly
    if (!locationA || !locationB) {
      logger.warn('showBirdsEyeView called with invalid locations');
      return Promise.reject(new Error('Invalid locations for Bird\'s Eye View'));
    }
    
    return originalShowBirdsEyeView(locationA, locationB, options);
  };
  
  const originalShowVicinityView = controller.showVicinityView.bind(controller);
  controller.showVicinityView = (userLocation, options = {}) => {
    logLegacyApiUsage('showVicinityView');
    
    // Add migration-specific handling here
    if (!isValidLocation(userLocation)) {
      logger.warn('showVicinityView called with invalid location');
      return Promise.reject(new Error('Invalid location for Vicinity View'));
    }
    
    return originalShowVicinityView(userLocation, options);
  };
  
  logger.info('Legacy-compatible controller created successfully');
  return controller;
}

/**
 * Creates a new controller from an existing old-style controller
 * preserving as much state as possible
 * @param {Object} oldController - Old MapNavigationController instance
 * @returns {NavigationController} New controller instance
 */
export function migrateFromOldController(oldController) {
  const logger = Logger.forComponent('NavigationMigration');
  logger.info('Migrating from old controller');
  
  if (!oldController) {
    logger.warn('No old controller provided for migration');
    return new NavigationController();
  }
  
  try {
    // Extract as much state as possible from the old controller
    const options = {
      mapRef: oldController.mapRef || null,
      defaultZoom: oldController.defaultZoom || 15,
      defaultMode: oldController.getNavigationMode() || 1,
      
      // Transfer any callbacks that might be present
      onModeChange: oldController.onModeChange || null,
      onLocationChange: oldController.onLocationChange || null,
      onSelectedLocationChange: oldController.onSelectedLocationChange || null,
      onZoomChange: oldController.onZoomChange || null,
      onReady: oldController.onReady || null
    };
    
    // Create new controller with extracted options
    const newController = createLegacyCompatibleController(options);
    
    // Transfer current state
    if (oldController.getUserLocation) {
      const userLocation = oldController.getUserLocation();
      if (isValidLocation(userLocation)) {
        newController.setUserLocation(userLocation);
      }
    }
    
    if (oldController.getSelectedLocation) {
      const selectedLocation = oldController.getSelectedLocation();
      if (isValidLocation(selectedLocation)) {
        newController.setSelectedLocation(selectedLocation);
      }
    }
    
    logger.info('Successfully migrated from old controller');
    return newController;
    
  } catch (error) {
    logger.error('Error migrating from old controller', error);
    return new NavigationController();
  }
}

/**
 * Creates a proxy wrapper around the new controller that
 * intercepts and adapts all API calls to be compatible
 * with the old controller's interface
 * @param {NavigationController} controller - New navigation controller
 * @returns {Object} A proxy wrapping the controller
 */
export function createLegacyCompatibleProxy(controller) {
  if (!controller) {
    return null;
  }
  
  const logger = Logger.forComponent('NavigationMigration');
  logger.info('Creating legacy-compatible proxy');
  
  // Old-style mode constants  
  const FREE_NAVIGATION = 1;
  const BIRDS_EYE_VIEW = 2;
  const VICINITY_MODE = 3;
  
  // Create proxy to intercept property access and method calls
  return new Proxy(controller, {
    get(target, prop, receiver) {
      // Handle mode constants first
      if (prop === 'FREE_NAVIGATION') return FREE_NAVIGATION;
      if (prop === 'BIRDS_EYE_VIEW') return BIRDS_EYE_VIEW;
      if (prop === 'VICINITY_MODE') return VICINITY_MODE;
      
      // Get the original value
      const value = Reflect.get(target, prop, receiver);
      
      // If it's not a function, just return it
      if (typeof value !== 'function') {
        return value;
      }
      
      // Wrap functions to handle legacy API patterns
      return function(...args) {
        logger.debug(`Legacy proxy: ${prop} called`);
        
        try {
          // Call the original function
          return value.apply(this, args);
        } catch (error) {
          logger.error(`Error in legacy proxy ${prop}:`, error);
          throw error;
        }
      };
    }
  });
}

export default {
  createLegacyCompatibleController,
  migrateFromOldController,
  createLegacyCompatibleProxy
}; 