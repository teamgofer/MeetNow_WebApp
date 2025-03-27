# Smart Search Implementation

**Version:** 0.1.0  
**Status:** Documentation  
**Author:** MeetNow Engineering Team  
**Last Updated:** 2025-06-01

## Code Implementation

This document provides concrete code examples for implementing the Smart Search & Intelligent Zoom system. These code samples cover the core components described in the architecture document, demonstrating how they can be implemented in JavaScript.

## Core Modules

### Location Classifier (`src/utils/smart-search/classification.js`)

The location classifier analyzes geocoding results to determine location type:

```javascript
/**
 * Classifies a location based on geocoding API response
 * @param {Object} geocodingResult - The geocoding API response
 * @param {String} originalQuery - Optional original search query
 * @returns {Object} Classification result with type and confidence
 */
export function classifyLocationType(geocodingResult, originalQuery = null) {
  // Default to lowest confidence
  let result = { type: 'unknown', confidence: 0.1 };
  
  // Try multiple classification strategies
  const results = [
    classifyByOsmType(geocodingResult),
    classifyByComponents(geocodingResult),
    classifyByPlaceRank(geocodingResult),
    classifyByDisplayName(geocodingResult, originalQuery)
  ];
  
  // Find the classification with highest confidence
  for (const classification of results) {
    if (classification.confidence > result.confidence) {
      result = classification;
    }
  }
  
  return result;
}

/**
 * Classifies based on OSM type and class
 */
function classifyByOsmType(result) {
  if (!result.osm_type || !result.class) {
    return { type: 'unknown', confidence: 0 };
  }
  
  // OSM specific classification logic
  if (result.osm_type === 'node') {
    if (result.class === 'amenity' || result.class === 'shop') {
      return { type: 'poi', confidence: 0.9 };
    }
    if (result.class === 'building' || result.class === 'place') {
      return { type: 'address', confidence: 0.8 };
    }
  }
  
  if (result.osm_type === 'way') {
    if (result.class === 'highway') {
      return { type: 'street', confidence: 0.9 };
    }
    if (result.class === 'building') {
      return { type: 'address', confidence: 0.8 };
    }
  }
  
  if (result.osm_type === 'relation') {
    if (result.class === 'boundary' && result.type === 'administrative') {
      // Use place_rank to determine admin level
      if (result.place_rank >= 4 && result.place_rank <= 8) {
        return { type: 'country', confidence: 0.9 };
      }
      if (result.place_rank >= 10 && result.place_rank <= 12) {
        return { type: 'state', confidence: 0.9 };
      }
      if (result.place_rank >= 16 && result.place_rank <= 18) {
        return { type: 'city', confidence: 0.9 };
      }
      if (result.place_rank >= 19 && result.place_rank <= 22) {
        return { type: 'neighborhood', confidence: 0.8 };
      }
    }
  }
  
  return { type: 'unknown', confidence: 0.3 };
}

/**
 * Classifies based on address components
 */
function classifyByComponents(result) {
  if (!result.address) {
    return { type: 'unknown', confidence: 0 };
  }
  
  const address = result.address;
  
  // Check address components from most specific to least
  if (address.house_number && address.road) {
    return { type: 'address', confidence: 0.9 };
  }
  
  if (address.road && !address.house_number) {
    return { type: 'street', confidence: 0.8 };
  }
  
  if (address.neighbourhood || address.suburb) {
    return { type: 'neighborhood', confidence: 0.8 };
  }
  
  if (address.city || address.town || address.village) {
    return { type: 'city', confidence: 0.8 };
  }
  
  if (address.county || address.district) {
    return { type: 'county', confidence: 0.7 };
  }
  
  if (address.state || address.province) {
    return { type: 'state', confidence: 0.8 };
  }
  
  if (address.country) {
    return { type: 'country', confidence: 0.7 };
  }
  
  return { type: 'unknown', confidence: 0.2 };
}

// Additional classification functions...
```

### Zoom Level Resolver (`src/utils/smart-search/zoom-determination.js`)

The zoom level resolver determines the appropriate zoom level for different location types:

