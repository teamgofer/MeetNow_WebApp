/**
 * Map Navigation Integration
 * 
 * This file provides functions to integrate the new navigation system
 * with the existing MeetNowApp in a non-disruptive way.
 */

import Logger from './Logger';
import { NavigationController } from '../navigation';
import { migrateFromOldController, createLegacyCompatibleProxy } from '../navigation/migration';

// Reference to singleton instance (for non-React code)
let singletonInstance = null;

/**
 * Determine whether to use the new navigation system or the old one
 * Based on feature flag, config setting, or other criteria
 */
export function shouldUseNewNavigation() {
  // This could check localStorage, a feature flag, an environment variable, etc.
  const useNew = localStorage.getItem('useNewNavigation');
  return useNew === 'true';
}

/**
 * Enable the new navigation system
 */
export function enableNewNavigation() {
  localStorage.setItem('useNewNavigation', 'true');
  Logger.info('Navigation', 'New navigation system enabled - will take effect on next page load');
}

/**
 * Disable the new navigation system
 */
export function disableNewNavigation() {
  localStorage.setItem('useNewNavigation', 'false');
  Logger.info('Navigation', 'New navigation system disabled - will take effect on next page load');
}

/**
 * Creates a controller appropriate for the current configuration
 * Either creates a new NavigationController or loads the old MapNavigationController
 * @param {Object} options - Controller initialization options
 * @returns {Object} Navigation controller instance
 */
export async function createControllerForApp(options = {}) {
  try {
    // Log controller creation
    Logger.info('Navigation', 'Creating navigation controller');
    
    if (shouldUseNewNavigation()) {
      Logger.info('Navigation', 'Using new navigation system');
      
      // Create new controller
      const controller = new NavigationController(options);
      
      // Create proxy to ensure complete backward compatibility
      const compatibleController = createLegacyCompatibleProxy(controller);
      
      // Store singleton for non-React code
      singletonInstance = compatibleController;
      
      return compatibleController;
    } else {
      Logger.info('Navigation', 'Using legacy navigation system');
      
      // Dynamically import the old controller to avoid circular dependencies
      const { default: MapNavigationController } = await import('./MapNavigationController');
      
      // Create old controller
      const controller = new MapNavigationController(options);
      
      // Store singleton for non-React code
      singletonInstance = controller;
      
      return controller;
    }
  } catch (error) {
    Logger.error('Navigation', 'Error creating controller', error);
    
    // Fallback to old system in case of error
    const { default: MapNavigationController } = await import('./MapNavigationController');
    const fallbackController = new MapNavigationController(options);
    singletonInstance = fallbackController;
    return fallbackController;
  }
}

/**
 * Migrates an existing old controller to the new system
 * @param {Object} oldController - Existing MapNavigationController instance
 * @returns {Object} New controller instance with state preserved
 */
export function migrateController(oldController) {
  if (!oldController) {
    Logger.warn('Navigation', 'Cannot migrate null controller');
    return null;
  }
  
  try {
    const newController = migrateFromOldController(oldController);
    
    // Create proxy for complete compatibility
    const compatibleController = createLegacyCompatibleProxy(newController);
    
    // Update singleton
    singletonInstance = compatibleController;
    
    return compatibleController;
  } catch (error) {
    Logger.error('Navigation', 'Error migrating controller', error);
    return oldController; // Return original on error
  }
}

/**
 * Gets the current navigation controller instance
 * Used by non-React code that needs access to the controller
 * @returns {Object} Current controller instance
 */
export function getNavigationController() {
  return singletonInstance;
}

export default {
  createControllerForApp,
  migrateController,
  getNavigationController,
  shouldUseNewNavigation,
  enableNewNavigation,
  disableNewNavigation
}; 