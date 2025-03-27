const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';  // Alternative search API that's often faster
const MAX_RESULTS = 8;
const USER_AGENT = 'MeetNowApp/1.0';
const DEFAULT_TIMEOUT = 15000; // Increased timeout to 15 seconds
const DEFAULT_PROXIMITY_RADIUS = 50; // Default proximity radius in kilometers
const DEFAULT_PROXIMITY_FACTOR = 0.7; // How much to weight proximity vs. relevance (0-1)
const LOCATION_CACHE_DURATION = 30000; // 30 seconds - how long to cache a location

import logger from './Logger';
import { handleGeolocationError, createGeolocationError } from './error-handler';

/**
 * Enhanced location request manager with improved caching and retry logic
 */
class LocationRequestManager {
  constructor() {
    this.cachedLocation = null;
    this.lastRequestTime = 0;
    this.requestTimeout = DEFAULT_TIMEOUT;
    this.minRequestInterval = 5000; // Minimum time between requests (5 seconds)
    this.maxCacheAge = LOCATION_CACHE_DURATION;
    this.retryCount = 2;
    this.retryDelay = 2000;
    this.pendingRequest = null;
    this.requestQueue = [];
    this.isRequesting = false;
    
    // Initialize the localStorage cache if available
    this.initializeCache();
  }
  
  /**
   * Initialize the cache from localStorage if available
   */
  initializeCache() {
    try {
      const cachedData = localStorage.getItem('location_cache');
      if (cachedData) {
        const { location, timestamp } = JSON.parse(cachedData);
        // Only use cache if it's not too old
        if (location && timestamp && (Date.now() - timestamp < this.maxCacheAge)) {
          this.cachedLocation = location;
          this.lastRequestTime = timestamp;
          logger.info('Loaded location from persistent cache', { location });
        } else {
          // Clear expired cache
          localStorage.removeItem('location_cache');
        }
      }
    } catch (err) {
      logger.warn('Failed to load location from cache', err);
      // Ignore cache loading errors
    }
  }
  
  /**
   * Update the cache with a new location
   * @param {Object} location - The location to cache
   */
  updateCache(location) {
    this.cachedLocation = location;
    this.lastRequestTime = Date.now();
    
    // Also persist to localStorage if available
    try {
      localStorage.setItem('location_cache', JSON.stringify({
        location,
        timestamp: this.lastRequestTime
      }));
    } catch (err) {
      logger.warn('Failed to persist location to cache', err);
      // Ignore storage errors
    }
  }
  
