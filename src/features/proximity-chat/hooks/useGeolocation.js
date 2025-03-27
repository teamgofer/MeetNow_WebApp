import { useState, useEffect, useRef } from 'react';
import { LocationService } from '../services/LocationService';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * Custom hook for handling geolocation functionality
 * 
 * This hook provides access to the device's geolocation features,
 * including getting the current position and watching for position updates.
 * It also handles error states and loading states.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.startWatchingImmediately - Whether to start watching location immediately (default: false)
 * @param {boolean} options.highAccuracy - Whether to enable high accuracy (default: true)
 * @param {number} options.timeout - Timeout for location requests in ms (default: 30000)
 * @param {number} options.maximumAge - Maximum age of cached location in ms (default: 300000)
 * @param {Function} options.onError - Callback function to handle location errors
 * @returns {Object} Geolocation state and methods
 */
const useGeolocation = ({
  startWatchingImmediately = false,
  highAccuracy = true,
  timeout = 30000, // 30 seconds
  maximumAge = 300000, // 5 minutes
  onError = null
} = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  
  const locationServiceRef = useRef(null);
  const watchIdRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());
  
  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', renderDuration, {
      success: true,
      action: 'initialize',
      highAccuracy,
      timeout,
      maximumAge,
      startWatchingImmediately
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [highAccuracy, timeout, maximumAge, startWatchingImmediately]);
  
  // Initialize location service
  useEffect(() => {
    if (!locationServiceRef.current) {
      const startTime = Date.now();
      
      try {
        locationServiceRef.current = new LocationService({
          enableHighAccuracy: highAccuracy,
          timeout: timeout,
          maximumAge: maximumAge
        });
        
        // Set up location listener
        locationServiceRef.current.onLocationChange((newLocation) => {
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
            success: true,
            action: 'locationUpdate',
            accuracy: newLocation.accuracy,
            timestamp: newLocation.timestamp,
            hasLocation: true
          });
          
          setLocation(newLocation);
          setError(null);
        });
        
        // Set up error listener
        locationServiceRef.current.onError((error) => {
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
            success: false,
            action: 'locationError',
            error: error.message,
            errorCode: error.code,
            hasCachedLocation: !!locationServiceRef.current.locationCache.location
          });
          
          setError(formatLocationError(error));
          // Try to use cached location if available
          if (locationServiceRef.current.locationCache.location) {
            setLocation(locationServiceRef.current.locationCache.location);
          }
        });
      } catch (err) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
          success: false,
          action: 'serviceInit',
          error: err.message
        });
        console.error('Error initializing location service:', err);
      }
    }
    
    return () => {
      if (locationServiceRef.current) {
        locationServiceRef.current.removeAllListeners();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [highAccuracy, timeout, maximumAge]);
  
  /**
   * Get current location with retry logic
   */
  const getLocation = async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await locationServiceRef.current.getCurrentLocation();
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
        success: true,
        action: 'getLocation',
        accuracy: location.accuracy,
        timestamp: location.timestamp,
        hasLocation: true
      });
      
      setLocation(location);
    } catch (err) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
        success: false,
        action: 'getLocation',
        error: err.message,
        errorCode: err.code,
        hasCachedLocation: !!locationServiceRef.current.locationCache.location
      });
      
      setError(formatLocationError(err));
      // If we have a cached location, use it
      if (locationServiceRef.current.locationCache.location) {
        setLocation(locationServiceRef.current.locationCache.location);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Start watching location with retry logic
   */
  const startWatching = async () => {
    if (isWatching) return;
    
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    
    try {
      await locationServiceRef.current.startTracking();
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
        success: true,
        action: 'startWatching',
        highAccuracy,
        timeout,
        maximumAge
      });
      
      setIsWatching(true);
    } catch (err) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
        success: false,
        action: 'startWatching',
        error: err.message,
        errorCode: err.code,
        hasCachedLocation: !!locationServiceRef.current.locationCache.location
      });
      
      setError(formatLocationError(err));
      // If we have a cached location, use it
      if (locationServiceRef.current.locationCache.location) {
        setLocation(locationServiceRef.current.locationCache.location);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Stop watching location
   */
  const stopWatching = () => {
    const startTime = Date.now();
    
    if (locationServiceRef.current) {
      locationServiceRef.current.stopTracking();
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useGeolocation', duration, {
        success: true,
        action: 'stopWatching',
        wasWatching: isWatching
      });
      
      setIsWatching(false);
    }
  };
  
  /**
   * Formats geolocation errors into user-friendly messages
   */
  const formatLocationError = (err) => {
    if (!err) return 'Unknown error';
    
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        return 'Location access denied. Please enable location services for this site.';
      case 2: // POSITION_UNAVAILABLE
        return 'Your location is currently unavailable. Using last known location.';
      case 3: // TIMEOUT
        return 'Location request timed out. Using last known location.';
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
      stopWatching();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [startWatchingImmediately]);
  
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