```javascript
// Default zoom levels for different location types
const DEFAULT_ZOOM_MAPPING = {
  address: 18,
  poi: 18,
  street: 17,
  neighborhood: 15,
  city: 12,
  county: 10,
  state: 8,
  country: 5,
  continent: 4,
  unknown: 13
};

// Population-based zoom adjustments for cities
const CITY_SIZE_ADJUSTMENTS = {
  small: 1,      // <50,000 -> zoom in more
  medium: 0,     // 50,000-500,000 -> default
  large: -1,     // 500,000-5,000,000 -> zoom out
  extraLarge: -2 // >5,000,000 -> zoom out more
};

/**
 * Determines appropriate zoom level based on location classification
 * @param {Object} classification - Location classification {type, confidence}
 * @param {Object} metadata - Additional location metadata (population, importance)
 * @param {Object} preferences - User zoom preferences
 * @returns {Object} Zoom information {zoom, minZoom, maxZoom}
 */
export function determineZoomLevel(classification, metadata = {}, preferences = null) {
  // Get base zoom from mapping
  const baseZoom = DEFAULT_ZOOM_MAPPING[classification.type] || DEFAULT_ZOOM_MAPPING.unknown;
  
  // Apply adjustments based on metadata
  let adjustedZoom = baseZoom;
  if (classification.type === 'city' && metadata.population) {
    adjustedZoom += getCitySizeAdjustment(metadata.population);
  }
  
  // Apply user preferences if available
  if (preferences) {
    // Global adjustment
    if (preferences.globalZoomAdjustment) {
      adjustedZoom += preferences.globalZoomAdjustment;
    }
    
    // Type-specific adjustment
    const typeAdjustKey = `${classification.type}ZoomAdjustment`;
    if (preferences[typeAdjustKey]) {
      adjustedZoom += preferences[typeAdjustKey];
    }
  }
  
  // Apply confidence-based constraints
  const zoomRange = getZoomRange(classification.type, classification.confidence);
  
  // Ensure zoom is within valid range
  const zoom = Math.max(zoomRange.minZoom, Math.min(zoomRange.maxZoom, adjustedZoom));
  
  return {
    zoom,
    minZoom: zoomRange.minZoom,
    maxZoom: zoomRange.maxZoom,
    baseZoom
  };
}

/**
 * Determines city size adjustment based on population
 */
function getCitySizeAdjustment(population) {
  if (population < 50000) {
    return CITY_SIZE_ADJUSTMENTS.small;
  }
  if (population < 500000) {
    return CITY_SIZE_ADJUSTMENTS.medium;
  }
  if (population < 5000000) {
    return CITY_SIZE_ADJUSTMENTS.large;
  }
  return CITY_SIZE_ADJUSTMENTS.extraLarge;
}

/**
 * Gets appropriate zoom range based on location type and confidence
 */
function getZoomRange(locationType, confidence) {
  const baseZoom = DEFAULT_ZOOM_MAPPING[locationType] || DEFAULT_ZOOM_MAPPING.unknown;
  
  // With high confidence, use a narrow range
  if (confidence > 0.8) {
    return {
      minZoom: Math.max(1, baseZoom - 1),
      maxZoom: Math.min(20, baseZoom + 1)
    };
  }
  
  // With lower confidence, use a wider range
  return {
    minZoom: Math.max(1, baseZoom - 2),
    maxZoom: Math.min(20, baseZoom + 2)
  };
}
```

### Bounding Box Calculator (`src/utils/smart-search/bounding-box.js`)

The bounding box calculator determines zoom level from geographic bounds:

