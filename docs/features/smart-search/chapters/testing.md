# Testing Strategy for Smart Search

**Version:** 0.1.0  
**Status:** Documentation  
**Author:** MeetNow QA Team  
**Last Updated:** 2025-06-01

## Overview

This document outlines the testing approach for the Smart Search & Intelligent Zoom feature. It covers unit testing, integration testing, end-to-end testing, and performance testing, with specific considerations for each component of the system.

## Testing Objectives

Our testing approach aims to:

1. Validate the correctness of location classification
2. Ensure appropriate zoom levels are determined for different location types
3. Verify seamless integration with existing search and map navigation
4. Measure performance impact on search operations
5. Validate the user experience on various devices and contexts

## Test Environments

The feature will be tested in the following environments:

1. **Development Environment**
   - Local development machines
   - Dev servers with simulated user behavior

2. **Staging Environment**
   - Full integration with other services
   - Limited real user testing (internal team)

3. **Production Environment**
   - A/B testing with controlled rollout
   - Full performance monitoring

## Unit Testing

### 1. Location Classifier Tests

**Test File:** `src/utils/smart-search/__tests__/classification.test.js`

Tests to validate the classification logic:

```javascript
describe('Location Classification', () => {
  test('Classifies address correctly', () => {
    const mockAddressResult = {
      osm_type: 'node',
      type: 'house',
      address: {
        house_number: '123',
        road: 'Main St',
        city: 'Anytown'
      }
    };
    
    const classification = classifyLocationType(mockAddressResult);
    expect(classification.type).toBe('address');
    expect(classification.confidence).toBeGreaterThan(0.8);
  });
  
  test('Classifies city correctly', () => {
    const mockCityResult = {
      osm_type: 'relation',
      type: 'administrative',
      class: 'place',
      place_rank: 16,
      address: {
        city: 'Berlin',
        country: 'Germany'
      }
    };
    
    const classification = classifyLocationType(mockCityResult);
    expect(classification.type).toBe('city');
    expect(classification.confidence).toBeGreaterThan(0.8);
  });
  
  test('Classifies POI correctly', () => {
    const mockPoiResult = {
      osm_type: 'node',
      type: 'poi',
      class: 'tourism',
      address: {
        tourism: 'Eiffel Tower',
        city: 'Paris'
      }
    };
    
    const classification = classifyLocationType(mockPoiResult);
    expect(classification.type).toBe('poi');
    expect(classification.confidence).toBeGreaterThan(0.8);
  });
  
  test('Returns lower confidence for ambiguous results', () => {
    const ambiguousResult = {
      display_name: 'Springfield',
      type: 'administrative'
      // Limited information
    };
    
    const classification = classifyLocationType(ambiguousResult);
    expect(classification.confidence).toBeLessThan(0.8);
  });
});
```

### 2. Zoom Level Resolver Tests

**Test File:** `src/utils/smart-search/__tests__/zoom-determination.test.js`

Tests to validate zoom determination:

```javascript
describe('Zoom Level Determination', () => {
  test('Provides high zoom for addresses', () => {
    const zoomInfo = determineZoomLevel({
      type: 'address',
      confidence: 0.9
    }, {});
    
    expect(zoomInfo.zoom).toBeGreaterThanOrEqual(18);
  });
  
  test('Provides medium zoom for neighborhoods', () => {
    const zoomInfo = determineZoomLevel({
      type: 'neighborhood',
      confidence: 0.9
    }, {});
    
    expect(zoomInfo.zoom).toBeBetween(15, 17);
  });
  
  test('Provides low zoom for countries', () => {
    const zoomInfo = determineZoomLevel({
      type: 'country',
      confidence: 0.9
    }, {});
    
    expect(zoomInfo.zoom).toBeLessThanOrEqual(6);
  });
  
  test('Adjusts zoom based on metadata', () => {
    const smallCity = determineZoomLevel({
      type: 'city',
      confidence: 0.9
    }, { population: 10000 });
    
    const largeCity = determineZoomLevel({
      type: 'city',
      confidence: 0.9
    }, { population: 5000000 });
    
    expect(smallCity.zoom).toBeGreaterThan(largeCity.zoom);
  });
  
  test('Respects user preferences', () => {
    const defaultZoom = determineZoomLevel({
      type: 'city',
      confidence: 0.9
    }, {});
    
    const userAdjustedZoom = determineZoomLevel({
      type: 'city',
      confidence: 0.9
    }, {}, {
      cityZoomAdjustment: 2 // User prefers closer zoom
    });
    
    expect(userAdjustedZoom.zoom).toBe(defaultZoom.zoom + 2);
  });
});
```

