# Map and Geolocation Testing Guide

## Overview

This document outlines testing strategies for map components and geolocation functionality in the MeetNow application. It covers best practices, common pitfalls, and techniques for effective testing of location-based features.

## Testing Geolocation in MeetNowApp

The `MeetNowApp` component relies heavily on geolocation services and map rendering. Testing these features presents several challenges:

- Geolocation API is not available in test environments by default
- Map rendering components like Leaflet require special mocking
- Asynchronous nature of location requests can cause timing issues
- Error states need to be thoroughly tested

### Mocking Geolocation API

When testing components that use the browser's Geolocation API, we need to mock `navigator.geolocation`:

```javascript
// Basic geolocation mock
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      }
    });
  }),
  watchPosition: vi.fn().mockImplementation(() => 1),
  clearWatch: vi.fn()
};

global.navigator.geolocation = mockGeolocation;
```

### Testing Error Scenarios

For geolocation error testing, directly trigger the error callback rather than waiting for actual timeouts:

```javascript
// Testing permission denied (error code 1)
vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
  error({ code: 1, message: 'User denied geolocation' });
});

// Testing position unavailable (error code 2)
vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
  error({ code: 2, message: 'Position unavailable' });
});

// Testing timeout (error code 3)
vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
  error({ code: 3, message: 'Timeout' });
});
```

### Testing Development Environment

To test development environment-specific behaviors:

```javascript
// Mock window.location for localhost testing
const originalLocation = window.location;
delete window.location;
window.location = { hostname: 'localhost' };

// Run test...

// Restore original
window.location = originalLocation;
```

### Testing Timeout Scenarios

Instead of waiting for actual timeouts, which can make tests slow and unreliable, directly simulate timeout behaviors:

```javascript
// Bad approach - waiting for actual timeout
vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(() => {
  // Never calls success or error callback
});
// Wait 15 seconds... (slow test)

// Better approach - directly simulate timeout
vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
  error({ code: 3, message: 'Timeout' });
});
```

### Testing Error Boundaries

When testing components with error boundaries, verify the error state is triggered correctly:

```javascript
// Render component that will trigger error boundary
render(<MeetNowApp />);

// Check for error state message
const errorTitle = await screen.findByText('Something went wrong');
expect(errorTitle).toBeInTheDocument();
```

## Mocking Leaflet Maps

Leaflet-based maps need special handling in the test environment:

### Map Mock Implementation

We use a simplified mock implementation of Leaflet for testing:

```javascript
// Mock Leaflet library (src/test/mocks/leaflet.js)
const L = {
  map: () => ({
    setView: () => ({ on: () => {}, off: () => {} }),
    on: () => {},
    off: () => {},
    remove: () => {},
    getZoom: () => 13,
    getCenter: () => ({ lat: 0, lng: 0 }),
    flyTo: () => Promise.resolve(true),
    setZoom: () => {},
    panTo: () => Promise.resolve(true),
  }),
  tileLayer: () => ({
    addTo: () => {},
    remove: () => {},
  }),
  marker: () => ({
    setLatLng: () => {},
    addTo: () => {},
    remove: () => {},
    bindPopup: () => {},
    setIcon: () => {},
    getLatLng: () => ({ lat: 0, lng: 0 }),
  }),
  divIcon: (options) => ({
    options,
  }),
  latLng: (lat, lng) => ({ lat, lng }),
  point: (x, y) => ({ x, y }),
};
```

### Common Leaflet Testing Issues

When testing Leaflet-based components in JSDOM, you may encounter issues with:

1. Icon initialization (`options.icon.createIcon is not a function`)
2. DOM element operations that JSDOM doesn't fully support
3. CSS transformation issues

These errors may appear in test output but won't necessarily cause test failures if properly handled by error boundaries.

## MapNavigationController Testing

When testing components that use the `MapNavigationController`:

```javascript
// Mock the controller
vi.mock('../../utils/MapNavigationController', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      updateMapReference: vi.fn().mockReturnValue(true),
      navigateTo: vi.fn().mockResolvedValue(true),
      setSelectedLocation: vi.fn(),
      setUserLocation: vi.fn()
    }))
  };
});
```

## Best Practices

1. **Direct error injection**: Simulate errors directly rather than waiting for timeouts
2. **Mock Leaflet fully**: Ensure all required methods are mocked
3. **Test error boundaries**: Verify error states are displayed correctly
4. **Clean up after tests**: Restore original objects (like `window.location`) after mocking
5. **Verify asynchronous operations**: Use `await` and `findByText` for async assertions
6. **Handle environment-specific behavior**: Test development vs. production differences

## Common Test Patterns

### Testing Geolocation Success

```javascript
it('handles successful geolocation', async () => {
  // Mock successful geolocation
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success) => {
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      }
    });
  });

  render(<MeetNowApp />);
  
  // Verify loading state is shown initially
  expect(screen.getByText('Finding your location...')).toBeInTheDocument();
  
  // Verify successful location update
  const locationElement = await screen.findByText(/Your Location/i);
  expect(locationElement).toBeInTheDocument();
});
```

### Testing Geolocation Error

```javascript
it('handles geolocation errors gracefully', async () => {
  // Mock geolocation error
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
    error({ code: 1, message: 'User denied geolocation' });
  });

  render(<MeetNowApp />);
  
  // Check for error message
  const errorElement = await screen.findByText('Something went wrong');
  expect(errorElement).toBeInTheDocument();
});
```

## Conclusion

Testing location-based components requires careful mocking of browser APIs and handling of asynchronous operations. By following these practices, you can ensure reliable and maintainable tests for the MeetNow application's map and geolocation features. 