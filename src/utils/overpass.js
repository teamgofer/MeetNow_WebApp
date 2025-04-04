/**
 * Overpass API integration for MeetNow
 * Provides location data from OpenStreetMap without rate limits
 */

import { CacheService } from './CacheService.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';

// Cache configuration
const CACHE_CONFIG = {
  locationDetails: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'location_details',
  },
  addressLookup: {
    ttl: 12 * 60 * 60 * 1000, // 12 hours
    keyPrefix: 'address_lookup',
  },
};

/**
 * Get location details from Overpass API with radius search
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters (default: 50m)
 * @returns {Promise<Object>} Location details
 */
export async function getLocationDetails(lat, lng, radius = 50) {
  const startTime = Date.now();
  try {
    // Validate coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      return {
        name: 'Unknown location',
        fullAddress: 'Invalid coordinates',
        success: false,
      };
    }

    // Round coordinates for cache key
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = `${CACHE_CONFIG.locationDetails.keyPrefix}:${roundedLat},${roundedLng},${radius}`;

    // Check cache first
    const cachedData = CacheService.get(cacheKey);
    if (cachedData) {
      console.log('Using cached location data');
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('overpass', 'getLocationDetails', duration, {
        source: 'cache',
        lat,
        lng,
        radius,
      });
      return cachedData;
    }

    // Create Overpass query
    const overpassQuery = `
      [out:json];
      (
        node(around:${radius},${lat},${lng})["name"];
        way(around:${radius},${lat},${lng})["name"];
        relation(around:${radius},${lat},${lng})["name"];
      );
      out center body;
      >;
      out skel qt;
    `;

    // Fetch from API
    const apiStartTime = Date.now();
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const apiDuration = Date.now() - apiStartTime;

    // Track API performance
    PerformanceMonitor.trackApiCall('overpass', 'getLocationDetails', apiDuration, true, {
      lat,
      lng,
      radius,
    });

    const locationDetails = processOverpassResponse(data);

    // Cache the result
    CacheService.set(cacheKey, locationDetails, CACHE_CONFIG.locationDetails.ttl);

    // Track total operation duration
    const totalDuration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('overpass', 'getLocationDetails', totalDuration, {
      source: 'api',
      lat,
      lng,
      radius,
    });

    return locationDetails;
  } catch (error) {
    // Track error
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackError('overpass', 'getLocationDetails', error, {
      lat,
      lng,
      radius,
    });
    PerformanceMonitor.trackOperationTiming('overpass', 'getLocationDetails', duration, {
      source: 'error',
      lat,
      lng,
      radius,
    });

    console.error('Error fetching location details:', error);
    return {
      name: 'Unknown location',
      fullAddress: 'Error fetching location details',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Look up address from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export async function lookupAddress(lat, lng) {
  const startTime = Date.now();
  try {
    // Round coordinates for cache key
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = `${CACHE_CONFIG.addressLookup.keyPrefix}:${roundedLat},${roundedLng}`;

    // Check cache first
    const cachedAddress = CacheService.get(cacheKey);
    if (cachedAddress) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('nominatim', 'lookupAddress', duration, {
        source: 'cache',
        lat,
        lng,
      });
      return cachedAddress;
    }

    // Fetch from API
    const apiStartTime = Date.now();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();
    const apiDuration = Date.now() - apiStartTime;

    // Track API performance
    PerformanceMonitor.trackApiCall('nominatim', 'lookupAddress', apiDuration, true, {
      lat,
      lng,
    });

    const address = formatAddress(data);

    // Cache the result
    CacheService.set(cacheKey, address, CACHE_CONFIG.addressLookup.ttl);

    // Track total operation duration
    const totalDuration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('nominatim', 'lookupAddress', totalDuration, {
      source: 'api',
      lat,
      lng,
    });

    return address;
  } catch (error) {
    // Track error
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackError('nominatim', 'lookupAddress', error, {
      lat,
      lng,
    });
    PerformanceMonitor.trackOperationTiming('nominatim', 'lookupAddress', duration, {
      source: 'error',
      lat,
      lng,
    });

    console.error('Error looking up address:', error);
    return 'Address lookup failed';
  }
}

/**
 * Process Overpass API response
 * @private
 * @param {Object} data - Raw API response
 * @returns {Object} Processed location details
 */
function processOverpassResponse(data) {
  // Handle empty results
  if (!data.elements || data.elements.length === 0) {
    return {
      name: 'Unnamed location',
      fullAddress: `Location at ${data.elements[0].lat.toFixed(6)}, ${data.elements[0].lon.toFixed(6)}`,
      coordinates: { lat: data.elements[0].lat, lng: data.elements[0].lon },
      success: false,
    };
  }

  // Extract all places with names
  const places = data.elements
    .filter(element => element.tags?.name)
    .map(element => {
      // Get coordinates - different format for different element types
      const lat = element.lat || element.center?.lat || null;
      const lng = element.lon || element.center?.lon || null;

      // Skip elements without coordinates
      if (!lat || !lng) return null;

      // Calculate distance from original point
      const distance = calculateDistance(data.elements[0].lat, data.elements[0].lon, lat, lng);

      // Gather address components
      const address = buildAddressFromTags(element.tags);

      return {
        id: element.id,
        name: element.tags.name,
        type: determineLocationType(element),
        address,
        fullAddress: address.full || element.tags.name,
        coordinates: { lat, lng },
        distance,
        tags: element.tags,
        elementType: element.type, // node, way, or relation
      };
    })
    .filter(place => place !== null); // Remove null entries

  // No valid places found
  if (places.length === 0) {
    return {
      name: 'Unnamed area',
      fullAddress: `Location at ${data.elements[0].lat.toFixed(6)}, ${data.elements[0].lon.toFixed(6)}`,
      coordinates: { lat: data.elements[0].lat, lng: data.elements[0].lon },
      success: false,
    };
  }

  // Sort by distance to get the closest named place
  places.sort((a, b) => a.distance - b.distance);
  const closestPlace = places[0];

  // Return formatted result
  return {
    name: closestPlace.name,
    type: closestPlace.type,
    fullAddress: closestPlace.fullAddress,
    address: closestPlace.address,
    coordinates: closestPlace.coordinates,
    alternativePlaces: places.slice(1, 4), // Include a few alternatives
    success: true,
  };
}

/**
 * Format address from Nominatim response
 * @private
 * @param {Object} data - Nominatim API response
 * @returns {string} Formatted address
 */
function formatAddress(data) {
  // ... existing implementation ...
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula for spherical Earth distance
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Determine the type of location based on OSM tags
 */
function determineLocationType(element) {
  const tags = element.tags || {};

  // Check for most common types
  if (tags.amenity) return tags.amenity;
  if (tags.shop) return `shop (${tags.shop})`;
  if (tags.tourism) return tags.tourism;
  if (tags.leisure) return tags.leisure;
  if (tags.building) return tags.building;
  if (tags.highway) return tags.highway;
  if (tags.natural) return tags.natural;
  if (tags.landuse) return tags.landuse;
  if (tags.place) return tags.place;

  // Fallback to element type
  return element.type;
}

/**
 * Build address object from OSM tags
 */
function buildAddressFromTags(tags) {
  // First check if there's already a formatted address
  if (tags['addr:full']) {
    return { full: tags['addr:full'] };
  }

  // Build address from components
  const components = {
    housenumber: tags['addr:housenumber'],
    street: tags['addr:street'],
    city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    state: tags['addr:state'],
    postcode: tags['addr:postcode'],
    country: tags['addr:country'],
  };

  // Build street address
  let streetAddress = '';
  if (components.housenumber && components.street) {
    streetAddress = `${components.housenumber} ${components.street}`;
  } else if (components.street) {
    streetAddress = components.street;
  }

  // Build city/state/zip
  let cityStateZip = '';
  if (components.city) {
    cityStateZip = components.city;
    if (components.state) {
      cityStateZip += `, ${components.state}`;
    }
    if (components.postcode) {
      cityStateZip += ` ${components.postcode}`;
    }
  } else if (components.state) {
    cityStateZip = components.state;
    if (components.postcode) {
      cityStateZip += ` ${components.postcode}`;
    }
  } else if (components.postcode) {
    cityStateZip = components.postcode;
  }

  // Build full address
  let fullAddress = '';
  if (streetAddress) {
    fullAddress = streetAddress;
    if (cityStateZip) {
      fullAddress += `, ${cityStateZip}`;
    }
    if (components.country && !cityStateZip.includes(components.country)) {
      fullAddress += `, ${components.country}`;
    }
  } else if (cityStateZip) {
    fullAddress = cityStateZip;
    if (components.country && !cityStateZip.includes(components.country)) {
      fullAddress += `, ${components.country}`;
    }
  } else if (components.country) {
    fullAddress = components.country;
  }

  // If we couldn't build a structured address, try with OSM tags
  if (!fullAddress) {
    // Check various OSM tags that might contain address-like information
    const possibleAddressTags = [
      'name',
      'addr:full',
      'description',
      'official_name',
      'alt_name',
      'loc_name',
      'inscription',
    ];

    for (const tag of possibleAddressTags) {
      if (tags[tag]) {
        fullAddress = tags[tag];
        break;
      }
    }
  }

  // If we still have no address, use all available address components as a object
  // The keys here match the error message: {retail, suburb, city, county, state, ISO3166-2-lvl4, country, country_code}
  const addressComponents = {};

  // Extract address components from tags
  for (const [key, value] of Object.entries(tags)) {
    // Skip non-address tags
    if (
      key.startsWith('name:') ||
      key === 'name' ||
      key === 'source' ||
      key === 'website' ||
      key === 'phone' ||
      key.includes('wikidata')
    ) {
      continue;
    }

    // Add address component to our object
    addressComponents[key] = value;
  }

  // If we have address components but no full address, create a string from them
  if (Object.keys(addressComponents).length > 0 && !fullAddress) {
    // Create a basic comma-separated string of values
    const addressParts = [];

    // Include the most important address components first
    ['retail', 'suburb', 'city', 'county', 'state', 'country'].forEach(key => {
      if (addressComponents[key]) {
        addressParts.push(addressComponents[key]);
      }
    });

    // If we have parts, join them, otherwise use a generic string
    if (addressParts.length > 0) {
      fullAddress = addressParts.join(', ');
    } else {
      // As a last resort, make a string from all remaining components
      fullAddress = Object.values(addressComponents).slice(0, 3).join(', ');
    }
  }

  // Ensure we always return a string, not an object
  if (typeof fullAddress !== 'string') {
    // If it's an object, convert it to a string representation
    fullAddress =
      Object.entries(addressComponents)
        .map(([key, value]) => `${value}`)
        .filter(Boolean)
        .join(', ') || 'Unknown address';
  }

  return {
    housenumber: components.housenumber,
    street: components.street,
    city: components.city,
    state: components.state,
    postcode: components.postcode,
    country: components.country,
    full: fullAddress || 'No address available', // Ensure we always have a string
    // Return the raw components for use if needed
    raw: addressComponents,
  };
}
