import type { GeolocationPosition } from '../types/geolocation';
export declare class LocationUtils {
    private static readonly EARTH_RADIUS;
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private static toRadians;
    static calculatePositionDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number;
    static validatePosition(position: GeolocationPosition): void;
    static hasMovedBeyondThreshold(oldPosition: GeolocationPosition | null, newPosition: GeolocationPosition, threshold: number): boolean;
    static positionToString(position: GeolocationPosition): string;
    static stringToPosition(str: string): GeolocationPosition;
}