  /**
   * Request user's location with caching and retry logic
   * @param {Object} options - Options for the request
   * @param {boolean} options.bypassCache - Bypass the cache and force a new request
   * @param {number} options.timeout - Custom timeout value
   * @returns {Promise<{lat: number, lng: number, display_name: string}>} User's location
   */
  async requestLocation(options = {}) {
    // Use options
    const bypassCache = options.bypassCache || false;
    const timeout = options.timeout || this.requestTimeout;
    
    // Check if we have a recent cached location and aren't bypassing cache
    const now = Date.now();
    if (!bypassCache && this.cachedLocation && (now - this.lastRequestTime < this.maxCacheAge)) {
      logger.debug('Using cached location', { location: this.cachedLocation, age: now - this.lastRequestTime });
      return this.cachedLocation;
    }
    
    // If there's already a request in progress, queue this one
    if (this.isRequesting) {
      logger.debug('Location request already in progress, queueing request');
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject });
      });
    }
    
    this.isRequesting = true;
    
    try {
      const position = await this.getCurrentPosition({ timeout });
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        display_name: 'Your Location',
        accuracy: position.coords.accuracy
      };
      
      // Update the cache
      this.updateCache(location);
      
      // Resolve any queued requests
      this.resolveQueuedRequests(location);
      
      logger.info('Location request succeeded', { location });
      return location;
    } catch (error) {
      // Reject any queued requests
      this.rejectQueuedRequests(error);
      
      logger.error('Error getting location', error);
      throw error;
    } finally {
      this.isRequesting = false;
    }
  }
  
  /**
   * Resolve all queued requests with the location
   * @param {Object} location - The location to resolve with
   */
  resolveQueuedRequests(location) {
    if (this.requestQueue.length > 0) {
      logger.debug(`Resolving ${this.requestQueue.length} queued location requests`);
      for (const request of this.requestQueue) {
        request.resolve(location);
      }
      this.requestQueue = [];
    }
  }
  
  /**
   * Reject all queued requests with the error
   * @param {Error} error - The error to reject with
   */
  rejectQueuedRequests(error) {
    if (this.requestQueue.length > 0) {
      logger.debug(`Rejecting ${this.requestQueue.length} queued location requests with error`);
      for (const request of this.requestQueue) {
        request.reject(error);
      }
      this.requestQueue = [];
    }
  }
  
  /**
   * Get current position with enhanced timeout and retry logic
   * @param {Object} options - Options for the position request
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {boolean} options.enableHighAccuracy - Enable high accuracy
   * @param {number} options.maximumAge - Maximum age of cached position
   * @param {number} options.retryCount - Number of retries
   * @param {number} options.retryDelay - Delay between retries in ms
   * @returns {Promise<GeolocationPosition>} Geolocation position
   */
  async getCurrentPosition(options = {}) {
    const positionOptions = {
      enableHighAccuracy: options.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
      timeout: options.timeout || this.requestTimeout,
      maximumAge: options.maximumAge || 0
    };
    
    const retryCount = options.retryCount !== undefined ? options.retryCount : this.retryCount;
    const retryDelay = options.retryDelay || this.retryDelay;
    
    // Track retry attempts
    let attempts = 0;
    
    const attemptGetPosition = async () => {
      return new Promise((resolve, reject) => {
        // Create an explicit timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, positionOptions.timeout);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          positionOptions
        );
      });
    };
    
    // Try with retries
    while (true) {
      try {
        return await attemptGetPosition();
      } catch (error) {
        attempts++;
        
        // Check if we've exhausted our retries
        if (attempts > retryCount) {
          // No more retries, handle the error properly
          let errorMessage = 'Unable to retrieve your location';
          if (error.code) {
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = 'Location permission denied';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location information unavailable';
                break;
              case 3: // TIMEOUT
                errorMessage = 'Location request timed out';
                break;
              default:
                errorMessage = 'An unknown error occurred';
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Use error handler utility
          const geoError = createGeolocationError(errorMessage);
          handleGeolocationError(geoError, { originalError: error });
          
          throw geoError;
        }
        
        // Log the error and retry
        logger.warn(`Location request attempt ${attempts} failed, retrying in ${retryDelay}ms`, error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  /**
   * Clear cached location data
   */
  clearCache() {
    this.cachedLocation = null;
    this.lastRequestTime = 0;
    
    // Also clear from localStorage
    try {
      localStorage.removeItem('location_cache');
    } catch (err) {
      // Ignore storage errors
    }
    
    logger.debug('Location cache cleared');
  }
}

export const locationRequestManager = new LocationRequestManager();

/**
 * Search for locations by query or coordinates
 * @param {string} query - Location search query
 * @param {Object} options - Search options
 * @param {number} options.lat - Latitude for context bias
 * @param {number} options.lng - Longitude for context bias
 * @param {number} options.limit - Maximum number of results to return
 * @param {Object} options.userLocation - User's current location for proximity ranking
 * @param {number} options.proximityRadius - Radius to search within (km)
 * @param {number} options.proximityFactor - Weight for proximity vs relevance (0-1, default: 0.7)
 * @returns {Promise<Array>} - Array of location results
 */
export async function searchLocations(query, options = {}) {
  try {
    // Extract options
    const { 
      lat, 
      lng, 
      limit = MAX_RESULTS,
      userLocation = null,
      proximityRadius = DEFAULT_PROXIMITY_RADIUS,
      proximityFactor = DEFAULT_PROXIMITY_FACTOR
    } = options;
    
    // Use user's location as context if available and no specific context provided
    const contextLat = lat !== undefined ? lat : (userLocation ? userLocation.lat : undefined);
    const contextLng = lng !== undefined ? lng : (userLocation ? userLocation.lng : undefined);
    
    // Enhanced options with context
    const enhancedOptions = {
      lat: contextLat,
      lng: contextLng,
      limit,
      userLocation: userLocation || (contextLat !== undefined && contextLng !== undefined ? { lat: contextLat, lng: contextLng } : null),
      proximityRadius,
      proximityFactor
    };
    
    // Handle both forward and reverse geocoding
    if (query) {
      // Try with Photon first (faster, no rate limits)
      try {
        const results = await searchWithPhoton(query, enhancedOptions);
        if (results && results.length > 0) {
          console.log('Photon search successful with results:', results.length);
          return results;
        }
      } catch (photonError) {
        console.warn('Photon search failed, falling back to Nominatim:', photonError);
        // Continue to Nominatim
      }
      
      // Forward geocoding with Nominatim as fallback
      return await forwardGeocode(query, enhancedOptions);
    } else if (contextLat !== undefined && contextLng !== undefined) {
      // Reverse geocoding (search by coordinates)
      const results = await reverseGeocode(contextLat, contextLng);
      // Ensure we always return an array, even if results is null or empty
      return Array.isArray(results) ? results : [];
    } else {
      throw new Error('Either query or coordinates are required');
    }
  } catch (error) {
    console.error('Error in searchLocations:', error);
    // Return empty array instead of throwing to prevent UI disruption
    return [];
  }
}

/**
 * Search using Photon API (based on OpenStreetMap data but faster)
 */
async function searchWithPhoton(query, options = {}) {
  const { 
    lat, 
    lng, 
    limit = MAX_RESULTS,
    userLocation,
    proximityFactor
  } = options;
  
  const cleanQuery = prepareSearchQuery(query);
  
  if (!cleanQuery) return [];
  
  // Build URL
  let url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
  
  // Add location bias if available
  if (lat !== undefined && lng !== undefined) {
    url += `&lat=${lat}&lon=${lng}`;
  }
  
  // Set a controller to be able to abort if needed
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform Photon results to match our expected format
    if (data && data.features) {
      let results = data.features.map(feature => {
        const props = feature.properties;
        const coordinates = feature.geometry.coordinates;
        const resultLat = parseFloat(coordinates[1]);
        const resultLng = parseFloat(coordinates[0]);
        
        // Calculate distance to user location if available
        let distance = null;
        if (userLocation) {
          distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            resultLat, 
            resultLng
          );
        }
        
        return {
          place_id: props.osm_id || Math.random().toString(36).substring(2),
          display_name: formatPhotonAddress(props),
          lat: resultLat,
          lng: resultLng,
          lon: resultLng,
          type: props.osm_key || 'place',
          importance: 0.5, // Photon doesn't provide this
          distance,
          address: {
            road: props.street,
            house_number: props.housenumber,
            city: props.city,
            town: props.town,
            village: props.village,
            state: props.state,
            country: props.country,
            postcode: props.postcode
          }
        };
      });
      
      // Apply proximity-based ranking
      if (userLocation && proximityFactor > 0) {
        results = rankByProximity(results, userLocation, proximityFactor);
      }
      
      return results;
    }
    
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Rethrow to try Nominatim
    if (error.name === 'AbortError') {
      throw new Error('Photon search timed out');
    }
    throw error;
  }
}

/**
 * Format Photon address
 */
function formatPhotonAddress(props) {
  const parts = [];
  
  // POI name or house number and street
  if (props.name) {
    parts.push(props.name);
  } else if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`);
  } else if (props.street) {
    parts.push(props.street);
  }
  
  // City/town/village
  const city = props.city || props.town || props.village || '';
  if (city) {
    parts.push(city);
  }
  
  // State/country
  if (props.state) {
    parts.push(props.state);
  }
  
  if (props.country) {
    parts.push(props.country);
  }
  
  return parts.join(', ');
}

/**
 * Prepare search query by trimming, normalizing spaces and removing special characters
 */
function prepareSearchQuery(query) {
  if (!query) return '';
  
  // Normalize the query: trim whitespace, remove extra spaces, make lowercase
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Forward geocoding - search for places by name or address
 */
async function forwardGeocode(query, options = {}) {
  const { 
    lat, 
    lng, 
    limit = MAX_RESULTS,
    userLocation,
    proximityRadius,
    proximityFactor
  } = options;
  
  const cleanQuery = prepareSearchQuery(query);
  
  if (!cleanQuery) return [];
  
  // Construct URL with search parameters
  const params = new URLSearchParams({
    q: cleanQuery,
    format: 'json',
    addressdetails: 1,
    limit,
    dedupe: 1
  });
  
  // Add viewport if we have context coordinates to bias search results
  if (lat !== undefined && lng !== undefined) {
    // Create a bounding box around the current location (adjustable radius)
    // 0.01 is roughly 1km at the equator
    const boxSizeDegrees = (proximityRadius || DEFAULT_PROXIMITY_RADIUS) * 0.01;
    params.append('viewbox', `${lng-boxSizeDegrees},${lat-boxSizeDegrees},${lng+boxSizeDegrees},${lat+boxSizeDegrees}`);
    params.append('bounded', '0'); // Don't restrict results to only this box
  }
  
  const url = `${NOMINATIM_ENDPOINT}/search?${params.toString()}`;
  
  // Set a controller to be able to abort if needed
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  try {
    // Fetch with proper headers for Nominatim policy compliance
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);
    }
    
    const results = await response.json();
    
    // Process and rank the results with enhanced proximity ranking
    return rankSearchResults(
      results, 
      userLocation ? userLocation.lat : lat,
      userLocation ? userLocation.lng : lng,
      proximityFactor
    );
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.warn('Nominatim search timed out');
      // Return empty results instead of throwing
      return [];
    }
    
    throw error;
  }
}

/**
 * Reverse geocoding - get address from coordinates
 */
export async function reverseGeocode(lat, lng) {
  // Input validation
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates');
  }
  
  const params = new URLSearchParams({
    lat,
    lon: lng,
    format: 'json',
    addressdetails: 1,
    zoom: 18 // Building level zoom
  });
  
  const url = `${NOMINATIM_ENDPOINT}/reverse?${params.toString()}`;
  
  // Set a controller to be able to abort if needed
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  try {
    // Ensure we follow Nominatim usage policy
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // If successful, wrap the single result in an array for consistent return type
    if (result && result.address) {
      // Add lat/lng properties for consistency with search results
      result.lat = parseFloat(lat);
      result.lng = parseFloat(lng);
      result.lon = parseFloat(lng); // Add lon property for compatibility
      
      // Add formatted address
      result.display_name = formatAddress(result);
      
      return [result]; // Return as array for consistency with searchLocations
    }
    
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.warn('Reverse geocoding timed out');
      // Return empty results instead of throwing
      return [];
    }
    
    throw error;
  }
}

/**
 * Rank search results based on relevance and proximity
 * Considers importance score, type of place, and proximity to user's location
 * 
 * @param {Array} results - Search results to rank
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} proximityFactor - Weight for proximity vs relevance (0-1)
 * @returns {Array} - Ranked results
 */
function rankSearchResults(results, userLat, userLng, proximityFactor = DEFAULT_PROXIMITY_FACTOR) {
  if (!results || results.length === 0) return [];
  
  // First normalize and enhance results
  const enhancedResults = results.map(result => {
    // Convert string coordinates to numbers
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Determine what type of place this is
    const placeType = getPlaceType(result);
    
    // Calculate distance to user if coordinates provided
    let distance = null;
    if (userLat !== undefined && userLng !== undefined) {
      distance = calculateDistance(userLat, userLng, lat, lng);
    }
    
    // Format important name parts
    const formattedName = formatPOI(result);
    
    return {
      ...result,
      lat,
      lng,
      type: placeType,
      distance,
      formattedName
    };
  });
  
  // If we have user location and proximity factor is set, use enhanced ranking
  if (userLat !== undefined && userLng !== undefined && proximityFactor > 0) {
    return rankByProximity(enhancedResults, { lat: userLat, lng: userLng }, proximityFactor);
  }
  
  // Otherwise use standard ranking
  return enhancedResults.sort((a, b) => {
    // First by importance (if available)
    const importanceDiff = (b.importance || 0) - (a.importance || 0);
    if (Math.abs(importanceDiff) > 0.2) return importanceDiff;
    
    // Then by POI vs general places
    const aIsPOI = a.type && !['administrative', 'boundary', 'country', 'state'].includes(a.type);
    const bIsPOI = b.type && !['administrative', 'boundary', 'country', 'state'].includes(b.type);
    if (aIsPOI && !bIsPOI) return -1;
    if (!aIsPOI && bIsPOI) return 1;
    
    // Then by distance if we have it
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    
    return 0;
  });
}

/**
 * Rank results by a weighted combination of relevance and proximity
 * 
 * @param {Array} results - Search results to rank
 * @param {Object} userLocation - User's location {lat, lng}
 * @param {number} proximityFactor - Weight for proximity vs relevance (0-1)
 * @returns {Array} - Ranked results
 */
function rankByProximity(results, userLocation, proximityFactor = DEFAULT_PROXIMITY_FACTOR) {
  if (!results || results.length === 0 || !userLocation) return results;
  
  // Calculate a combined score for each result
  const scoredResults = results.map(result => {
    // Calculate distance if not already calculated
    let distance = result.distance;
    if (distance === null || distance === undefined) {
      distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        result.lat, 
        result.lng
      );
    }
    
    // Get base relevance score (0-1)
    const relevanceScore = result.importance || 0.5;
    
    // Get POI score (0-1): POIs get 1, admin boundaries get 0
    const poiTypes = ['amenity', 'shop', 'tourism', 'building', 'leisure'];
    const isPOI = poiTypes.includes(result.type) || 
                 (result.class && poiTypes.includes(result.class));
    const poiScore = isPOI ? 1 : 0;
    
    // Calculate proximity score (0-1)
    // Closer = higher score, with exponential falloff
    const proximityScore = Math.max(0, 1 - (distance / 100));
    
    // Combined score:
    // proximityFactor determines weight given to location vs. relevance
    const combinedScore = 
      (proximityScore * proximityFactor) + 
      (relevanceScore * (1 - proximityFactor) * 0.7) +
      (poiScore * (1 - proximityFactor) * 0.3);
    
    return {
      ...result,
      distance,
      _relevanceScore: relevanceScore,
      _proximityScore: proximityScore,
      _poiScore: poiScore,
      _combinedScore: combinedScore
    };
  });
  
  // Sort by combined score (higher is better)
  return scoredResults.sort((a, b) => b._combinedScore - a._combinedScore);
}

/**
 * Format address for display
 */
function formatAddress(result) {
  // If we already have a display_name, use it
  if (result.display_name) {
    return result.display_name;
  }
  
  const addr = result.address || {};
  const parts = [];
  
  // Building or POI name
  if (addr.amenity || addr.tourism || addr.shop || addr.building) {
    parts.push(addr.amenity || addr.tourism || addr.shop || addr.building);
  }
  
  // Street address
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`);
  } else if (addr.road) {
    parts.push(addr.road);
  }
  
  // Neighborhood/suburb
  if (addr.neighbourhood) {
    parts.push(addr.neighbourhood);
  } else if (addr.suburb) {
    parts.push(addr.suburb);
  }
  
  // City/town
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village);
  }
  
  // State/province
  if (addr.state || addr.province) {
    parts.push(addr.state || addr.province);
  }
  
  // Country
  if (addr.country) {
    parts.push(addr.country);
  }
  
  return parts.join(', ');
}

/**
 * Format point of interest name for better readability
 */
function formatPOI(result) {
  if (!result.address) return result.display_name;
  
  const addr = result.address;
  
  // Try to extract the most specific name
  if (addr.amenity) return addr.amenity;
  if (addr.shop) return addr.shop;
  if (addr.tourism) return addr.tourism;
  if (addr.building && addr.building !== 'yes') return addr.building;
  
  // If no specific POI type, use the first part of display name
  return result.display_name.split(',')[0];
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert from degrees to radians
  const toRad = x => x * Math.PI / 180;
  
  // Haversine formula
  const R = 6371; // radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Determine the type of place from Nominatim result
 */
function getPlaceType(result) {
  // Check for specific type tags
  if (result.class === 'amenity') return result.type;
  if (result.class === 'shop') return 'shop';
  if (result.class === 'tourism') return result.type;
  if (result.class === 'building') return 'building';
  
  // Check address components
  const addr = result.address || {};
  if (addr.amenity) return addr.amenity;
  if (addr.shop) return 'shop';
  if (addr.tourism) return addr.tourism;
  
  // Return general place category
  return result.class || 'place';
} 