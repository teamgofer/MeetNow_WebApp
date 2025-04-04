import { useState, useEffect, useRef, useCallback } from 'react';

import { handleGeolocationError, createGeolocationError } from '../utils/error-handler';
import { locationRequestManager } from '../utils/location-services';
import logger from '../utils/Logger';

/**
 * Location object returned by the hook
 */
export interface ILocation {
  lat: number;
  lng: number;
  display_name: string;
  // Add these properties to maintain compatibility with the proximity chat feature
  latitude?: number;
  longitude?: number;
  address?: string;
}

/**
 * Options for the useGeolocation hook
 */
export interface IGeolocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  retryCount: number;
  retryDelay: number;
  useCaching: boolean;
}

/**
 * Return type for the useGeolocation hook
 */
export interface IGeolocationState {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Enhanced hook for getting user location with caching, retries, and better timeout handling
 * @param options - Options for geolocation
 * @returns Location state object { location, error, isLoading, refresh }
 */
export const useGeolocation = (options: Partial<GeolocationOptions> = {}): GeolocationState => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default options
  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 30000, // 30 seconds
    retryCount: 2,
    retryDelay: 2000,
    useCaching: true,
  };

  // Merge defaults with provided options
  const geolocationOptions: GeolocationOptions = { ...defaultOptions, ...options };

  // Track attempts and abort controller
  const attemptsRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  // Use caching if specified
  const cachedLocationRef = useRef<Location | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  /**
   * Refresh location data manually
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (isLoading) return; // Prevent concurrent requests

    setIsLoading(true);
    setError(null);
    attemptsRef.current = 0;

    try {
      await getLocation();
    } catch (err) {
      // Error is handled in getLocation
      logger.error('Location refresh failed', err instanceof Error ? err.message : String(err));
    }
  }, [isLoading]);

  /**
   * Get location with retry logic
   */
  const getLocation = useCallback(async (): Promise<void> => {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      const error = createGeolocationError('Geolocation is not supported by your browser');
      setError(error.message);
      setIsLoading(false);
      handleGeolocationError(error);
      return;
    }

    // Check for cached location if enabled
    if (
      geolocationOptions.useCaching &&
      cachedLocationRef.current &&
      Date.now() - lastRequestTimeRef.current < geolocationOptions.maximumAge
    ) {
      logger.info('Using cached location', JSON.stringify(cachedLocationRef.current));
      setLocation(cachedLocationRef.current);
      setIsLoading(false);
      return;
    }

    // Use LocationRequestManager if caching is enabled
    if (geolocationOptions.useCaching) {
      try {
        const requestedLocation = await locationRequestManager.requestLocation();
        setLocation(requestedLocation as Location);
        cachedLocationRef.current = requestedLocation as Location;
        lastRequestTimeRef.current = Date.now();
        setIsLoading(false);
        return;
      } catch (error) {
        // Fall back to direct geolocation if LocationRequestManager fails
        logger.warn(
          'LocationRequestManager failed, falling back to direct geolocation',
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Clean up any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();

    try {
      // Manually implement timeout since some browsers ignore the timeout option
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, geolocationOptions.timeout);
        timeoutIdRef.current = id as unknown as number;
      });

      // Create position promise
      const positionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: geolocationOptions.enableHighAccuracy,
          timeout: geolocationOptions.timeout,
          maximumAge: geolocationOptions.maximumAge,
        });
      });

      // Race position and timeout
      const position = await Promise.race([positionPromise, timeoutPromise]);

      // Clear timeout if we got a position
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      const { latitude, longitude } = position.coords;
      const newLocation: Location = {
        lat: latitude,
        lng: longitude,
        display_name: 'Your Location',
        // Add these to maintain compatibility
        latitude: latitude,
        longitude: longitude,
      };

      // Update location state
      setLocation(newLocation);
      setIsLoading(false);

      // Update cache
      if (geolocationOptions.useCaching) {
        cachedLocationRef.current = newLocation;
        lastRequestTimeRef.current = Date.now();
      }

      logger.info('Geolocation obtained successfully', JSON.stringify({ latitude, longitude }));
    } catch (error) {
      // Handle retries if we still have attempts left
      if (attemptsRef.current < geolocationOptions.retryCount) {
        attemptsRef.current++;
        logger.warn(
          `Geolocation attempt ${attemptsRef.current} failed, retrying in ${geolocationOptions.retryDelay}ms`,
          error instanceof Error ? error.message : String(error)
        );

        // Wait and retry
        setTimeout(() => {
          getLocation();
        }, geolocationOptions.retryDelay);
        return;
      }

      // No more retries, handle the error
      let errorMessage = 'Unable to retrieve your location';

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case 1: // error.PERMISSION_DENIED
            errorMessage = 'Location permission denied';
            break;
          case 2: // error.POSITION_UNAVAILABLE
            errorMessage = 'Location information unavailable';
            break;
          case 3: // error.TIMEOUT
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Use error handler utility
      const geoError = createGeolocationError(errorMessage);
      handleGeolocationError(geoError, {
        originalError: error instanceof Error ? error : undefined,
      });

      setError(errorMessage);
      setIsLoading(false);
      logger.error(
        'Geolocation error',
        JSON.stringify({
          message: errorMessage,
          originalError: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }, [geolocationOptions]);

  // Initialize on component mount
  useEffect(() => {
    getLocation();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [getLocation]);

  return {
    location,
    error,
    isLoading,
    refresh,
  };
};

export default useGeolocation;
