import { GeofenceError } from '../../types/errors';
import type { Geofence } from '../../types/geofence';
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

    it('should throw error for invalid radius', () => {
      const invalidGeofence: Geofence = {
        ...mockGeofence,
        radius: -1,
      };
      expect(() => geofenceService.addGeofence(invalidGeofence)).toThrow(GeofenceError);
    });

    it('should throw error for invalid coordinates', () => {
      const invalidGeofence: Geofence = {
        ...mockGeofence,
        latitude: 91,
        longitude: 181,
      };
      expect(() => geofenceService.addGeofence(invalidGeofence)).toThrow(GeofenceError);
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
    it('should trigger enter event when entering geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      expect(mockGeofence.onEnter).toHaveBeenCalled();
    });

    it('should trigger exit event when leaving geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      geofenceService.updateLocation(37.7833, -122.4167);
      expect(mockGeofence.onExit).toHaveBeenCalled();
    });

    it('should trigger dwell event after dwelling time', () => {
      jest.useFakeTimers();
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      jest.advanceTimersByTime(6000); // Advance past dwell time
      expect(mockGeofence.onDwell).toHaveBeenCalledWith(5000);
      jest.useRealTimers();
    });

    it('should not trigger events when monitoring is paused', () => {
      geofenceService.pauseMonitoring();
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      expect(mockGeofence.onEnter).not.toHaveBeenCalled();
    });
  });

  describe('pause and resume monitoring', () => {
    it('should pause monitoring', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.pauseMonitoring();
      geofenceService.updateLocation(37.7749, -122.4194);
      expect(mockGeofence.onEnter).not.toHaveBeenCalled();
    });

    it('should resume monitoring', () => {
      geofenceService.addGeofence(mockGeofence);
      geofenceService.pauseMonitoring();
      geofenceService.resumeMonitoring();
      geofenceService.updateLocation(37.7749, -122.4194);
      expect(mockGeofence.onEnter).toHaveBeenCalled();
    });

    it('should clear dwell timers when paused', () => {
      jest.useFakeTimers();
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      geofenceService.pauseMonitoring();
      jest.advanceTimersByTime(6000);
      expect(mockGeofence.onDwell).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('isInsideAnyGeofence', () => {
    it('should return true when inside a geofence', () => {
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.isInsideAnyGeofence(37.7749, -122.4194)).toBe(true);
    });

    it('should return false when outside all geofences', () => {
      geofenceService.addGeofence(mockGeofence);
      expect(geofenceService.isInsideAnyGeofence(37.7833, -122.4167)).toBe(false);
    });
  });

  describe('event handlers', () => {
    it('should handle enter events', () => {
      const enterHandler = jest.fn();
      geofenceService.onEnter(enterHandler);
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      expect(enterHandler).toHaveBeenCalledWith({ geofence: mockGeofence });
    });

    it('should handle exit events', () => {
      const exitHandler = jest.fn();
      geofenceService.onExit(exitHandler);
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      geofenceService.updateLocation(37.7833, -122.4167);
      expect(exitHandler).toHaveBeenCalledWith({ geofence: mockGeofence });
    });

    it('should handle dwell events', () => {
      const dwellHandler = jest.fn();
      geofenceService.onDwell(dwellHandler);
      geofenceService.addGeofence(mockGeofence);
      geofenceService.updateLocation(37.7749, -122.4194);
      jest.advanceTimersByTime(6000);
      expect(dwellHandler).toHaveBeenCalledWith({ geofence: mockGeofence, duration: 5000 });
    });
  });
});
