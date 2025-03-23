const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';  // Alternative search API that's often faster
const MAX_RESULTS = 8;
const USER_AGENT = 'MeetNowApp/1.0';
const DEFAULT_TIMEOUT = 15000; // Increased timeout to 15 seconds

/**
 * Search for locations by query string or coordinates
 * @param {string} query - Search query for forward geocoding
 * @param {Object} options - Additional options for the search
 * @param {number} options.lat - Latitude for context-aware search
 * @param {number} options.lng - Longitude for context-aware search
 * @param {number} options.limit - Maximum number of results (default: 8)
 * @returns {Promise<Array>} - Array of location results
 */
export async function searchLocations(query, options = {}) {
  try {
    // Extract options
    const { lat, lng, limit = MAX_RESULTS } = options;
    
    // Handle both forward and reverse geocoding
    if (query) {
      // Try with Photon first (faster, no rate limits)
      try {
        const results = await searchWithPhoton(query, { lat, lng, limit });
        if (results && results.length > 0) {
          console.log('Photon search successful with results:', results.length);
          return results;
        }
      } catch (photonError) {
        console.warn('Photon search failed, falling back to Nominatim:', photonError);
        // Continue to Nominatim
      }
      
      // Forward geocoding with Nominatim as fallback
      return await forwardGeocode(query, { lat, lng, limit });
    } else if (lat !== undefined && lng !== undefined) {
      // Reverse geocoding (search by coordinates)
      return await reverseGeocode(lat, lng);
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
  const { lat, lng, limit = MAX_RESULTS } = options;
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
      return data.features.map(feature => {
        const props = feature.properties;
        const coordinates = feature.geometry.coordinates;
        
        return {
          place_id: props.osm_id || Math.random().toString(36).substring(2),
          display_name: formatPhotonAddress(props),
          lat: parseFloat(coordinates[1]),
          lng: parseFloat(coordinates[0]),
          lon: parseFloat(coordinates[0]),
          type: props.osm_key || 'place',
          importance: 0.5, // Photon doesn't provide this
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
  const { lat, lng, limit = MAX_RESULTS } = options;
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
    // Create a bounding box around the current location (roughly 10km)
    const boxSize = 0.1; // approximately 10km at equator
    params.append('viewbox', `${lng-boxSize},${lat-boxSize},${lng+boxSize},${lat+boxSize}`);
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
    
    // Process and rank the results
    return rankSearchResults(results, lat, lng);
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
async function reverseGeocode(lat, lng) {
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
      
      // Add formatted address
      result.display_name = formatAddress(result);
      
      return [result];
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
 * Rank search results based on relevance
 * Considers importance score, type of place, and proximity to user's location
 */
function rankSearchResults(results, userLat, userLng) {
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
  
  // Sort results by a combined relevance score
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