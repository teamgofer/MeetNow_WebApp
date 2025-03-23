# Region-Aware Feature Implementation Guide

This guide provides step-by-step instructions for developers who need to implement region-aware features in the MeetNow platform.

## Overview

The MeetNow platform uses a region-based feature availability system to:

1. Support phased feature rollouts to specific geographic areas
2. Enable location-specific features and experiences
3. Adapt content based on user location
4. Support A/B testing of features in specific regions

## Basic Implementation

### 1. Making a Component Region-Aware

To make any component region-aware, wrap it with the `RegionAwareFeatures` component:

```jsx
import RegionAwareFeatures from '../components/RegionAwareFeatures';
import MyFeatureComponent from './MyFeatureComponent';

const RegionAwareFeatureExample = () => {
  return (
    <RegionAwareFeatures 
      requiredCategory="my_feature_category" 
      requiredFeature="specific_feature"
      fallback={<ComingSoonMessage />}
    >
      <MyFeatureComponent />
    </RegionAwareFeatures>
  );
};
```

The `RegionAwareFeatures` component will:
1. Get the user's current location
2. Check if the required feature is available at that location
3. Render the wrapped component if the feature is available
4. Render the fallback component if the feature is not available

### 2. Required Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| `requiredCategory` | string | Feature category to check (e.g., "real_estate") | Yes |
| `requiredFeature` | string | Specific feature to check (e.g., "property_marketplace") | No |
| `fallback` | ReactNode | Component to render if feature is unavailable | No |
| `children` | ReactNode | Component to render if feature is available | Yes |

If `requiredFeature` is not provided, the component will only check if the category is enabled.

### 3. Custom Fallback Components

You can create custom fallback components to show when a feature is not available:

```jsx
const ComingSoonMessage = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
    <h3 className="text-amber-800 font-semibold">Coming Soon!</h3>
    <p className="text-amber-700">
      This feature is not yet available in your area, but we're working on it!
    </p>
    <button className="mt-2 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
      Get Notified When Available
    </button>
  </div>
);
```

## Advanced Implementation

### 1. Server-Side Region Checking

For server-side operations or API routes, you can check feature availability directly:

```javascript
// In an API route handler
export default async function handler(req, res) {
  const { lat, lng } = req.body;
  
  // Early validation
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }
  
  // Check feature availability
  const { data, error } = await supabase.rpc('check_feature_availability', {
    lat,
    lng,
    feature_category: 'real_estate',
    feature_name: 'property_marketplace'
  });
  
  if (error) {
    console.error('Error checking feature availability:', error);
    return res.status(500).json({ error: 'Failed to check feature availability' });
  }
  
  if (!data) {
    return res.status(403).json({ 
      error: 'Feature not available in this location',
      available: false
    });
  }
  
  // Proceed with feature-specific logic
  // ...
  
  return res.status(200).json({ success: true, data: result });
}
```

### 2. Getting All Available Features

You can retrieve all features available at a location:

```javascript
const { data, error } = await supabase.rpc('get_available_features', {
  lat: userLocation.lat,
  lng: userLocation.lng
});

if (!error && data) {
  console.log('Available features:', data.features);
  console.log('Region:', data.region_name);
}
```

### 3. Handling Geolocation Errors

Always implement proper error handling for geolocation:

```jsx
useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success case
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Error case
        console.error('Geolocation error:', error);
        setGeolocationError(true);
        
        // Fall back to IP-based location or default location
        fetchIPBasedLocation()
          .then(ipLocation => {
            if (ipLocation) {
              setUserLocation(ipLocation);
            } else {
              // Use default location (e.g., Los Angeles)
              setUserLocation({ lat: 34.0522, lng: -118.2437 });
            }
          });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    // Browser doesn't support geolocation
    setGeolocationError(true);
    setGeolocationSupported(false);
  }
}, []);
```

## Best Practices

### 1. Performance Optimization

Avoid excessive location checks:

```jsx
// Store location in context to avoid multiple checks
import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Get location once at the top level
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
        }
      );
    } else {
      setError(new Error('Geolocation not supported'));
      setLoading(false);
    }
  }, []);
  
  return (
    <LocationContext.Provider value={{ location, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
```

Then use this context in components:

```jsx
const MyComponent = () => {
  const { location, loading, error } = useLocation();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <LocationError error={error} />;
  
  // Use location data
  return <div>Your location: {location.lat}, {location.lng}</div>;
};
```

### 2. Caching Feature Availability

Cache feature availability results to reduce database queries:

```jsx
import { useState, useEffect, useCallback } from 'react';

const useFeatureAvailability = (category, feature, location) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create cache key
  const cacheKey = `feature_${category}_${feature}_${location?.lat}_${location?.lng}`;
  
  const checkAvailability = useCallback(async () => {
    if (!location) return;
    
    // Check cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setIsAvailable(JSON.parse(cached));
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('check_feature_availability', {
        lat: location.lat,
        lng: location.lng,
        feature_category: category,
        feature_name: feature
      });
      
      if (error) throw error;
      
      setIsAvailable(!!data);
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify(!!data));
    } catch (err) {
      setError(err);
      console.error('Error checking feature availability:', err);
    } finally {
      setLoading(false);
    }
  }, [category, feature, location, cacheKey]);
  
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);
  
  return { isAvailable, loading, error, refresh: checkAvailability };
};
```

