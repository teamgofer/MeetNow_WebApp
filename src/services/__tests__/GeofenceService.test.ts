import type { Geofence } from '../../features/proximity-chat/types/geofence';
import type { GeolocationPosition } from '../../features/proximity-chat/types/geolocation';
import { GeofenceService } from '../GeofenceService';

describe('GeofenceService', () => {
  let geofenceService: GeofenceService;
  const mockGeofence: Geofence = {
    id: 'test-geofence',
    name: 'Test Geofence',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 1000, // 1km
    onEnter: jest.fn(),
    onExit: jest.fn(),
    onDwell: jest.fn(),
  };

  beforeEach(() => {
    geofenceService = new GeofenceService();
    jest.clearAllMocks();
  });

  describe('addGeofence', () => {
    it('should add a geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.getActiveGeofences()).toContain(mockGeofence);
    });

    it('should not add duplicate geofences', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.getActiveGeofences().length).toBe(1);
    });
  });

  describe('removeGeofence', () => {
    it('should remove a geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.removeGeofence(mockGeofence.id);
      expect(geofenceService.getActiveGeofences()).not.toContain(mockGeofence);
    });

    it('should not throw when removing non-existent geofence', () => {
      expect(() => geofenceService.removeGeofence('non-existent')).not.toThrow();
    });
  });

  describe('updateLocation', () => {
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
        },
        timestamp: Date.now(),
      }),
    };

    it('should trigger enter event when entering geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(mockPosition);
      expect(mockGeofence.onEnter).toHaveBeenCalled();
    });

    it('should trigger exit event when leaving geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(mockPosition);
      const outsidePosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 38.7749,
          longitude: -123.4194,
        },
      };
      geofenceService.updateLocation(outsidePosition);
      expect(mockGeofence.onExit).toHaveBeenCalled();
    });

    it('should trigger dwell event after dwelling time', () => {
      jest.useFakeTimers();
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(mockPosition);
      jest.advanceTimersByTime(6000); // Advance past dwell time
      expect(mockGeofence.onDwell).toHaveBeenCalledWith(5000);
      jest.useRealTimers();
    });
  });

  describe('isInsideAnyGeofence', () => {
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
        },
        timestamp: Date.now(),
      }),
    };

    it('should return true when inside a geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.isInsideAnyGeofence(mockPosition)).toBe(true);
    });

    it('should return false when outside all geofences', () => {
      const outsidePosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 38.7749,
          longitude: -123.4194,
        },
      };
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.isInsideAnyGeofence(outsidePosition)).toBe(false);
    });
  });
});