### 3. Bounding Box Calculator Tests

**Test File:** `src/utils/smart-search/__tests__/bounding-box.test.js`

Tests for bounding box calculations:

```javascript
describe('Bounding Box Calculations', () => {
  test('Calculates correct zoom for country bounding box', () => {
    const countryBoundingBox = [
      -10.5, // South
      5.8,   // North
      -179.5,// West
      177.8  // East
    ];
    
    const mapDimensions = { width: 800, height: 600 };
    
    const zoom = calculateZoomFromBoundingBox(
      countryBoundingBox, 
      mapDimensions
    );
    
    expect(zoom).toBeLessThanOrEqual(5);
  });
  
  test('Calculates correct zoom for city bounding box', () => {
    const cityBoundingBox = [
      52.4,  // South
      52.6,  // North
      13.2,  // West
      13.6   // East
    ];
    
    const mapDimensions = { width: 800, height: 600 };
    
    const zoom = calculateZoomFromBoundingBox(
      cityBoundingBox, 
      mapDimensions
    );
    
    expect(zoom).toBeGreaterThanOrEqual(10);
    expect(zoom).toBeLessThanOrEqual(14);
  });
  
  test('Applies padding correctly', () => {
    const boundingBox = [
      52.4,  // South
      52.6,  // North
      13.2,  // West
      13.6   // East
    ];
    
    const mapDimensions = { width: 800, height: 600 };
    
    const zoomWithDefaultPadding = calculateZoomFromBoundingBox(
      boundingBox, 
      mapDimensions
    );
    
    const zoomWithLargePadding = calculateZoomFromBoundingBox(
      boundingBox, 
      mapDimensions,
      100 // Larger padding
    );
    
    expect(zoomWithLargePadding).toBeLessThan(zoomWithDefaultPadding);
  });
  
  test('Handles invalid bounding boxes gracefully', () => {
    const invalidBoundingBox = [
      null,  // South
      52.6,  // North
      13.2,  // West
      13.6   // East
    ];
    
    const mapDimensions = { width: 800, height: 600 };
    
    expect(() => calculateZoomFromBoundingBox(
      invalidBoundingBox, 
      mapDimensions
    )).not.toThrow();
    
    // Should return a fallback zoom
    const result = calculateZoomFromBoundingBox(
      invalidBoundingBox, 
      mapDimensions
    );
    expect(result).toBe(DEFAULT_ZOOM);
  });
});
```

### 4. User Preferences Tests

**Test File:** `src/utils/smart-search/__tests__/preferences.test.js`

Tests for preference management:

```javascript
describe('User Preferences', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  test('Saves and loads preferences correctly', () => {
    const testPreferences = {
      generalZoomAdjustment: 1,
      addressZoomAdjustment: 2,
      poiZoomAdjustment: -1
    };
    
    saveZoomPreferences(testPreferences);
    const loaded = loadZoomPreferences();
    
    expect(loaded).toEqual(testPreferences);
  });
  
  test('Returns null for missing preferences', () => {
    const preferences = loadZoomPreferences();
    expect(preferences).toBeNull();
  });
  
  test('Handles localStorage errors', () => {
    // Mock localStorage to throw an error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('Storage error');
    });
    
    const result = saveZoomPreferences({ test: true });
    expect(result).toBe(false);
    
    // Restore original
    Storage.prototype.setItem = originalSetItem;
  });
});
```

## Integration Testing

### 1. Search Result Integration Tests

**Test File:** `src/utils/smart-search/__tests__/integration.test.js`

Tests for integration with search results:

```javascript
describe('Search Result Integration', () => {
  test('Enhances search results with zoom recommendations', () => {
    const mockResult = {
      display_name: 'Berlin, Germany',
      lat: 52.5,
      lon: 13.4,
      // Other result properties
    };
    
    const enhanced = enhanceSearchResultWithZoom(mockResult);
    
    expect(enhanced).toHaveProperty('_recommendedZoom');
    expect(enhanced).toHaveProperty('_locationType');
  });
  
  test('Preserves all original properties', () => {
    const mockResult = {
      display_name: 'Berlin, Germany',
      lat: 52.5,
      lon: 13.4,
      osm_id: 12345,
      importance: 0.8
    };
    
    const enhanced = enhanceSearchResultWithZoom(mockResult);
    
    // Should have all original properties
    Object.keys(mockResult).forEach(key => {
      expect(enhanced[key]).toEqual(mockResult[key]);
    });
  });
});
```

