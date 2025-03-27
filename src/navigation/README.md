# MeetNow Navigation System

This directory contains the navigation system for the MeetNow application, now simplified to focus on basic map navigation.

## Architecture

The navigation system is built around a core controller that manages the map state and navigation:

1. **MapNavigationController** - The main controller that provides the API for map navigation.
2. **View Components** - React components that visualize the navigation (e.g., VicinityIndicator).

## Key Features

- Simplified navigation focused on basic map movement
- Robust state management with validation
- Proper error handling and resilient operation
- Standardized location format using {lat, lng}
- Promise-based API for navigation operations

## Navigation Approach

The system now uses a single, simplified navigation approach:

- **Basic Map Navigation** - Allows setting user location and selected locations, with map centering and zoom control

## Basic Usage

```jsx
import MapNavigationController from '../utils/MapNavigationController';

// In your component
const mapRef = useRef(null);
const navigationController = useRef(null);

// Initialize the controller
useEffect(() => {
  if (!navigationController.current) {
    navigationController.current = new MapNavigationController({
      defaultZoom: 16,
      onReady: (isReady) => console.log(`Controller ready: ${isReady}`),
      onLocationChange: (location) => console.log('Location updated', location),
      onError: (error) => console.error('Controller error:', error)
    });
  }
  
  return () => {
    if (navigationController.current) {
      navigationController.current.dispose();
    }
  };
}, []);

// When map is ready
const handleMapReady = (map) => {
  if (navigationController.current) {
    navigationController.current.updateMapReference(mapRef);
  }
};

// Setting user location
useEffect(() => {
  if (navigationController.current && userLocation) {
    navigationController.current.setUserLocation({
      lat: userLocation.lat,
      lng: userLocation.lng
    });
  }
}, [userLocation]);

// Navigate to a location
const navigateToLocation = () => {
  if (navigationController.current && selectedLocation) {
    navigationController.current.navigateTo({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng
    }, {
      zoom: 16,
      animate: true
    })
    .then(success => {
      if (success) {
        console.log('Navigation successful');
      }
    })
    .catch(error => {
      console.error('Error navigating to location:', error);
    });
  }
};
```

## Location Format

The controller uses the standard {lat, lng} format for all locations:

```js
// Standard location format
const location = {
  lat: 37.7749,
  lng: -122.4194
};

navigationController.setUserLocation(location);
```

## Error Handling

The navigation system includes comprehensive error handling:

- Validation of locations before operations
- Promise-based API with proper rejection for invalid inputs
- Graceful fallbacks for navigation methods
- Detailed logging for debugging

## Guidelines for Working with the Navigation Controller

1. All location data should use the {lat, lng} format
2. Check for `navigationController.isReadyToNavigate()` before performing operations
3. Use `navigateTo()` as the primary method for map navigation
4. Handle promises appropriately with .then() and .catch()

The simplified approach ensures more consistent behavior and fewer edge cases. 