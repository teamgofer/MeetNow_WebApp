/**
 * Location Utilities for Proximity Chat
 * 
 * Provides common functions for calculating distances, formatting locations,
 * and handling geospatial data in the proximity chat feature.
 */

/**
 * Earth's radius in meters
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Converts degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculates the distance between two points using the Haversine formula
 * 
 * @param {Object} point1 - First point {latitude, longitude}
 * @param {Object} point2 - Second point {latitude, longitude}
 * @returns {number} Distance in meters
 */
export const calculateDistance = (point1, point2) => {
  if (!point1 || !point2) return null;
  if (!point1.latitude || !point1.longitude || !point2.latitude || !point2.longitude) return null;

  const lat1 = degreesToRadians(point1.latitude);
  const lon1 = degreesToRadians(point1.longitude);
  const lat2 = degreesToRadians(point2.latitude);
  const lon2 = degreesToRadians(point2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

/**
 * Formats a distance in a human-readable way
 * 
 * @param {number} meters - Distance in meters
 * @param {Object} options - Formatting options
 * @param {boolean} options.abbreviated - Whether to use abbreviated units
 * @param {number} options.precision - Number of decimal places to show
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters, options = {}) => {
  const { abbreviated = false, precision = 1 } = options;
  
  if (meters === null || meters === undefined || isNaN(meters)) {
    return 'Unknown distance';
  }
  
  // Less than 1 meter
  if (meters < 1) {
    return 'Here';
  }
  
  // Less than 1000 meters (1 km)
  if (meters < 1000) {
    const roundedMeters = Math.round(meters);
    return abbreviated 
      ? `${roundedMeters}m` 
      : `${roundedMeters} ${roundedMeters === 1 ? 'meter' : 'meters'}`;
  }
  
  // 1 km to 10 km - show decimal places
  if (meters < 10000) {
    const km = (meters / 1000).toFixed(precision);
    return abbreviated 
      ? `${km}km` 
      : `${km} ${km === '1.0' ? 'kilometer' : 'kilometers'}`;
  }
  
  // More than 10 km - round to whole numbers
  const km = Math.round(meters / 1000);
  return abbreviated 
    ? `${km}km` 
    : `${km} ${km === 1 ? 'kilometer' : 'kilometers'}`;
};

/**
 * Formats coordinates in a user-friendly way
 * 
 * @param {Object} location - Location {latitude, longitude}
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (location, decimals = 5) => {
  if (!location || !location.latitude || !location.longitude) return 'Unknown location';
  
  const lat = location.latitude.toFixed(decimals);
  const lon = location.longitude.toFixed(decimals);
  
  return `${lat}, ${lon}`;
};

/**
 * Checks if a location is within a certain radius of another location
 * 
 * @param {Object} point1 - First point {latitude, longitude}
 * @param {Object} point2 - Second point {latitude, longitude}
 * @param {number} radiusMeters - Radius in meters
 * @returns {boolean} Whether the points are within the radius
 */
export const isWithinRadius = (point1, point2, radiusMeters) => {
  const distance = calculateDistance(point1, point2);
  return distance !== null && distance <= radiusMeters;
};

/**
 * Returns a relative direction between two points (N, NE, E, etc.)
 * 
 * @param {Object} from - Starting point {latitude, longitude}
 * @param {Object} to - Ending point {latitude, longitude}
 * @returns {string} Cardinal direction
 */
export const getRelativeDirection = (from, to) => {
  if (!from || !to) return '';
  
  const dLat = to.latitude - from.latitude;
  const dLon = to.longitude - from.longitude;
  
  // Calculate angle in degrees
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  
  // Convert angle to 0-360 range
  const normalizedAngle = (angle + 360) % 360;
  
  // Map angle to cardinal direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalizedAngle / 45) % 8;
  
  return directions[index];
};

/**
 * Processes location data for display
 * 
 * @param {Object} location - Location {latitude, longitude}
 * @param {Object} currentLocation - Current user location
 * @returns {Object} Processed location data with added properties
 */
export const processLocationForDisplay = (location, currentLocation) => {
  if (!location) return null;
  
  const distance = calculateDistance(location, currentLocation);
  const direction = getRelativeDirection(currentLocation, location);
  
  return {
    ...location,
    distanceMeters: distance,
    formattedDistance: formatDistance(distance),
    direction,
    formattedCoordinates: formatCoordinates(location),
  };
};

/**
 * Gets the user's current location using the Geolocation API
 * 
 * @param {Object} options - Options for the geolocation request
 * @param {boolean} options.highAccuracy - Whether to prioritize accuracy over power consumption
 * @param {number} options.timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Promise resolving to {latitude, longitude} object
 */
export const getCurrentLocation = (options = {}) => {
  const { highAccuracy = true, timeout = 10000 } = options;
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage;
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            break;
          case error.UNKNOWN_ERROR:
            errorMessage = 'An unknown error occurred';
            break;
          default:
            errorMessage = 'Failed to get location';
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeout,
        maximumAge: 0
      }
    );
  });
};

