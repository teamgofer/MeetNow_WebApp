import {
  calculateDistance,
  isLocationWithinRadius,
  isValidLocation,
  formatLocation,
  parseLocation,
  getUserRegion
} from '../../utils/locationUtils';
import { describe, it, expect } from 'vitest';

describe('locationUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points accurately', () => {
      const point1 = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
      const point2 = { latitude: 37.7833, longitude: -122.4167 }; // ~1km away
      
      const distance = calculateDistance(point1, point2);
      
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(800); // At least 800 meters
      expect(distance).toBeLessThan(1200); // Less than 1.2km
    });
    
    it('should handle short distances accurately', () => {
      const point1 = { latitude: 37.7749, longitude: -122.4194 };
      const point2 = { latitude: 37.7750, longitude: -122.4195 }; // Very close
      
      const distance = calculateDistance(point1, point2);
      
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(200); // Less than 200 meters
    });
    
    it('should return null for invalid inputs', () => {
      expect(calculateDistance(null, { latitude: 0, longitude: 0 })).toBeNull();
      expect(calculateDistance({ latitude: 0, longitude: 0 }, null)).toBeNull();
      expect(calculateDistance({ lat: 0, lng: 0 }, { latitude: 0, longitude: 0 })).toBeNull();
    });
  });
  
  describe('isLocationWithinRadius', () => {
    const centerLocation = { latitude: 37.7749, longitude: -122.4194 };
    
    it('should return true for locations within the radius', () => {
      const nearbyLocation = { latitude: 37.7750, longitude: -122.4195 };
      
      const result = isLocationWithinRadius(nearbyLocation, centerLocation, 0.5);
      expect(result).toBe(true);
    });
    
    it('should return false for locations outside the radius', () => {
      const farLocation = { latitude: 37.8044, longitude: -122.2712 };
      
      const result = isLocationWithinRadius(farLocation, centerLocation, 1);
      expect(result).toBe(false);
    });
    
    it('should handle edge cases at exactly the radius distance', () => {
      // Create a point that should be exactly 1km away
      const edgeLocation = { latitude: 37.7839, longitude: -122.4194 };
      
      expect(isLocationWithinRadius(edgeLocation, centerLocation, 1)).toBe(true);
      expect(isLocationWithinRadius(edgeLocation, centerLocation, 0.9)).toBe(false);
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
    
    it('should return null if no regions provided', () => {
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      
      expect(getUserRegion(userLocation, [])).toBeNull();
      expect(getUserRegion(userLocation, null)).toBeNull();
      expect(getUserRegion(userLocation, undefined)).toBeNull();
    });
    
    it('should return null for invalid user location', () => {
      const regions = [
        { id: 'sf', name: 'San Francisco', location: { latitude: 37.7749, longitude: -122.4194 } }
      ];
      
      expect(getUserRegion(null, regions)).toBeNull();
      expect(getUserRegion(undefined, regions)).toBeNull();
      expect(getUserRegion({ lat: 37.7749, lng: -122.4194 }, regions)).toBeNull();
    });
  });
}); 