```javascript
// Earth constants
const EARTH_RADIUS = 6371000; // meters
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculates appropriate zoom level to fit a bounding box
 * @param {Array} boundingBox - [south, north, west, east] coordinates
 * @param {Object} mapDimensions - {width, height} of map container in pixels
 * @param {Number} padding - Padding in pixels
 * @returns {Number} Calculated zoom level
 */
export function calculateZoomFromBoundingBox(boundingBox, mapDimensions, padding = 50) {
  // Guard against invalid inputs
  if (!boundingBox || !mapDimensions) {
    return 13; // Default zoom
  }
  
  try {
    const [south, north, west, east] = normalizeBoundingBox(boundingBox);
    
    // Adjust dimensions for padding
    const width = mapDimensions.width - 2 * padding;
    const height = mapDimensions.height - 2 * padding;
    
    if (width <= 0 || height <= 0) {
      return 13; // Default zoom
    }
    
    // Calculate zoom based on latitude span
    const latZoom = calculateLatitudeZoom(south, north, height);
    
    // Calculate zoom based on longitude span
    const centerLat = (south + north) / 2;
    const lngZoom = calculateLongitudeZoom(west, east, width, centerLat);
    
    // Use the smaller zoom to ensure entire box is visible
    return Math.floor(Math.min(latZoom, lngZoom));
  } catch (error) {
    console.error('Error calculating zoom from bounding box:', error);
    return 13; // Default zoom
  }
}

/**
 * Normalizes a bounding box to ensure valid coordinates
 */
function normalizeBoundingBox(boundingBox) {
  // Convert to numbers and handle possible string inputs
  let [south, north, west, east] = boundingBox.map(coord => parseFloat(coord));
  
  // Validate and fix invalid coordinates
  south = isNaN(south) ? -90 : Math.max(-90, Math.min(90, south));
  north = isNaN(north) ? 90 : Math.max(-90, Math.min(90, north));
  west = isNaN(west) ? -180 : west;
  east = isNaN(east) ? 180 : east;
  
  // Ensure south is less than north
  if (south > north) {
    [south, north] = [north, south];
  }
  
  // Handle cases crossing the antimeridian
  if (east - west > 360) {
    west = -180;
    east = 180;
  } else if (west > east) {
    // If box crosses the antimeridian, adjust to smaller distance
    if (west - east > 180) {
      east += 360;
    } else {
      west -= 360;
    }
  }
  
  return [south, north, west, east];
}

/**
 * Calculates zoom level based on latitude span
 */
function calculateLatitudeZoom(south, north, mapHeight) {
  const latSpan = north - south;
  
  // Early return for invalid or global span
  if (latSpan <= 0 || latSpan >= 180) {
    return 1;
  }
  
  // Calculate pixels per degree at zoom level 0
  const pixelsPerDegreeAtZoom0 = mapHeight / 180;
  
  // Calculate zoom level where this span fits in the map height
  return Math.log2(pixelsPerDegreeAtZoom0 / latSpan);
}

/**
 * Calculates zoom level based on longitude span, adjusted for latitude
 */
function calculateLongitudeZoom(west, east, mapWidth, centerLat) {
  let lngSpan = east - west;
  
  // Early return for invalid or global span
  if (lngSpan <= 0 || lngSpan >= 360) {
    return 1;
  }
  
  // Adjust for latitude (longitude degrees are closer at higher latitudes)
  const lngAdjustment = Math.abs(Math.cos(centerLat * DEG_TO_RAD));
  const adjustedLngSpan = lngSpan * lngAdjustment;
  
  // Calculate pixels per degree at zoom level 0
  const pixelsPerDegreeAtZoom0 = mapWidth / 360;
  
  // Calculate zoom level where this span fits in the map width
  return Math.log2(pixelsPerDegreeAtZoom0 / adjustedLngSpan);
}
```

### Integration Layer (`src/utils/smart-search/integration.js`)

The integration layer connects the smart search system with the existing app:

