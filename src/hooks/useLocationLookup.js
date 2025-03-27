import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocationDetails } from '../utils/overpass';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * React hook for looking up location details from coordinates
 * @param {Object} options - Hook options
 * @param {boolean} options.autoLookup - Whether to automatically look up on coordinate change
 * @returns {Object} Location lookup state and functions
 */
export function useLocationLookup(options = {}) {
  const { autoLookup = true } = options;
  const renderStartTimeRef = useRef(Date.now());
  
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    locationData: null,
    coordinates: null
  });
  
  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', renderDuration, {
      success: true,
      action: 'initialize',
      autoLookup
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [autoLookup]);
  
  /**
   * Look up location details from coordinates
   * @param {number|Object} lat - Latitude or location object
   * @param {number} lng - Longitude (optional if lat is an object)
   * @param {number} radius - Search radius in meters (default: 50)
   */
  const lookupLocation = useCallback(async (lat, lng, radius = 50) => {
    const startTime = Date.now();
    
    // Handle case where first parameter is a location object
    let latitude = lat;
    let longitude = lng;
    
    if (typeof lat === 'object' && lat !== null) {
      // Extract coordinates from location object
      latitude = lat.lat || (lat.latlng ? lat.latlng.lat : null);
      longitude = lat.lng || lat.lon || (lat.latlng ? lat.latlng.lng : null);
    }
    
    // Skip if no coordinates provided
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: false,
        action: 'lookupLocation',
        error: 'Invalid coordinates provided',
        input: { lat, lng }
      });
      
      console.error('Invalid coordinates provided:', { lat, lng });
      setState(prev => ({
        ...prev,
        error: 'Invalid coordinates provided',
        isLoading: false
      }));
      return;
    }
    
    try {
      console.log('Looking up location at coordinates:', latitude, longitude);
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        coordinates: { lat: latitude, lng: longitude }
      }));
      
      const locationData = await getLocationDetails(latitude, longitude, radius);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: true,
        action: 'lookupLocation',
        radius,
        hasLocationData: !!locationData,
        locationType: locationData?.type,
        hasAddress: !!locationData?.fullAddress
      });
      
      console.log('Location data received:', locationData);
      
      setState(prev => ({
        ...prev,
        locationData,
        isLoading: false
      }));
      
      return locationData;
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: false,
        action: 'lookupLocation',
        error: error.message,
        radius,
        coordinates: { lat: latitude, lng: longitude }
      });
      
      console.error('Error in location lookup:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to look up location',
        isLoading: false
      }));
      
      return null;
    }
  }, []);
  
  /**
   * Use this when user selects a location on the map
   * @param {Object} location - Location object with lat/lng properties
   */
  const handleLocationSelect = useCallback((location) => {
    if (!location) return;
    
    const startTime = Date.now();
    console.log('handleLocationSelect called with:', location);
    
    // Extract coordinates from location object
    const lat = location.lat || (location.latlng ? location.latlng.lat : null);
    const lng = location.lng || location.lon || (location.latlng ? location.latlng.lng : null);
    
    if (!lat || !lng) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: false,
        action: 'handleLocationSelect',
        error: 'Invalid location object',
        input: location
      });
      
      console.error('Invalid location object:', location);
      return;
    }
    
    if (autoLookup) {
      lookupLocation(lat, lng);
    } else {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: true,
        action: 'handleLocationSelect',
        autoLookup: false,
        coordinates: { lat, lng }
      });
      
      setState(prev => ({
        ...prev,
        coordinates: { lat, lng }
      }));
    }
  }, [autoLookup, lookupLocation]);
  
  // Additional utility function to retry with a larger radius
  const retryWithLargerRadius = useCallback(() => {
    if (!state.coordinates) return;
    
    const startTime = Date.now();
    // Try with 150m radius instead of default 50m
    lookupLocation(state.coordinates.lat, state.coordinates.lng, 150);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
      success: true,
      action: 'retryWithLargerRadius',
      originalCoordinates: state.coordinates,
      newRadius: 150
    });
  }, [state.coordinates, lookupLocation]);
  
  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    locationData: state.locationData,
    coordinates: state.coordinates,
    
    // Location name and address shortcuts
    locationName: state.locationData?.name || 'Unknown location',
    fullAddress: state.locationData?.fullAddress || '',
    locationType: state.locationData?.type || '',
    
    // Success flag
    hasLocationData: state.locationData?.success === true,
    
    // Functions
    lookupLocation,
    handleLocationSelect,
    retryWithLargerRadius,
    
    // Clear current location data
    clearLocationData: () => {
      const startTime = Date.now();
      setState(prev => ({
        ...prev, 
        locationData: null,
        error: null
      }));
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useLocationLookup', duration, {
        success: true,
        action: 'clearLocationData',
        hadLocationData: !!state.locationData,
        hadError: !!state.error
      });
    }
  };
} 