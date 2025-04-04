import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { LocationService } from '../services/locationService';

// Mock the dependencies
vi.mock('../../../utils/EventEmitter', () => ({
  EventEmitter: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

vi.mock('../../../utils/ErrorHandlingService.js', () => ({
  ErrorHandlingService: {
    handleError: vi.fn(),
    registerRecoveryStrategy: vi.fn(),
    _errorCategories: {
      LOCATION: 'location',
      STORAGE: 'storage',
    },
  },
}));

vi.mock('../../../utils/CacheService.js', () => ({
  CacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../../utils/PerformanceMonitor.js', () => ({
  PerformanceMonitor: {
    trackError: vi.fn(),
    trackOperationTiming: vi.fn(),
  },
}));

describe('LocationService', () => {
  let locationService;
  let mockGeolocation;

  beforeEach(() => {
    // Mock geolocation API
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    global.navigator.geolocation = mockGeolocation;

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    locationService = new LocationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const lat1 = 37.7749;
      const lon1 = -122.4194;
      const lat2 = 37.7833;
      const lon2 = -122.4167;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      // Distance should be roughly 1km
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });

    it('should return zero for identical coordinates', () => {
      const lat = 37.7749;
      const lon = -122.4194;

      const distance = locationService.calculateDistance(lat, lon, lat, lon);
      expect(distance).toBe(0);
    });

    it('should calculate very small distances accurately', () => {
      const lat1 = 37.7749;
      const lon1 = -122.4194;
      const lat2 = 37.7749;
      const lon2 = -122.4195;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      // Should be very small (less than 0.1 km)
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(0.1);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location from geolocation API', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementationOnce(success => {
        success(mockPosition);
      });

      const location = await locationService.getCurrentLocation();

      expect(location).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      });
    });

    it('should reject when geolocation API returns error', async () => {
      const mockError = new Error('Geolocation error');

      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
        error(mockError);
      });

      await expect(locationService.getCurrentLocation()).rejects.toThrow('Geolocation error');
    });

    it('should use cached location if recent enough', async () => {
      const mockCachedLocation = {
        timestamp: Date.now(),
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        maxAge: 300000,
        accuracy: 10,
        source: 'cached',
      };

      // Mock CacheService to return valid cached location
      const { CacheService } = require('../../../utils/CacheService.js');
      CacheService.get.mockReturnValueOnce(mockCachedLocation);

      const location = await locationService.getCurrentLocation();

      expect(location).toEqual(mockCachedLocation.location);
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe('startTracking', () => {
    it('should start tracking location with watchPosition', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementationOnce(success => {
        success(mockPosition);
      });

      mockGeolocation.watchPosition.mockReturnValueOnce(123); // watchId

      await locationService.startTracking();

      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          maximumAge: 300000,
          timeout: 30000,
        })
      );
    });

    it('should handle geolocation not supported', async () => {
      delete global.navigator.geolocation;

      await expect(locationService.startTracking()).rejects.toThrow(
        'Geolocation is not supported by this browser'
      );
    });
  });

  describe('event handling', () => {
    it('should notify location change listeners', () => {
      const listener = vi.fn();
      locationService.onLocationChange(listener);

      const mockLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      };

      locationService._notifyLocation(mockLocation);

      expect(listener).toHaveBeenCalledWith(mockLocation);
    });

    it('should notify error listeners', () => {
      const listener = vi.fn();
      locationService.onError(listener);

      const mockError = new Error('Test error');
      locationService._notifyError(mockError);

      expect(listener).toHaveBeenCalledWith(mockError);
    });

    it('should remove specific listeners', () => {
      const listener = vi.fn();
      locationService.onLocationChange(listener);
      locationService.offLocationChange(listener);

      const mockLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      };

      locationService._notifyLocation(mockLocation);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