```javascript
import { classifyLocationType } from './classification';
import { determineZoomLevel } from './zoom-determination';
import { calculateZoomFromBoundingBox } from './bounding-box';
import { loadZoomPreferences } from './preferences';
import { trackZoomDetermination } from './analytics';

/**
 * Main function to determine appropriate zoom for a location
 * @param {Object} geocodingResult - Geocoding API response
 * @param {Object} options - Configuration options
 * @returns {Number} Recommended zoom level
 */
export function determineZoomForLocation(geocodingResult, options = {}) {
  const {
    userPreferences = loadZoomPreferences(),
    mapDimensions = getMapDimensions(),
    originalQuery = null
  } = options;
  
  try {
    // Primary method: classification-based zoom
    const classification = classifyLocationType(geocodingResult, originalQuery);
    
    // Extract metadata
    const metadata = extractMetadata(geocodingResult);
    
    // For high confidence classifications, use the classification-based zoom
    if (classification.confidence > 0.7) {
      const zoomInfo = determineZoomLevel(classification, metadata, userPreferences);
      
      // Track for analytics
      trackZoomDetermination('classification', {
        query: originalQuery,
        locationType: classification.type,
        confidence: classification.confidence,
        zoom: zoomInfo.zoom
      });
      
      return zoomInfo.zoom;
    }
    
    // Fallback: bounding box calculation
    if (geocodingResult.boundingbox) {
      const zoom = calculateZoomFromBoundingBox(
        geocodingResult.boundingbox,
        mapDimensions
      );
      
      // Track for analytics
      trackZoomDetermination('boundingBox', {
        query: originalQuery,
        zoom: zoom
      });
      
      return zoom;
    }
    
    // Last resort: use a reasonable default based on text length heuristic
    const defaultZoom = getHeuristicZoom(geocodingResult, originalQuery);
    
    // Track for analytics
    trackZoomDetermination('heuristic', {
      query: originalQuery,
      zoom: defaultZoom
    });
    
    return defaultZoom;
    
  } catch (error) {
    console.error('Error determining zoom level:', error);
    return 13; // Default zoom level
  }
}

/**
 * Extracts relevant metadata from geocoding result
 */
function extractMetadata(result) {
  const metadata = {};
  
  // Extract population if available
  if (result.extratags && result.extratags.population) {
    metadata.population = parseInt(result.extratags.population, 10);
  }
  
  // Extract importance if available
  if (typeof result.importance === 'number') {
    metadata.importance = result.importance;
  }
  
  // Extract size from bounding box if available
  if (result.boundingbox) {
    const [south, north, west, east] = result.boundingbox.map(coord => parseFloat(coord));
    metadata.latSpan = north - south;
    metadata.lngSpan = east - west;
  }
  
  return metadata;
}

/**
 * Gets map dimensions from the DOM
 */
function getMapDimensions() {
  const mapElement = document.getElementById('map-container');
  if (mapElement) {
    return {
      width: mapElement.clientWidth,
      height: mapElement.clientHeight
    };
  }
  
  // Default dimensions if map element not found
  return { width: 800, height: 600 };
}

/**
 * Determine zoom based on simple heuristics when other methods fail
 */
function getHeuristicZoom(result, query) {
  // Use display name length as a heuristic
  if (result.display_name) {
    const parts = result.display_name.split(',');
    
    // More parts typically means more specific location
    if (parts.length >= 5) return 17; // Likely an address
    if (parts.length >= 3) return 14; // Likely a place in a city
    if (parts.length >= 2) return 10; // Likely a city or region
    
    return 7; // Likely a large area
  }
  
  // Use query length as a fallback heuristic
  if (query) {
    if (query.length <= 3) return 4;  // Very short (likely a country code)
    if (query.length <= 8) return 6;  // Short (likely a country or state)
    if (query.length <= 20) return 10; // Medium (likely a city)
    return 15; // Long (likely a specific place)
  }
  
  return 13; // Default fallback
}
```

### User Preferences (`src/utils/smart-search/preferences.js`)

The preference manager handles user zoom settings:

```javascript
// Storage key
const ZOOM_PREFS_KEY = 'meetnow_zoom_preferences';

// Default preferences
const DEFAULT_PREFERENCES = {
  mode: 'automatic', // 'automatic', 'fixed', 'custom'
  globalZoomAdjustment: 0,
  fixedZoom: 13,
  minZoom: 3,
  maxZoom: 19
};

/**
 * Loads user zoom preferences from localStorage
 * @returns {Object|null} User preferences or null if not found
 */
export function loadZoomPreferences() {
  try {
    const stored = localStorage.getItem(ZOOM_PREFS_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    
    const preferences = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...preferences };
    
  } catch (error) {
    console.error('Error loading zoom preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves user zoom preferences to localStorage
 * @param {Object} preferences - User preferences to save
 * @returns {Boolean} Success indicator
 */
export function saveZoomPreferences(preferences) {
  try {
    localStorage.setItem(ZOOM_PREFS_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving zoom preferences:', error);
    return false;
  }
}

/**
 * Tracks user zoom adjustment for future optimization
 * @param {Object} searchResult - Original search result
 * @param {Number} originalZoom - Initially determined zoom level
 * @param {Number} userZoom - User-adjusted zoom level
 */
export function trackZoomAdjustment(searchResult, originalZoom, userZoom) {
  try {
    // Get current preferences
    const preferences = loadZoomPreferences();
    
    // Only track if using automatic mode
    if (preferences.mode !== 'automatic') {
      return;
    }
    
    // Determine location type from search result
    const locationType = searchResult._locationType || 'unknown';
    
    // Track adjustment for this location type
    const adjustmentKey = `${locationType}ZoomAdjustment`;
    
    // Initialize if not exists
    if (typeof preferences[adjustmentKey] !== 'number') {
      preferences[adjustmentKey] = 0;
    }
    
    // Calculate new adjustment (weighted average)
    const currentAdjustment = preferences[adjustmentKey];
    const userAdjustment = userZoom - originalZoom;
    
    // Update with weighted average (30% weight to new adjustment)
    preferences[adjustmentKey] = Math.round(
      (currentAdjustment * 0.7) + (userAdjustment * 0.3)
    );
    
    // Save updated preferences
    saveZoomPreferences(preferences);
    
  } catch (error) {
    console.error('Error tracking zoom adjustment:', error);
  }
}
```

