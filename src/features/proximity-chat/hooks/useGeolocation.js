import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentLocation, watchLocation } from '../utils/locationUtils';

/**
 * Custom hook for handling geolocation functionality
 * 
 * This hook provides access to the device's geolocation features,
 * including getting the current position and watching for position updates.
 * It also handles error states and loading states.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableHighAccuracy - Whether to enable high accuracy (default: true)
 * @param {number} options.watchIntervalMs - Interval in ms for position updates when watching (default: 5000)
 * @param {boolean} options.startWatchingImmediately - Whether to start watching location immediately (default: false)
 * @returns {Object} Geolocation state and methods
 */
const useGeolocation = ({
  enableHighAccuracy = true,
  watchIntervalMs = 5000,
  startWatchingImmediately = false
} = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);
  
  /**
   * Gets the device's current location once
   * 
   * @returns {Promise<Object>} Promise resolving to location object
   */
  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentLocation();
      setLocation(position);
      setIsLoading(false);
      return position;
    } catch (err) {
      setError(formatLocationError(err));
      setIsLoading(false);
      throw err;
    }
  }, []);
  
  /**
   * Starts watching the device's location
   * 
   * @returns {void}
   */
  const startWatching = useCallback(() => {
    // Don't start a new watcher if one is already active
    if (isWatching || watchIdRef.current) {
      return;
    }
    
    setIsWatching(true);
    setError(null);
    
    try {
      const unwatchFn = watchLocation((position) => {
        setLocation(position);
        setIsLoading(false);
      });
      
      watchIdRef.current = unwatchFn;
    } catch (err) {
      setError(formatLocationError(err));
      setIsWatching(false);
    }
  }, [isWatching]);
  
  /**
   * Stops watching the device's location
   * 
   * @returns {void}
   */
  const stopWatching = useCallback(() => {
    if (!isWatching || !watchIdRef.current) {
      return;
    }
    
    // Call the cleanup function
    watchIdRef.current();
    watchIdRef.current = null;
    setIsWatching(false);
  }, [isWatching]);
  
  /**
   * Formats geolocation errors into user-friendly messages
   * 
   * @param {Error} err - The original error
   * @returns {string} Formatted error message
   */
  const formatLocationError = (err) => {
    if (!err) return 'Unknown error';
    
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        return 'Location access denied. Please enable location services for this site.';
      case 2: // POSITION_UNAVAILABLE
        return 'Your location is currently unavailable. Please try again later.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please check your connection and try again.';
      default:
        return err.message || 'Error accessing your location.';
    }
  };
  
  // Start watching immediately if specified
  useEffect(() => {
    if (startWatchingImmediately) {
      startWatching();
    }
    
    // Clean up on unmount
    return () => {
      if (watchIdRef.current) {
        watchIdRef.current();
        watchIdRef.current = null;
      }
    };
  }, [startWatchingImmediately, startWatching]);
  
  return {
    location,
    error,
    isLoading,
    isWatching,
    getLocation,
    startWatching,
    stopWatching,
    hasLocation: !!location,
    latitude: location?.latitude,
    longitude: location?.longitude
  };
};

export default useGeolocation; 