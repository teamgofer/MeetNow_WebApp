import {
  calculateDistance,
  isLocationWithinRadius,
  isValidLocation,
  formatLocation,
  parseLocation,
  getUserRegion
} from '../../utils/locationUtils';

describe('locationUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points accurately', () => {
      // San Francisco
      const location1 = { latitude: 37.7749, longitude: -122.4194 };
      // Los Angeles
      const location2 = { latitude: 34.0522, longitude: -118.2437 };
      
      // The distance between SF and LA is roughly 550-560 km
      const distance = calculateDistance(location1, location2);
      
      // Check within expected range (allowing for slight variation due to calculation method)
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(600);
    });
    
    it('should return 0 for identical locations', () => {
      const location = { latitude: 37.7749, longitude: -122.4194 };
      
      const distance = calculateDistance(location, location);
      
      expect(distance).toBe(0);
    });
    
    it('should handle short distances accurately', () => {
      // Two points in the same city, 500 meters apart
      const location1 = { latitude: 37.7749, longitude: -122.4194 };
      const location2 = { latitude: 37.7794, longitude: -122.4200 };
      
      const distance = calculateDistance(location1, location2);
      
      // Should be roughly 0.5 km
      expect(distance).toBeGreaterThan(0.4);
      expect(distance).toBeLessThan(0.6);
    });
    
    it('should return null for invalid locations', () => {
      const validLocation = { latitude: 37.7749, longitude: -122.4194 };
      const invalidLocation = { lat: 34.0522, lng: -118.2437 }; // Wrong property names
      
      expect(calculateDistance(validLocation, null)).toBeNull();
      expect(calculateDistance(null, validLocation)).toBeNull();
      expect(calculateDistance(validLocation, invalidLocation)).toBeNull();
      expect(calculateDistance(invalidLocation, validLocation)).toBeNull();
    });
  });
  
  describe('isLocationWithinRadius', () => {
    // SF coordinates
    const centerLocation = { latitude: 37.7749, longitude: -122.4194 };
    
    it('should return true for locations within the radius', () => {
      // Location 2km away from SF
      const nearbyLocation = { latitude: 37.7930, longitude: -122.4161 };
      
      expect(isLocationWithinRadius(nearbyLocation, centerLocation, 3)).toBe(true);
    });
    
    it('should return false for locations outside the radius', () => {
      // Oakland coordinates, ~12km from SF
      const farLocation = { latitude: 37.8044, longitude: -122.2712 };
      
      expect(isLocationWithinRadius(farLocation, centerLocation, 10)).toBe(false);
    });
    
    it('should handle edge cases at exactly the radius distance', () => {
      // Create a point that's exactly 5km away (approximate)
      const edgeLocation = { latitude: 37.8196, longitude: -122.4785 };
      
      // Should be included when the radius is exactly 5km or greater
      expect(isLocationWithinRadius(edgeLocation, centerLocation, 5)).toBe(true);
      expect(isLocationWithinRadius(edgeLocation, centerLocation, 4.9)).toBe(false);
    });
    
    it('should return false for invalid locations', () => {
      expect(isLocationWithinRadius(null, centerLocation, 10)).toBe(false);
      expect(isLocationWithinRadius(centerLocation, null, 10)).toBe(false);
      expect(isLocationWithinRadius({ lat: 37.7749, lng: -122.4194 }, centerLocation, 10)).toBe(false);
    });
    
    it('should always return true when radius is 0 and locations are identical', () => {
      expect(isLocationWithinRadius(centerLocation, centerLocation, 0)).toBe(true);
    });
  });
  
  describe('isValidLocation', () => {
    it('should return true for valid locations', () => {
      expect(isValidLocation({ latitude: 37.7749, longitude: -122.4194 })).toBe(true);
      expect(isValidLocation({ latitude: 0, longitude: 0 })).toBe(true);
      expect(isValidLocation({ latitude: 90, longitude: 180 })).toBe(true);
      expect(isValidLocation({ latitude: -90, longitude: -180 })).toBe(true);
    });
    
    it('should return false for invalid locations', () => {
      expect(isValidLocation(null)).toBe(false);
      expect(isValidLocation(undefined)).toBe(false);
      expect(isValidLocation({})).toBe(false);
      expect(isValidLocation({ lat: 37.7749, lng: -122.4194 })).toBe(false);
      expect(isValidLocation({ latitude: '37.7749', longitude: '-122.4194' })).toBe(false);
      expect(isValidLocation({ latitude: 91, longitude: -122.4194 })).toBe(false);
      expect(isValidLocation({ latitude: 37.7749, longitude: 181 })).toBe(false);
      expect(isValidLocation({ latitude: -91, longitude: -122.4194 })).toBe(false);
      expect(isValidLocation({ latitude: 37.7749, longitude: -181 })).toBe(false);
    });
  });
  
  describe('formatLocation', () => {
    it('should format location object to string', () => {
      const location = { latitude: 37.7749, longitude: -122.4194 };
      
      expect(formatLocation(location)).toBe('37.7749,-122.4194');
    });
    
    it('should handle decimal precision', () => {
      const location = { latitude: 37.7749283, longitude: -122.4194156 };
      
      expect(formatLocation(location, 2)).toBe('37.77,-122.42');
      expect(formatLocation(location, 4)).toBe('37.7749,-122.4194');
      expect(formatLocation(location, 6)).toBe('37.774928,-122.419416');
    });
    
    it('should return empty string for invalid locations', () => {
      expect(formatLocation(null)).toBe('');
      expect(formatLocation(undefined)).toBe('');
      expect(formatLocation({})).toBe('');
      expect(formatLocation({ lat: 37.7749, lng: -122.4194 })).toBe('');
    });
  });
  
  describe('parseLocation', () => {
    it('should parse location string to object', () => {
      const locationStr = '37.7749,-122.4194';
      
      const result = parseLocation(locationStr);
      
      expect(result).toEqual({ latitude: 37.7749, longitude: -122.4194 });
    });
    
    it('should handle whitespace in string', () => {
      const locationStr = ' 37.7749, -122.4194 ';
      
      const result = parseLocation(locationStr);
      
      expect(result).toEqual({ latitude: 37.7749, longitude: -122.4194 });
    });
    
    it('should return null for invalid strings', () => {
      expect(parseLocation('')).toBeNull();
      expect(parseLocation('37.7749')).toBeNull();
      expect(parseLocation('37.7749,-122.4194,10')).toBeNull();
      expect(parseLocation('latitude,longitude')).toBeNull();
    });
    
    it('should return null for non-string inputs', () => {
      expect(parseLocation(null)).toBeNull();
      expect(parseLocation(undefined)).toBeNull();
      expect(parseLocation(123)).toBeNull();
      expect(parseLocation({})).toBeNull();
    });
  });
  
  describe('getUserRegion', () => {
    it('should return the closest region to user location', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 }; // SF
      
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } },
        { id: 'oak', name: 'Oakland', location: { latitude: 37.8044, longitude: -122.2712 } },
        { id: 'sj', name: 'San Jose', location: { latitude: 37.3382, longitude: -121.8863 } }
      ];
      
      const result = getUserRegion(userLocation, regions);
      
      expect(result.id).toBe('sf');
    });
    
    it('should return the closest region within max radius', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 }; // SF
      
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } },
        { id: 'oak', name: 'Oakland', location: { latitude: 37.8044, longitude: -122.2712 } },
        { id: 'sj', name: 'San Jose', location: { latitude: 37.3382, longitude: -121.8863 } }
      ];
      
      // With a 5km radius, only SF should be within range
      const result = getUserRegion(userLocation, regions, 5);
      
      expect(result.id).toBe('sf');
      
      // With a 15km radius, Oakland should also be within range, but SF is closer
      const result2 = getUserRegion(userLocation, regions, 15);
      
      expect(result2.id).toBe('sf');
    });
    
    it('should return null when no regions are within radius', () => {
      const userLocation = { latitude: 34.0522, longitude: -118.2437 }; // LA
      
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } },
        { id: 'oak', name: 'Oakland', location: { latitude: 37.8044, longitude: -122.2712 } }
      ];
      
      // With a 100km radius, no regions should be within range from LA
      const result = getUserRegion(userLocation, regions, 100);
      
      expect(result).toBeNull();
    });
    
    it('should return null for invalid inputs', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } }
      ];
      
      expect(getUserRegion(null, regions)).toBeNull();
      expect(getUserRegion(userLocation, null)).toBeNull();
      expect(getUserRegion(userLocation, [])).toBeNull();
    });
    
    it('should handle regions with missing location data', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 }; // SF
      
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } },
        { id: 'oak', name: 'Oakland' }, // Missing location
        { id: 'sj', name: 'San Jose', location: { latitude: 37.3382, longitude: -121.8863 } }
      ];
      
      const result = getUserRegion(userLocation, regions);
      
      // Should ignore the region with missing location and return the closest valid one
      expect(result.id).toBe('sf');
    });
  });
}); 