### 2. Navigation Controller Integration Tests

**Test File:** `src/utils/navigation/__tests__/MapNavigationController.test.js`

Tests for integration with map navigation:

```javascript
describe('Map Navigation Controller Integration', () => {
  // Setup mock leaflet map
  let mockMap;
  let controller;
  
  beforeEach(() => {
    mockMap = {
      setView: jest.fn(),
      fitBounds: jest.fn()
    };
    
    controller = new MapNavigationController(mockMap);
  });
  
  test('Uses recommended zoom when available', () => {
    const location = {
      lat: 52.5,
      lon: 13.4,
      _recommendedZoom: 12
    };
    
    controller.navigateTo(location);
    
    expect(mockMap.setView).toHaveBeenCalledWith(
      [52.5, 13.4],
      12,
      expect.anything()
    );
  });
  
  test('Override takes precedence over recommended zoom', () => {
    const location = {
      lat: 52.5,
      lon: 13.4,
      _recommendedZoom: 12
    };
    
    controller.navigateTo(location, { zoom: 14 });
    
    expect(mockMap.setView).toHaveBeenCalledWith(
      [52.5, 13.4],
      14,
      expect.anything()
    );
  });
  
  test('Uses bounding box when available', () => {
    const location = {
      lat: 52.5,
      lon: 13.4,
      boundingbox: [52.4, 52.6, 13.3, 13.5]
    };
    
    controller.navigateTo(location);
    
    expect(mockMap.fitBounds).toHaveBeenCalled();
    expect(mockMap.setView).not.toHaveBeenCalled();
  });
});
```

## End-to-End Testing

**Test File:** `cypress/integration/smart-search.spec.js`

End-to-end tests with Cypress:

```javascript
describe('Smart Search', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('GET', '**/search*', { fixture: 'search-results.json' });
  });
  
  it('Applies correct zoom when searching for a country', () => {
    // Mock a search for "Germany"
    cy.get('[data-testid="search-input"]').type('Germany');
    cy.get('[data-testid="search-button"]').click();
    
    // Check zoom level is appropriate for country
    cy.window().its('map').then(map => {
      expect(map.getZoom()).to.be.lessThan(7);
    });
  });
  
  it('Applies correct zoom when searching for a city', () => {
    // Mock a search for "Berlin"
    cy.get('[data-testid="search-input"]').type('Berlin');
    cy.get('[data-testid="search-button"]').click();
    
    // Check zoom level is appropriate for city
    cy.window().its('map').then(map => {
      expect(map.getZoom()).to.be.greaterThan(10);
      expect(map.getZoom()).to.be.lessThan(15);
    });
  });
  
  it('Applies correct zoom when searching for an address', () => {
    // Mock a search for a specific address
    cy.get('[data-testid="search-input"]').type('123 Main St, Anytown');
    cy.get('[data-testid="search-button"]').click();
    
    // Check zoom level is appropriate for address
    cy.window().its('map').then(map => {
      expect(map.getZoom()).to.be.greaterThan(16);
    });
  });
  
  it('User can adjust zoom after automatic zoom', () => {
    // Search for a location
    cy.get('[data-testid="search-input"]').type('Berlin');
    cy.get('[data-testid="search-button"]').click();
    
    // Get initial zoom
    let initialZoom;
    cy.window().its('map').then(map => {
      initialZoom = map.getZoom();
    });
    
    // Adjust zoom manually
    cy.get('[data-testid="zoom-in-button"]').click().click();
    
    // Verify zoom changed
    cy.window().its('map').then(map => {
      expect(map.getZoom()).to.equal(initialZoom + 2);
    });
  });
});
```

## Performance Testing

### 1. Client-Side Performance

**Test File:** `src/utils/smart-search/__tests__/performance.test.js`

Tests for performance of zoom calculations:

```javascript
describe('Performance Tests', () => {
  test('Zoom determination completes within time budget', () => {
    const mockResult = {
      display_name: 'New York City, NY, USA',
      lat: 40.7,
      lon: -74.0,
      osm_type: 'relation',
      class: 'place',
      type: 'city'
    };
    
    const start = performance.now();
    determineZoomForLocation(mockResult);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(20); // Under 20ms
  });
  
  test('Handles multiple rapid zoom determinations', () => {
    const mockResults = [
      {
        display_name: 'New York City, NY, USA',
        lat: 40.7,
        lon: -74.0,
        type: 'city'
      },
      {
        display_name: '123 Main St, Anytown',
        lat: 35.0,
        lon: -70.0,
        type: 'house'
      },
      {
        display_name: 'Eiffel Tower, Paris',
        lat: 48.9,
        lon: 2.3,
        type: 'tourism'
      }
    ];
    
    const start = performance.now();
    
    mockResults.forEach(result => {
      determineZoomForLocation(result);
    });
    
    const end = performance.now();
    const averageTime = (end - start) / mockResults.length;
    
    expect(averageTime).toBeLessThan(15); // Under 15ms average
  });
});
```

