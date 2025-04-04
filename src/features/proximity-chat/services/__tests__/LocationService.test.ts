import { errorHandlingService } from '../../../../utils/ErrorHandlingService';
import { PerformanceMonitor } from '../../../../utils/PerformanceMonitor';
import {
  GeolocationNotSupportedError,
  GeolocationPermissionDeniedError,
  GeolocationPositionUnavailableError,
  GeolocationTimeoutError,
  LocationTrackingError,
} from '../../types/errors';
import type { Geofence } from '../../types/geofence';
import type { GeolocationPosition } from '../../types/geolocation';
import { LocationCacheService } from '../LocationCacheService';
import { LocationService } from '../locationService';

jest.mock('../LocationCacheService');
jest.mock('../../../../utils/PerformanceMonitor');
jest.mock('../../../../utils/ErrorHandlingService');

describe('LocationService', () => {
  let locationService: LocationService;
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
    locationService = new LocationService();
  });

  describe('startTracking', () => {
    it('should start tracking location successfully', async () => {
      const mockWatchId = 1;
      const mockGeolocation = {
        watchPosition: jest.fn().mockReturnValue(mockWatchId),
        clearWatch: jest.fn(),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      await locationService.startTracking();
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(PerformanceMonitor.trackOperationTiming).toHaveBeenCalled();
    });

    it('should throw error when geolocation is not supported', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
      });

      await expect(locationService.startTracking()).rejects.toThrow(GeolocationNotSupportedError);
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking location', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockReturnValue(1),
        clearWatch: jest.fn(),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      locationService['watchId'] = 1;
      locationService.stopTracking();
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return cached location when available and not expired', async () => {
      const mockCache = {
        location: mockPosition,
        timestamp: Date.now(),
        maxAge: 300000,
      };

      (LocationCacheService.loadCachedLocation as jest.Mock).mockReturnValue(mockCache);

      const location = await locationService.getCurrentLocation();
      expect(location).toEqual(mockPosition);
      expect(LocationCacheService.updateStats).toHaveBeenCalledWith(true);
    });

    it('should get fresh location when cache is expired', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation(success => success(mockPosition)),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      const mockCache = {
        location: mockPosition,
        timestamp: Date.now() - 400000,
        maxAge: 300000,
      };

      (LocationCacheService.loadCachedLocation as jest.Mock).mockReturnValue(mockCache);

      const location = await locationService.getCurrentLocation();
      expect(location).toEqual(mockPosition);
      expect(LocationCacheService.updateStats).toHaveBeenCalledWith(false);
    });

    it('should handle geolocation errors', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((success, error) => {
          error({ code: 1, message: 'Permission denied' });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      await expect(locationService.getCurrentLocation()).rejects.toThrow(
        GeolocationPermissionDeniedError
      );
    });
  });

  describe('event handling', () => {
    it('should emit location change events', () => {
      const mockCallback = jest.fn();
      locationService.onLocationChange(mockCallback);
      locationService['_notifyLocation'](mockPosition);
      expect(mockCallback).toHaveBeenCalledWith(mockPosition);
    });

    it('should emit error events', () => {
      const mockCallback = jest.fn();
      const mockError = new Error('Test error');
      locationService.onError(mockCallback);
      locationService['_notifyError'](mockError);
      expect(mockCallback).toHaveBeenCalledWith(mockError);
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      locationService.onLocationChange(mockCallback);
      locationService.offLocationChange(mockCallback);
      locationService['_notifyLocation'](mockPosition);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle different types of geolocation errors', () => {
      const errorCases = [
        { code: 1, message: 'Permission denied', expectedError: GeolocationPermissionDeniedError },
        {
          code: 2,
          message: 'Position unavailable',
          expectedError: GeolocationPositionUnavailableError,
        },
        { code: 3, message: 'Timeout', expectedError: GeolocationTimeoutError },
        { code: 0, message: 'Unknown error', expectedError: LocationTrackingError },
      ];

      errorCases.forEach(({ code, message, expectedError }) => {
        locationService['_handlePositionError']({ code, message } as GeolocationPositionError);
        expect(errorHandlingService.handleError).toHaveBeenCalledWith(expect.any(expectedError));
      });
    });

    it('should retry tracking on error up to max retries', () => {
      const mockGeolocation = {
        watchPosition: jest.fn().mockImplementation((success, error) => {
          error({ code: 1, message: 'Permission denied' });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      locationService.startTracking();
      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
    });
  });

  describe('location information methods', () => {
    it('should get current speed', () => {
      const mockPositionWithSpeed = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          speed: 5.5,
        },
      };
      locationService['lastLocation'] = mockPositionWithSpeed;
      expect(locationService.getCurrentSpeed()).toBe(5.5);
    });

    it('should get current heading', () => {
      const mockPositionWithHeading = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          heading: 90,
        },
      };
      locationService['lastLocation'] = mockPositionWithHeading;
      expect(locationService.getCurrentHeading()).toBe(90);
    });

    it('should get current accuracy', () => {
      const mockPositionWithAccuracy = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          accuracy: 15,
        },
      };
      locationService['lastLocation'] = mockPositionWithAccuracy;
      expect(locationService.getCurrentAccuracy()).toBe(15);
    });

    it('should detect indoor location based on accuracy', () => {
      const mockPositionIndoors = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          accuracy: 150,
        },
      };
      locationService['lastLocation'] = mockPositionIndoors;
      expect(locationService.isIndoors()).toBe(true);
    });

    it('should detect outdoor location based on accuracy', () => {
      const mockPositionOutdoors = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          accuracy: 10,
        },
      };
      locationService['lastLocation'] = mockPositionOutdoors;
      expect(locationService.isIndoors()).toBe(false);
    });

    it('should get current altitude', () => {
      const mockPositionWithAltitude = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          altitude: 100,
        },
      };
      locationService['lastLocation'] = mockPositionWithAltitude;
      expect(locationService.getCurrentAltitude()).toBe(100);
    });

    it('should get current altitude accuracy', () => {
      const mockPositionWithAltitudeAccuracy = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          altitudeAccuracy: 5,
        },
      };
      locationService['lastLocation'] = mockPositionWithAltitudeAccuracy;
      expect(locationService.getCurrentAltitudeAccuracy()).toBe(5);
    });

    it('should return null for unavailable location data', () => {
      locationService['lastLocation'] = null;
      expect(locationService.getCurrentSpeed()).toBeNull();
      expect(locationService.getCurrentHeading()).toBeNull();
      expect(locationService.getCurrentAccuracy()).toBeNull();
      expect(locationService.getCurrentAltitude()).toBeNull();
      expect(locationService.getCurrentAltitudeAccuracy()).toBeNull();
      expect(locationService.isIndoors()).toBe(false);
    });
  });

  describe('Geofencing', () => {
    const mockGeofence: Geofence = {
      id: 'test-geofence',
      name: 'Test Geofence',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      onEnter: jest.fn(),
      onExit: jest.fn(),
      onDwell: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add and remove geofences', () => {
      locationService.addGeofence(mockGeofence);
      expect(locationService.getActiveGeofences()).toContainEqual(mockGeofence);

      locationService.removeGeofence(mockGeofence.id);
      expect(locationService.getActiveGeofences()).not.toContainEqual(mockGeofence);
    });

    it('should handle geofence events', () => {
      const enterCallback = jest.fn();
      const exitCallback = jest.fn();
      const dwellCallback = jest.fn();

      const removeEnter = locationService.onGeofenceEnter(enterCallback);
      const removeExit = locationService.onGeofenceExit(exitCallback);
      const removeDwell = locationService.onGeofenceDwell(dwellCallback);

      // Simulate geofence events
      locationService['_geofenceService'].emit('enter', mockGeofence);
      expect(enterCallback).toHaveBeenCalledWith(mockGeofence);

      locationService['_geofenceService'].emit('exit', mockGeofence);
      expect(exitCallback).toHaveBeenCalledWith(mockGeofence);

      locationService['_geofenceService'].emit('dwell', { geofence: mockGeofence, duration: 5000 });
      expect(dwellCallback).toHaveBeenCalledWith({ geofence: mockGeofence, duration: 5000 });

      // Test event handler removal
      removeEnter();
      removeExit();
      removeDwell();

      locationService['_geofenceService'].emit('enter', mockGeofence);
      expect(enterCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Location History', () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 5,
        toJSON: jest.fn(),
      },
      timestamp: Date.now(),
      toJSON: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add entries to history', () => {
      locationService['_handlePositionSuccess'](mockPosition);
      const history = locationService.getLocationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].position).toEqual(mockPosition);
    });

    it('should get recent history entries', () => {
      locationService['_handlePositionSuccess'](mockPosition);
      const recentHistory = locationService.getRecentHistory(60000); // Last minute
      expect(recentHistory).toHaveLength(1);
    });

    it('should get history entries in range', () => {
      locationService['_handlePositionSuccess'](mockPosition);
      const rangeHistory = locationService.getHistoryInRange(
        mockPosition.coords.latitude,
        mockPosition.coords.longitude,
        1000 // 1km radius
      );
      expect(rangeHistory).toHaveLength(1);
    });

    it('should clear history', () => {
      locationService['_handlePositionSuccess'](mockPosition);
      locationService.clearHistory();
      const history = locationService.getLocationHistory();
      expect(history).toHaveLength(0);
    });
  });
});