### 3. Testing Region-Aware Features

Test with different locations:

```javascript
// Mock geolocation API for testing
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) => {
    // Los Angeles coordinates
    success({ coords: { latitude: 34.0522, longitude: -118.2437 } });
  })
};

// Apply mock
global.navigator.geolocation = mockGeolocation;

// Test component with different locations
test('shows feature in Los Angeles', () => {
  render(<MyRegionAwareFeature />);
  expect(screen.getByText('Feature Content')).toBeInTheDocument();
});

test('shows fallback outside enabled regions', () => {
  // Update mock to return coordinates outside enabled regions
  mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    // Middle of nowhere
    success({ coords: { latitude: 0, longitude: 0 } });
  });
  
  render(<MyRegionAwareFeature />);
  expect(screen.getByText('Coming Soon')).toBeInTheDocument();
});
```

## Examples

### Real Estate Feature Example

```jsx
import React from 'react';
import RegionAwareFeatures from '../components/RegionAwareFeatures';

const PropertyListingComponent = () => {
  // Property listing implementation
  return (
    <div className="property-listings">
      <h2>Available Properties</h2>
      {/* Property listing content */}
    </div>
  );
};

const ComingSoonFallback = () => (
  <div className="coming-soon">
    <h2>Real Estate Coming Soon</h2>
    <p>Our virtual property marketplace will be available in your area soon!</p>
    <button>Get notified when available</button>
  </div>
);

const RealEstateFeature = () => {
  return (
    <div className="container">
      <h1>Virtual Property Marketplace</h1>
      
      <RegionAwareFeatures
        requiredCategory="real_estate"
        requiredFeature="property_marketplace"
        fallback={<ComingSoonFallback />}
      >
        <PropertyListingComponent />
      </RegionAwareFeatures>
    </div>
  );
};

export default RealEstateFeature;
```

### Region-Aware API Route Example

```javascript
// pages/api/create-property.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, type, lat, lng, price, ownerId } = req.body;
  
  // Validate required parameters
  if (!name || !lat || !lng || !type || !ownerId) {
    return res.status(400).json({ 
      error: 'Missing required parameters' 
    });
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Check if real estate features are available at this location
    const { data: isAvailable, error: availabilityError } = await supabase.rpc(
      'check_feature_availability',
      { 
        lat, 
        lng, 
        feature_category: 'real_estate',
        feature_name: 'property_marketplace'
      }
    );
    
    if (availabilityError) {
      throw availabilityError;
    }
    
    if (!isAvailable) {
      return res.status(403).json({
        error: 'Property creation is not available in this location',
        code: 'FEATURE_NOT_AVAILABLE'
      });
    }
    
    // Create property using the function that checks region availability
    const { data: property, error: propertyError } = await supabase.rpc(
      'create_virtual_property',
      {
        owner_id: ownerId,
        property_name: name,
        property_type: type,
        lat,
        lng,
        base_value: price
      }
    );
    
    if (propertyError) {
      throw propertyError;
    }
    
    return res.status(200).json({
      success: true,
      property
    });
    
  } catch (error) {
    console.error('Error creating property:', error);
    return res.status(500).json({ 
      error: 'Failed to create property',
      details: error.message
    });
  }
}
```

## Debugging

### Console Logging for Debugging

Add these helpers to debug region availability issues:

```javascript
// utils/region-debugging.js
export const logRegionCheck = (location, category, feature, result) => {
  console.group('Region Availability Check');
  console.log('Location:', location);
  console.log('Category:', category);
  console.log('Feature:', feature);
  console.log('Available:', result);
  console.groupEnd();
};

export const debugRegion = async (lat, lng) => {
  try {
    const { data, error } = await supabase.rpc('get_available_features', {
      lat,
      lng
    });
    
    if (error) throw error;
    
    console.group('Region Debug Info');
    console.log('Coordinates:', { lat, lng });
    console.log('Region Name:', data.region_name);
    console.log('Country:', data.country_code);
    console.log('City:', data.city_name);
    console.log('Available Features:', data.features);
    console.groupEnd();
    
    return data;
  } catch (error) {
    console.error('Region debugging error:', error);
    return null;
  }
};
```

### Location Override for Testing

Create a way to override locations for testing:

```jsx
// Enable with URL parameter, e.g. ?override_location=34.0522,-118.2437
const useLocationWithOverride = () => {
  const [location, setLocation] = useState(null);
  
  useEffect(() => {
    // Check for location override in URL
    const params = new URLSearchParams(window.location.search);
    const overrideLocation = params.get('override_location');
    
    if (overrideLocation) {
      const [lat, lng] = overrideLocation.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('Using location override:', { lat, lng });
        setLocation({ lat, lng });
        return;
      }
    }
    
    // Otherwise use browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);
  
  return location;
};
```

## Deployment Considerations

1. **Database Migration**:
   - Ensure the `supported_regions` and `feature_rollout_schedule` tables exist
   - Verify PostgreSQL functions are deployed

2. **Geolocation Permissions**:
   - The site must be served over HTTPS for geolocation to work
   - Include appropriate privacy policy sections about location usage

3. **Error Handling**:
   - Implement proper fallbacks for when location is unavailable
   - Consider IP-based geolocation as a backup

4. **Performance**:
   - Monitor the performance impact of geographic queries
   - Consider implementing more caching if needed 