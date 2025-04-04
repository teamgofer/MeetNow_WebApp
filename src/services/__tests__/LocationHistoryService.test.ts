import type { GeolocationPosition } from '../../features/proximity-chat/types/geolocation';
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
      },
      timestamp: Date.now(),
    }),
  };

  beforeEach(() => {
    historyService = new LocationHistoryService();
  });

  describe('addEntry', () => {
    it('should add a new entry', () => {
      historyService.addEntry(mockPosition);
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
      historyService.addEntry(mockPosition);
      historyService.addEntry(closePosition);
      expect(historyService.getEntries().length).toBe(1);
    });

    it('should not add entries that are too old', () => {
      const oldPosition: GeolocationPosition = {
        ...mockPosition,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours old
      };
      historyService.addEntry(oldPosition);
      expect(historyService.getEntries().length).toBe(0);
    });
  });

  describe('getEntries', () => {
    it('should return all entries in chronological order', () => {
      const positions = [
        { ...mockPosition, timestamp: Date.now() - 2000 },
        { ...mockPosition, timestamp: Date.now() - 1000 },
        { ...mockPosition, timestamp: Date.now() },
      ];
      positions.forEach(pos => historyService.addEntry(pos));
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
      positions.forEach(pos => historyService.addEntry(pos));
      const recent = historyService.getRecentEntries(2);
      expect(recent.length).toBe(2);
      expect(recent[0].timestamp).toBeGreaterThan(recent[1].timestamp);
    });
  });

  describe('getEntriesInRange', () => {
    it('should return entries within the specified time range', () => {
      const now = Date.now();
      const positions = [
        { ...mockPosition, timestamp: now - 3000 },
        { ...mockPosition, timestamp: now - 2000 },
        { ...mockPosition, timestamp: now - 1000 },
        { ...mockPosition, timestamp: now },
      ];
      positions.forEach(pos => historyService.addEntry(pos));
      const entries = historyService.getEntriesInRange(now - 2500, now - 500);
      expect(entries.length).toBe(2);
      expect(entries[0].timestamp).toBeGreaterThanOrEqual(now - 2500);
      expect(entries[1].timestamp).toBeLessThanOrEqual(now - 500);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      historyService.addEntry(mockPosition);
      historyService.clear();
      expect(historyService.getEntries().length).toBe(0);
    });
  });
});