### Analytics Module (`src/utils/smart-search/analytics.js`)

The analytics module tracks system performance:

```javascript
// Queue to batch analytics events
let analyticsQueue = [];
const QUEUE_FLUSH_INTERVAL = 60000; // 1 minute

// Set up periodic flush
setInterval(flushAnalyticsQueue, QUEUE_FLUSH_INTERVAL);

/**
 * Tracks zoom determination events
 * @param {String} method - Method used for determination
 * @param {Object} data - Event data
 */
export function trackZoomDetermination(method, data) {
  queueAnalyticsEvent('zoom_determination', {
    method,
    timestamp: Date.now(),
    ...data
  });
}

/**
 * Tracks user zoom adjustments
 * @param {Object} data - Event data
 */
export function trackUserAdjustment(data) {
  queueAnalyticsEvent('zoom_adjustment', {
    timestamp: Date.now(),
    ...data
  });
}

/**
 * Queues an analytics event for batched processing
 */
function queueAnalyticsEvent(eventType, eventData) {
  analyticsQueue.push({
    type: eventType,
    data: eventData
  });
  
  // Flush immediately if queue gets too large
  if (analyticsQueue.length >= 20) {
    flushAnalyticsQueue();
  }
}

/**
 * Sends queued analytics events to the server
 */
function flushAnalyticsQueue() {
  if (analyticsQueue.length === 0) {
    return;
  }
  
  const eventsToSend = [...analyticsQueue];
  analyticsQueue = [];
  
  // Send to analytics endpoint
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      events: eventsToSend,
      source: 'smart_search'
    }),
    // Use keepalive to ensure delivery even if page is unloading
    keepalive: true
  }).catch(error => {
    console.error('Error sending analytics events:', error);
    // Re-queue failed events
    analyticsQueue = [...eventsToSend, ...analyticsQueue];
  });
}
```

## Integration Examples

### Adding to Search Results (`src/components/SearchBox.jsx`)

```javascript
import { determineZoomForLocation } from '../utils/smart-search';

// In the search result handler
const handleSearchResults = (results) => {
  if (!results || results.length === 0) {
    setSearchError('No results found');
    return;
  }
  
  const result = results[0];
  
  // Enhance with intelligent zoom
  const zoom = determineZoomForLocation(result, {
    originalQuery: searchQuery
  });
  
  // Store original zoom for tracking adjustments
  result._originalZoom = zoom;
  
  // Navigate to location with intelligent zoom
  mapNavigationController.navigateTo({
    lat: result.lat,
    lon: result.lng,
    _source: 'search'
  }, {
    zoom: zoom,
    animate: true
  });
  
  // Update UI
  setSelectedLocation(result);
  setSearchResults(results);
};
```

### Map Event Listener for Zoom Tracking (`src/components/Map.jsx`)

```javascript
import { trackZoomAdjustment } from '../utils/smart-search/preferences';

// In the map component
useEffect(() => {
  if (!mapRef.current) return;
  
  // Track zoom changes after search
  const handleZoomEnd = () => {
    const currentZoom = mapRef.current.getZoom();
    
    // Only track if this is after a search
    if (selectedLocation && 
        selectedLocation._source === 'search' && 
        selectedLocation._originalZoom !== undefined) {
          
      // Check if user has manually changed the zoom
      if (currentZoom !== selectedLocation._originalZoom) {
        trackZoomAdjustment(
          selectedLocation,
          selectedLocation._originalZoom,
          currentZoom
        );
      }
    }
  };
  
  mapRef.current.on('zoomend', handleZoomEnd);
  
  return () => {
    if (mapRef.current) {
      mapRef.current.off('zoomend', handleZoomEnd);
    }
  };
}, [mapRef, selectedLocation]);
```

