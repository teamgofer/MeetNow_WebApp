import { CacheService } from '../../../../utils/CacheService';
import { LocationCacheError } from '../../types/errors';
import type { GeolocationPosition } from '../../types/geolocation';
import { GeolocationCoordinates } from '../../types/geolocation';
import { LocationCacheService } from '../LocationCacheService';

jest.mock('../../../../utils/CacheService');

describe('LocationCacheService', () => {
  const mockPosition: GeolocationPosition = {
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      }),
    },
    timestamp: Date.now(),
    toJSON: () => ({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        }),
      },
      timestamp: Date.now(),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (CacheService.get as jest.Mock).mockReturnValue(null);
  });

  describe('loadCachedLocation', () => {
    it('should return empty cache when no cache exists', () => {
      const cache = LocationCacheService.loadCachedLocation();
      expect(cache).toEqual({
        timestamp: 0,
        location: null,
        maxAge: 300000,
        accuracy: null,
        source: null,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: 0,
        },
      });
    });

    it('should return cached location when valid cache exists', () => {
      const mockCache = {
        timestamp: Date.now(),
        location: mockPosition,
        maxAge: 300000,
        accuracy: 10,
        source: 'gps' as const,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: Date.now(),
        },
      };

      (CacheService.get as jest.Mock).mockReturnValue(mockCache);

      const cache = LocationCacheService.loadCachedLocation();
      expect(cache).toEqual(mockCache);
    });

    it('should return empty cache when cache is expired', () => {
      const mockCache = {
        timestamp: Date.now() - 400000, // 6.7 minutes old
        location: mockPosition,
        maxAge: 300000, // 5 minutes
        accuracy: 10,
        source: 'gps' as const,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: Date.now(),
        },
      };

      (CacheService.get as jest.Mock).mockReturnValue(mockCache);

      const cache = LocationCacheService.loadCachedLocation();
      expect(cache.location).toBeNull();
      expect(cache.timestamp).toBe(0);
    });
  });

  describe('saveToCache', () => {
    it('should save valid position to cache', () => {
      LocationCacheService.saveToCache(mockPosition, 'gps');
      expect(CacheService.set).toHaveBeenCalledWith(
        'locationCache',
        expect.objectContaining({
          location: mockPosition,
          source: 'gps',
          maxAge: 300000,
        })
      );
    });

    it('should throw error when saving invalid position', () => {
      const invalidPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 91, // Invalid latitude
        },
      };

      expect(() => LocationCacheService.saveToCache(invalidPosition, 'gps')).toThrow(
        LocationCacheError
      );
    });
  });

  describe('updateStats', () => {
    it('should update hit count when cache is hit', () => {
      const mockCache = {
        timestamp: Date.now(),
        location: mockPosition,
        maxAge: 300000,
        accuracy: 10,
        source: 'gps' as const,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: Date.now(),
        },
      };

      (CacheService.get as jest.Mock).mockReturnValue(mockCache);

      LocationCacheService.updateStats(true);
      expect(CacheService.set).toHaveBeenCalledWith(
        'locationCache',
        expect.objectContaining({
          stats: expect.objectContaining({
            hits: 1,
            misses: 0,
          }),
        })
      );
    });

    it('should update miss count when cache is missed', () => {
      const mockCache = {
        timestamp: Date.now(),
        location: mockPosition,
        maxAge: 300000,
        accuracy: 10,
        source: 'gps' as const,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: Date.now(),
        },
      };

      (CacheService.get as jest.Mock).mockReturnValue(mockCache);

      LocationCacheService.updateStats(false);
      expect(CacheService.set).toHaveBeenCalledWith(
        'locationCache',
        expect.objectContaining({
          stats: expect.objectContaining({
            hits: 0,
            misses: 1,
          }),
        })
      );
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      LocationCacheService.clearCache();
      expect(CacheService.remove).toHaveBeenCalledWith('locationCache');
    });

    it('should throw error when clearing cache fails', () => {
      (CacheService.remove as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to clear cache');
      });

      expect(() => LocationCacheService.clearCache()).toThrow(LocationCacheError);
    });
  });
});
