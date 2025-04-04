import { LocationHistoryError } from '../../types/errors';
import type { GeolocationPosition } from '../../types/geolocation';
import { LocationHistoryService } from '../LocationHistoryService';

describe('LocationHistoryService', () => {
  let historyService: LocationHistoryService;
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
    historyService = new LocationHistoryService();
  });

  describe('addEntry', () => {
    it('should add a new entry', () => {
      historyService.addEntry(mockPosition, 'gps');
      const entries = historyService.getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].position).toEqual(mockPosition);
    });

    it('should not add entries that are too close together', () => {
      const closePosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7749 + 0.0001,
          longitude: -122.4194 + 0.0001,
        },
      };
      historyService.addEntry(mockPosition, 'gps');
      historyService.addEntry(closePosition, 'gps');
      expect(historyService.getEntries().length).toBe(1);
    });

    it('should not add entries that are too old', () => {
      const oldPosition: GeolocationPosition = {
        ...mockPosition,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours old
      };
      historyService.addEntry(oldPosition, 'gps');
      expect(historyService.getEntries().length).toBe(0);
    });

    it('should throw error when max entries reached', () => {
      const options = { maxEntries: 1 };
      historyService = new LocationHistoryService(options);

      historyService.addEntry(mockPosition, 'gps');
      const pos2: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7833,
          longitude: -122.4167,
        },
      };

      expect(() => historyService.addEntry(pos2, 'gps')).toThrow(LocationHistoryError);
    });
  });

  describe('getEntries', () => {
    it('should return all entries in chronological order', () => {
      const positions = [
        { ...mockPosition, timestamp: Date.now() - 2000 },
        { ...mockPosition, timestamp: Date.now() - 1000 },
        { ...mockPosition, timestamp: Date.now() },
      ];
      positions.forEach(pos => historyService.addEntry(pos, 'gps'));
      const entries = historyService.getEntries();
      expect(entries.length).toBe(3);
      expect(entries[0].timestamp).toBeLessThan(entries[1].timestamp);
      expect(entries[1].timestamp).toBeLessThan(entries[2].timestamp);
    });
  });

  describe('getRecentEntries', () => {
    it('should return the most recent entries', () => {
      const positions = [
        { ...mockPosition, timestamp: Date.now() - 2000 },
        { ...mockPosition, timestamp: Date.now() - 1000 },
        { ...mockPosition, timestamp: Date.now() },
      ];
      positions.forEach(pos => historyService.addEntry(pos, 'gps'));
      const recent = historyService.getRecentEntries(2);
      expect(recent.length).toBe(2);
      expect(recent[0].timestamp).toBeGreaterThan(recent[1].timestamp);
    });
  });

  describe('getEntriesInRange', () => {
    it('should return entries within specified distance', () => {
      const positions = [
        {
          ...mockPosition,
          coords: { ...mockPosition.coords, latitude: 37.7749, longitude: -122.4194 },
        },
        {
          ...mockPosition,
          coords: { ...mockPosition.coords, latitude: 37.775, longitude: -122.4195 },
        },
        {
          ...mockPosition,
          coords: { ...mockPosition.coords, latitude: 37.776, longitude: -122.42 },
        },
      ];
      positions.forEach(pos => historyService.addEntry(pos, 'gps'));
      const entries = historyService.getEntriesInRange(37.7749, -122.4194, 100);
      expect(entries.length).toBe(2);
      expect(entries[0].position.coords.latitude).toBe(37.7749);
      expect(entries[1].position.coords.latitude).toBe(37.775);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      historyService.addEntry(mockPosition, 'gps');
      historyService.clear();
      expect(historyService.getEntries().length).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove entries older than maxAge', () => {
      const options = { maxAge: 1000 }; // 1 second
      historyService = new LocationHistoryService(options);

      const oldPosition: GeolocationPosition = {
        ...mockPosition,
        timestamp: Date.now() - 2000, // 2 seconds old
      };
      historyService.addEntry(oldPosition, 'gps');

      // Wait for cleanup
      jest.advanceTimersByTime(2000);

      expect(historyService.getEntries().length).toBe(0);
    });
  });
});