### User Preferences UI (`src/components/settings/MapSettings.jsx`)

```jsx
import React, { useState, useEffect } from 'react';
import { loadZoomPreferences, saveZoomPreferences } from '../../utils/smart-search/preferences';

function ZoomPreferencesSettings() {
  const [preferences, setPreferences] = useState(null);
  
  // Load preferences on mount
  useEffect(() => {
    const userPrefs = loadZoomPreferences();
    setPreferences(userPrefs);
  }, []);
  
  // Handle mode change
  const handleModeChange = (event) => {
    const newMode = event.target.value;
    setPreferences(prev => ({
      ...prev,
      mode: newMode
    }));
  };
  
  // Handle zoom adjustment change
  const handleAdjustmentChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setPreferences(prev => ({
      ...prev,
      globalZoomAdjustment: value
    }));
  };
  
  // Save preferences
  const saveChanges = () => {
    if (preferences) {
      saveZoomPreferences(preferences);
    }
  };
  
  if (!preferences) {
    return <div>Loading preferences...</div>;
  }
  
  return (
    <div className="settings-section">
      <h3>Zoom Preferences</h3>
      
      <div className="setting-item">
        <label>Zoom Mode:</label>
        <select 
          value={preferences.mode} 
          onChange={handleModeChange}
        >
          <option value="automatic">Intelligent Zoom (Automatic)</option>
          <option value="fixed">Fixed Zoom Level</option>
          <option value="custom">Custom Zoom Range</option>
        </select>
      </div>
      
      {preferences.mode === 'automatic' && (
        <div className="setting-item">
          <label>Default Zoom Adjustment:</label>
          <input 
            type="range" 
            min="-3" 
            max="3" 
            value={preferences.globalZoomAdjustment} 
            onChange={handleAdjustmentChange}
          />
          <span>
            {preferences.globalZoomAdjustment > 0 
              ? `+${preferences.globalZoomAdjustment} (Closer)` 
              : preferences.globalZoomAdjustment < 0 
                ? `${preferences.globalZoomAdjustment} (Further)` 
                : 'Default'}
          </span>
        </div>
      )}
      
      {preferences.mode === 'fixed' && (
        <div className="setting-item">
          <label>Fixed Zoom Level:</label>
          <input 
            type="range" 
            min="1" 
            max="19" 
            value={preferences.fixedZoom} 
            onChange={(e) => setPreferences(prev => ({
              ...prev, 
              fixedZoom: parseInt(e.target.value, 10)
            }))}
          />
          <span>{preferences.fixedZoom}</span>
        </div>
      )}
      
      {preferences.mode === 'custom' && (
        <>
          <div className="setting-item">
            <label>Minimum Zoom:</label>
            <input 
              type="range" 
              min="1" 
              max="19" 
              value={preferences.minZoom} 
              onChange={(e) => setPreferences(prev => ({
                ...prev, 
                minZoom: parseInt(e.target.value, 10)
              }))}
            />
            <span>{preferences.minZoom}</span>
          </div>
          <div className="setting-item">
            <label>Maximum Zoom:</label>
            <input 
              type="range" 
              min="1" 
              max="19" 
              value={preferences.maxZoom} 
              onChange={(e) => setPreferences(prev => ({
                ...prev, 
                maxZoom: parseInt(e.target.value, 10)
              }))}
            />
            <span>{preferences.maxZoom}</span>
          </div>
        </>
      )}
      
      <button 
        className="save-button" 
        onClick={saveChanges}
      >
        Save Preferences
      </button>
    </div>
  );
}
```

## Main API (`src/utils/smart-search/index.js`)

The main entry point that exports the public API:

```javascript
import { determineZoomForLocation } from './integration';
import { trackZoomAdjustment } from './preferences';
import { loadZoomPreferences, saveZoomPreferences } from './preferences';

// Export public API
export {
  determineZoomForLocation,
  trackZoomAdjustment,
  loadZoomPreferences,
  saveZoomPreferences
};
```

## Conclusion

These implementation examples provide a blueprint for building the Smart Search & Intelligent Zoom system. The modular approach allows for incremental implementation, testing, and refinement.

Each module has a specific responsibility, making the code more maintainable and testable. The integration examples show how to connect the system with the existing application components.

For a detailed implementation plan including timelines and resource allocation, see the companion document [implementation-plan.md](./implementation-plan.md). 