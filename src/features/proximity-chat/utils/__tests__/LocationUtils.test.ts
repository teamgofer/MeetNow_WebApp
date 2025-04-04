import { LocationValidationError } from '../../types/errors';
import type { GeolocationPosition } from '../../types/geolocation';
import { LocationUtils } from '../LocationUtils';

describe('LocationUtils', () => {
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

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = LocationUtils.calculateDistance(37.7749, -122.4194, 37.7833, -122.4167);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1000); // Less than 1km
    });

    it('should return 0 for same coordinates', () => {
      const distance = LocationUtils.calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });
  });

  describe('calculatePositionDistance', () => {
    it('should calculate distance between two positions', () => {
      const pos2: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7833,
          longitude: -122.4167,
        },
      };
      const distance = LocationUtils.calculatePositionDistance(mockPosition, pos2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1000); // Less than 1km
    });
  });

  describe('validatePosition', () => {
    it('should validate a valid position', () => {
      expect(() => LocationUtils.validatePosition(mockPosition)).not.toThrow();
    });

    it('should throw for invalid latitude', () => {
      const invalidPosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 91,
        },
      };
      expect(() => LocationUtils.validatePosition(invalidPosition)).toThrow(
        LocationValidationError
      );
    });

    it('should throw for invalid longitude', () => {
      const invalidPosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          longitude: 181,
        },
      };
      expect(() => LocationUtils.validatePosition(invalidPosition)).toThrow(
        LocationValidationError
      );
    });

    it('should throw for invalid accuracy', () => {
      const invalidPosition: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          accuracy: -1,
        },
      };
      expect(() => LocationUtils.validatePosition(invalidPosition)).toThrow(
        LocationValidationError
      );
    });

    it('should throw for invalid timestamp', () => {
      const invalidPosition: GeolocationPosition = {
        ...mockPosition,
        timestamp: 0,
      };
      expect(() => LocationUtils.validatePosition(invalidPosition)).toThrow(
        LocationValidationError
      );
    });
  });

  describe('hasMovedBeyondThreshold', () => {
    it('should return true for first position', () => {
      expect(LocationUtils.hasMovedBeyondThreshold(null, mockPosition, 10)).toBe(true);
    });

    it('should return true when moved beyond threshold', () => {
      const pos2: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7833,
          longitude: -122.4167,
        },
      };
      expect(LocationUtils.hasMovedBeyondThreshold(mockPosition, pos2, 100)).toBe(true);
    });

    it('should return false when within threshold', () => {
      const pos2: GeolocationPosition = {
        ...mockPosition,
        coords: {
          ...mockPosition.coords,
          latitude: 37.7749 + 0.0001,
          longitude: -122.4194 + 0.0001,
        },
      };
      expect(LocationUtils.hasMovedBeyondThreshold(mockPosition, pos2, 1000)).toBe(false);
    });
  });

  describe('positionToString and stringToPosition', () => {
    it('should convert position to string and back', () => {
      const str = LocationUtils.positionToString(mockPosition);
      expect(typeof str).toBe('string');
      expect(str).toContain(',');

      const pos = LocationUtils.stringToPosition(str);
      expect(pos.coords.latitude).toBe(mockPosition.coords.latitude);
      expect(pos.coords.longitude).toBe(mockPosition.coords.longitude);
    });

    it('should throw for invalid position string', () => {
      expect(() => LocationUtils.stringToPosition('invalid')).toThrow(LocationValidationError);
      expect(() => LocationUtils.stringToPosition('1,2,3')).toThrow(LocationValidationError);
    });
  });
});