/**
 * Starts watching the user's location with regular updates
 * 
 * @param {Function} onLocationUpdate - Callback for location updates
 * @param {Function} onError - Callback for errors
 * @param {Object} options - Options for location watching
 * @returns {number} Watch ID that can be used to stop watching
 */
export const watchLocation = (onLocationUpdate, onError, options = {}) => {
  const { highAccuracy = true, interval = 5000 } = options;
  
  if (!navigator.geolocation) {
    if (onError) {
      onError(new Error('Geolocation is not supported by this browser'));
    }
    return null;
  }
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    },
    (error) => {
      let errorMessage;
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'User denied the request for geolocation';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out';
          break;
        case error.UNKNOWN_ERROR:
          errorMessage = 'An unknown error occurred';
          break;
        default:
          errorMessage = 'Failed to get location';
      }
      
      if (onError) {
        onError(new Error(errorMessage));
      }
    },
    {
      enableHighAccuracy: highAccuracy,
      timeout: interval,
      maximumAge: 0
    }
  );
  
  return watchId;
};

/**
 * Stops watching the user's location
 * 
 * @param {number} watchId - Watch ID returned by watchLocation
 */
export const clearLocationWatch = (watchId) => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Filters a list of users by their distance from a central location
 * 
 * @param {Array} users - Array of user objects with location properties
 * @param {Object} centerLocation - Central location to measure from
 * @param {number} radiusMeters - Maximum radius in meters
 * @returns {Array} Filtered list of users within the radius
 */
export const filterUsersByDistance = (users, centerLocation, radiusMeters) => {
  if (!users || !Array.isArray(users) || !centerLocation) {
    return [];
  }
  
  return users.filter(user => {
    if (!user.location) return false;
    
    const distance = calculateDistance(centerLocation, user.location);
    return distance !== null && distance <= radiusMeters;
  });
};

/**
 * Check if a location is valid with proper latitude and longitude
 * 
 * @param {Object} location - Location object to validate
 * @returns {boolean} True if valid location, false otherwise
 */
export const isValidLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return false;
  }

  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return false;
  }

  // Check latitude range: -90 to 90
  if (location.latitude < -90 || location.latitude > 90) {
    return false;
  }

  // Check longitude range: -180 to 180
  if (location.longitude < -180 || location.longitude > 180) {
    return false;
  }

  return true;
};

/**
 * Format a location object to a string representation
 * 
 * @param {Object} location - Location to format
 * @param {number} [precision=4] - Decimal precision to use
 * @returns {string} Formatted location string "latitude,longitude"
 */
export const formatLocation = (location, precision = 4) => {
  if (!isValidLocation(location)) {
    return '';
  }

  return `${location.latitude.toFixed(precision)},${location.longitude.toFixed(precision)}`;
};

/**
 * Parse a location string into a location object
 * 
 * @param {string} locationStr - Location string in format "latitude,longitude"
 * @returns {Object|null} Location object with latitude and longitude or null if invalid
 */
export const parseLocation = (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') {
    return null;
  }

  const parts = locationStr.trim().split(',');
  if (parts.length !== 2) {
    return null;
  }

  const latitude = parseFloat(parts[0]);
  const longitude = parseFloat(parts[1]);

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const location = { latitude, longitude };
  return isValidLocation(location) ? location : null;
};

/**
 * Find the closest region to a user's location within a maximum radius
 * 
 * @param {Object} userLocation - User's current location
 * @param {Array} regions - Array of region objects with locations
 * @param {number} [maxRadiusKm=Infinity] - Maximum radius to consider a region, in km
 * @returns {Object|null} The closest region or null if none found
 */
export const getUserRegion = (userLocation, regions, maxRadiusKm = Infinity) => {
  if (!isValidLocation(userLocation) || !regions || !Array.isArray(regions) || regions.length === 0) {
    return null;
  }

  let closestRegion = null;
  let closestDistance = Infinity;

  for (const region of regions) {
    if (!region.location || !isValidLocation(region.location)) {
      continue;
    }

    const distance = calculateDistance(userLocation, region.location);
    if (distance !== null && distance <= maxRadiusKm * 1000 && distance < closestDistance) {
      closestRegion = region;
      closestDistance = distance;
    }
  }

  return closestRegion;
}; 