### 2. Load Testing

**Test File:** `tests/performance/smart-search-load.js`

Load testing with k6:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

export default function() {
  // Simulate search requests with the intelligent zoom feature enabled
  const response = http.get('https://staging.meetnow.app/api/search?q=New+York&feature_flags=smart_zoom');
  
  check(response, {
    'is status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
  
  sleep(1);
}
```

## Usability Testing

### 1. A/B Testing Setup

**Configuration:** `src/config/experimental.js`

```javascript
// Feature flag configuration
export const FEATURES = {
  SMART_ZOOM: {
    enabled: true,
    rolloutPercentage: 50, // 50% of users get the feature
    cohorts: {
      control: {
        description: 'Control group - standard zoom behavior'
      },
      treatment: {
        description: 'Treatment group - intelligent zoom'
      }
    }
  }
};
```

### 2. User Feedback Metrics

Metrics to track:

1. **Zoom Adjustment Rate**: Percentage of searches followed by manual zoom adjustments
2. **Search Satisfaction**: Survey results comparing control vs. treatment groups
3. **Feature Usage**: Frequency of search usage with intelligent zoom vs. control

## Test Data

### Sample Data Sets

**File:** `src/utils/smart-search/__tests__/fixtures/location-samples.json`

```json
{
  "locations": [
    {
      "type": "country",
      "sample": {
        "display_name": "Germany",
        "osm_type": "relation",
        "place_rank": 4,
        "type": "administrative",
        "lat": "51.1657",
        "lon": "10.4515",
        "boundingbox": ["47.2701", "55.0985", "5.8662", "15.0421"]
      },
      "expectedZoom": 5
    },
    {
      "type": "city",
      "sample": {
        "display_name": "Berlin, Germany",
        "osm_type": "relation",
        "place_rank": 16,
        "type": "administrative",
        "lat": "52.5170",
        "lon": "13.3889",
        "boundingbox": ["52.3382", "52.6755", "13.0883", "13.7612"]
      },
      "expectedZoom": 12
    },
    {
      "type": "address",
      "sample": {
        "display_name": "10 Downing Street, London, UK",
        "osm_type": "node",
        "place_rank": 30,
        "type": "house",
        "lat": "51.5034",
        "lon": "-0.1276"
      },
      "expectedZoom": 18
    }
  ]
}
```

## Continuous Integration

The test suite will be integrated into our CI pipeline:

```yaml
# .github/workflows/smart-search-tests.yml
name: Smart Search Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/utils/smart-search/**'
      - 'src/components/Map**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/utils/smart-search/**'
      - 'src/components/Map**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test -- --testPathPattern=src/utils/smart-search
      - name: Run integration tests
        run: npm test -- --testPathPattern=integration
      - name: Run e2e tests
        run: npm run cypress:run
```

## Regression Testing

Areas for regression testing:

1. **Existing Map Functionality**: Verify that all existing map interactions continue to work.
2. **Search History**: Confirm search history and recent searches still function correctly.
3. **Performance**: Ensure the app's overall performance is not negatively impacted.
4. **Mobile Experience**: Test on multiple mobile devices to ensure the feature works well on small screens.

## Accessibility Testing

Accessibility considerations:

1. **Keyboard Navigation**: Ensure all new map controls are keyboard accessible.
2. **Screen Reader Compatibility**: Test with screen readers to ensure location information is properly announced.
3. **Contrast and Visibility**: Ensure zoom level indicators meet contrast requirements.

## Test Coverage Goals

The testing strategy aims to achieve:

1. **Unit Test Coverage**: >90% for the core smart search modules
2. **Integration Test Coverage**: >80% for integration points
3. **E2E Test Coverage**: Key user flows including various location types

## Conclusion

This comprehensive testing strategy ensures that the Smart Search & Intelligent Zoom feature meets both functional requirements and performance goals. By combining unit, integration, and end-to-end tests with performance monitoring, we can deploy with confidence that users will experience an improved search experience without regressions or performance degradation.

The A/B testing approach allows us to gather real user feedback and quantitative metrics to measure the impact of the feature before full rollout, ensuring we deliver genuine user value. 