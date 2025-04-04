import { useCallback, useState } from 'react';
import Logger from '../utils/Logger';

/**
 * Interface for geographical coordinates
 */
interface ICoordinates {
  lat: number;
  lng: number;
}

/**
 * Interface for location search options
 */
interface ISearchOptions {
  limit?: number;
  language?: string;
  [key: string]: any;
}

/**
 * Interface for geolocation options
 */
interface IGeolocationOptions extends PositionOptions {
  [key: string]: any;
}

/**
 * Interface for location information
 */
interface ILocation extends ICoordinates {
  accuracy?: number;
  timestamp?: number;
  formattedAddress?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  [key: string]: any;
}

/**
 * Interface for the useLocation hook return value
 */
interface IUseLocationReturn {
  location: ILocation | null;
  isLoading: boolean;
  error: Error | string | null;
  searchLocations: (query: string, options?: ISearchOptions) => Promise<ILocation[]>;
  reverseGeocode: (coordinates: ICoordinates) => Promise<ILocation[]>;
  getCurrentLocation: (options?: IGeolocationOptions) => Promise<ILocation>;
  calculateDistance: (point1: ICoordinates, point2: ICoordinates) => number;
}

/**
 * Custom hook for location-related functionality
 * Provides methods for searching locations and reverse geocoding
 */
const useLocation = (): IUseLocationReturn => {
  const [location, setLocation] = useState<ILocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);

  /**
   * Search for locations by query string
   *
   * @param query - The search query
   * @param options - Optional search parameters
   * @returns Array of location results
   */
  const searchLocations = useCallback(
    async (query: string, options: ISearchOptions = {}): Promise<ILocation[]> => {
      if (!query) return [];

      try {
        setIsLoading(true);
        setError(null);

        // Prepare search parameters
        const params = new URLSearchParams();
        params.append('q', query);

        // Add optional parameters
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });

        // Make API request
        const response = await fetch(`/api/geocode?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const results = await response.json();

        // Process and return results
        return Array.isArray(results) ? results : [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search locations';
        setError(errorMessage);
        console.error('Error searching locations:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Reverse geocode coordinates to get address information
   *
   * @param coordinates - The coordinates to reverse geocode
   * @returns Array of location results (usually just one)
   */
  const reverseGeocode = useCallback(async (coordinates: ICoordinates): Promise<ILocation[]> => {
    if (!coordinates?.lat || !coordinates.lng) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare reverse geocode parameters
      const params = new URLSearchParams();
      params.append('lat', coordinates.lat.toString());
      params.append('lng', coordinates.lng.toString());

      // Make API request
      const response = await fetch(`/api/reverse-geocode?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }

      const results = await response.json();

      // Process and return results
      return Array.isArray(results) ? results : [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get address information';
      setError(errorMessage);
      console.error('Error reverse geocoding:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get the user's current location
   *
   * @param options - Geolocation options
   * @returns The user's location
   */
  const getCurrentLocation = useCallback(
    async (options: IGeolocationOptions = {}): Promise<ILocation> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if geolocation is available
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        // Get current position
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options,
          });
        });

        // Format the result
        const locationData: ILocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Try to reverse geocode to get address
        try {
          const geocodeResults = await reverseGeocode(locationData);
          if (geocodeResults && geocodeResults.length > 0) {
            return {
              ...locationData,
              ...geocodeResults[0],
            };
          }
        } catch (geocodeErr) {
          console.warn('Failed to reverse geocode location:', geocodeErr);
          // Continue with just coordinates
        }

        return locationData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
        setError(errorMessage);
        console.error('Error getting current location:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [reverseGeocode]
  );

  /**
   * Calculate the distance between two geographic points
   *
   * @param point1 - First geographic coordinate
   * @param point2 - Second geographic coordinate
   * @returns Distance in meters
   */
  const calculateDistance = useCallback((point1: ICoordinates, point2: ICoordinates): number => {
    try {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (point1.lat * Math.PI) / 180;
      const φ2 = (point2.lat * Math.PI) / 180;
      const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
      const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c; // Distance in meters
      Logger.debug('LocationHook', `Distance calculated: ${distance}m`, {
        from: point1,
        to: point2,
        distance,
      });
      return distance;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to calculate distance');
      Logger.error('LocationHook', 'Failed to calculate distance', error);
      throw error;
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    searchLocations,
    reverseGeocode,
    getCurrentLocation,
    calculateDistance,
  };
};

export default useLocation;
