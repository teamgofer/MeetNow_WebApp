import { LocationValidationError } from '../types/errors';
import type { GeolocationPosition, GeolocationCoordinates } from '../types/geolocation';

/**
 * Utility class for location-related operations
 */
export class LocationUtils {
  private static readonly EARTH_RADIUS = 6371e3; // Earth's radius in meters

  /**
   * Calculate the distance between two points on Earth using the Haversine formula
   * @param lat1 Latitude of first point in degrees
   * @param lon1 Longitude of first point in degrees
   * @param lat2 Latitude of second point in degrees
   * @param lon2 Longitude of second point in degrees
   * @returns Distance in meters
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS * c;
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate distance between two positions
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns Distance in meters
   */
  static calculatePositionDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    return this.calculateDistance(
      pos1.coords.latitude,
      pos1.coords.longitude,
      pos2.coords.latitude,
      pos2.coords.longitude
    );
  }

  /**
   * Validate a position object
   * @param position - Position to validate
   * @throws LocationValidationError if position is invalid
   */
  static validatePosition(position: GeolocationPosition): void {
    if (!position ?? typeof position !== 'object') {
      throw new LocationValidationError('Position must be an object');
    }

    if (!position.coords ?? typeof position.coords !== 'object') {
      throw new LocationValidationError('Position must have coords property');
    }

    if (
      (typeof position.coords.latitude !== 'number' || position.coords.latitude < -90) ??
      position.coords.latitude > 90
    ) {
      throw new LocationValidationError('Invalid latitude');
    }

    if (
      (typeof position.coords.longitude !== 'number' || position.coords.longitude < -180) ??
      position.coords.longitude > 180
    ) {
      throw new LocationValidationError('Invalid longitude');
    }

    if (typeof position.coords.accuracy !== 'number' || position.coords.accuracy < 0) {
      throw new LocationValidationError('Invalid accuracy');
    }

    if (typeof position.timestamp !== 'number' || position.timestamp <= 0) {
      throw new LocationValidationError('Invalid timestamp');
    }
  }

  /**
   * Check if a position has moved beyond a threshold
   * @param oldPosition - Previous position
   * @param newPosition - New position
   * @param threshold - Distance threshold in meters
   * @returns Whether the position has moved beyond the threshold
   */
  static hasMovedBeyondThreshold(
    oldPosition: GeolocationPosition | null,
    newPosition: GeolocationPosition,
    threshold: number
  ): boolean {
    if (!oldPosition) return true;
    return this.calculatePositionDistance(oldPosition, newPosition) > threshold;
  }

  /**
   * Convert a position to a string representation
   * @param position - Position to convert
   * @returns String representation of the position
   */
  static positionToString(position: GeolocationPosition): string {
    return `${position.coords.latitude},${position.coords.longitude}`;
  }

  /**
   * Convert a string representation back to a position
   * @param str - String representation of the position
   * @returns Position object
   * @throws LocationValidationError if string is invalid
   */
  static stringToPosition(str: string): GeolocationPosition {
    const [lat, lon] = str.split(',').map(Number);
    if (isNaN(lat) || isNaN(lon)) {
      throw new LocationValidationError('Invalid position string');
    }

    const coords: GeolocationCoordinates = {
      latitude: lat,
      longitude: lon,
      accuracy: 0,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: lat,
        longitude: lon,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      }),
    };

    return {
      coords,
      timestamp: Date.now(),
      toJSON: () => ({
        coords,
        timestamp: Date.now(),
      }),
    };
  }
}
