import { useCallback, useState } from 'react';
import logger from '../utils/Logger';

/**
 * Custom hook for location-related functionality
 * Provides methods for searching locations and reverse geocoding
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Search for locations by query string
   * 
   * @param {string} query - The search query
   * @param {Object} options - Optional search parameters
   * @returns {Promise<Array>} - Array of location results
   */
  const searchLocations = useCallback(async (query, options = {}) => {
    if (!query) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare search parameters
      const params = new URLSearchParams({
        q: query,
        ...options
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
      setError(err.message || 'Failed to search locations');
      console.error('Error searching locations:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Reverse geocode coordinates to get address information
   * 
   * @param {Object} coordinates - The coordinates to reverse geocode
   * @param {number} coordinates.lat - Latitude
   * @param {number} coordinates.lng - Longitude
   * @returns {Promise<Array>} - Array of location results (usually just one)
   */
  const reverseGeocode = useCallback(async (coordinates) => {
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare reverse geocode parameters
      const params = new URLSearchParams({
        lat: coordinates.lat,
        lng: coordinates.lng
      });
      
      // Make API request
      const response = await fetch(
        `/api/reverse-geocode?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }
      
      const results = await response.json();
      
      // Process and return results
      return Array.isArray(results) ? results : [];
    } catch (err) {
      setError(err.message || 'Failed to get address information');
      console.error('Error reverse geocoding:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get the user's current location
   * 
   * @param {Object} options - Geolocation options
   * @returns {Promise<Object>} - The user's location
   */
  const getCurrentLocation = useCallback(async (options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }
      
      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options
          }
        );
      });
      
      // Format the result
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      
      // Try to reverse geocode to get address
      try {
        const geocodeResults = await reverseGeocode(location);
        if (geocodeResults && geocodeResults.length > 0) {
          return {
            ...location,
            ...geocodeResults[0]
          };
        }
      } catch (geocodeErr) {
        console.warn('Failed to reverse geocode location:', geocodeErr);
        // Continue with just coordinates
      }
      
      return location;
    } catch (err) {
      setError(err.message || 'Failed to get current location');
      console.error('Error getting current location:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [reverseGeocode]);

  const calculateDistance = useCallback((point1, point2) => {
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
      logger.debug('Distance calculated', { point1, point2, distance });
      return distance;
    } catch (err) {
      logger.error('Failed to calculate distance', err);
      throw err;
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    searchLocations,
    reverseGeocode,
    getCurrentLocation,
    calculateDistance
  };
};

export default useLocation; 
 
 
 
 
 