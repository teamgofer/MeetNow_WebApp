# Location Format Standardization Guide

## Overview

This document defines the standard location format used throughout the MeetNow application. Consistent location format is critical for reliable application behavior, especially for map navigation, distance calculations, and geocoding operations.

## Standard Format

All location data within the MeetNow application **must** use the following format:

```javascript
{
  lat: Number,  // Latitude as a number
  lng: Number,  // Longitude as a number
  // Optional additional properties
  display_name: String, // Human-readable location name
  address: Object       // Detailed address components
}
```

## Key Requirements

1. **Property Names**:
   - Always use `lat` (not "latitude") for latitude
   - Always use `lng` (not "longitude" or "lon") for longitude

2. **Data Types**:
   - Coordinates must be numeric values (not strings)
   - Values must be valid geographic coordinates:
     - Latitude: -90 to 90
     - Longitude: -180 to 180

3. **Consistency**:
   - This format applies to ALL location objects throughout the application
   - Including user locations, selected locations, meetup locations, etc.

## Converting from Other Formats

### Browser Geolocation API

The browser's `navigator.geolocation` API uses a different format. Always convert to our standard format:

```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    // Convert to standard format
    const standardLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    // Now use the standardized location object
    setLocation(standardLocation);
  }
);
```

### External APIs

When receiving location data from external APIs or libraries, always normalize to our standard format before using in the application:

```javascript
// Example: Converting data from a hypothetical weather API
function getWeatherData(location) {
  // Convert to standard format if needed
  const standardLocation = {
    lat: location.lat || location.latitude,
    lng: location.lng || location.longitude || location.lon
  };
  
  // Call API with standardized format
  return fetch(`${API_URL}?lat=${standardLocation.lat}&lng=${standardLocation.lng}`);
}
```

## Validation

Always validate location objects before using them for critical operations:

```javascript
function isValidLocation(location) {
  return (
    location &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180
  );
}
```

## Common Pitfalls to Avoid

1. **Mixing Format Standards**:
   - ❌ `{ latitude: 37.7749, longitude: -122.4194 }`
   - ❌ `{ lat: 37.7749, lon: -122.4194 }`
   - ✅ `{ lat: 37.7749, lng: -122.4194 }`

2. **String Values Instead of Numbers**:
   - ❌ `{ lat: "37.7749", lng: "-122.4194" }`
   - ✅ `{ lat: 37.7749, lng: -122.4194 }`

3. **Inconsistent Property Access**:
   - ❌ `navigateTo(location.latitude, location.longitude);`
   - ✅ `navigateTo({ lat: location.lat, lng: location.lng });`

4. **Format Conversion in Multiple Places**:
   - ❌ Creating converters spread across the codebase
   - ✅ Converting at data entry points only

## Integration with Map Libraries

The `{lat, lng}` format is compatible with Leaflet, our mapping library:

```javascript
// Leaflet accepts [lat, lng] arrays for points
map.setView([location.lat, location.lng], zoom);

// For markers
const marker = L.marker([location.lat, location.lng]).addTo(map);
```

## Historical Context

The application previously supported multiple location formats which caused bugs and inconsistencies. As of version 2.0, we standardized on the `{lat, lng}` format for all location data to improve reliability and reduce complexity. 