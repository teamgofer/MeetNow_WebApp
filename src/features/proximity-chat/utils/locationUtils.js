import { LocationValidationError } from '../types/errors';
export class LocationUtils {
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const φ1 = this.toRadians(lat1);
        const φ2 = this.toRadians(lat2);
        const Δφ = this.toRadians(lat2 - lat1);
        const Δλ = this.toRadians(lon2 - lon1);
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.EARTH_RADIUS * c;
    }
    static toRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
    static calculatePositionDistance(pos1, pos2) {
        return this.calculateDistance(pos1.coords.latitude, pos1.coords.longitude, pos2.coords.latitude, pos2.coords.longitude);
    }
    static validatePosition(position) {
        if (!position ?? typeof position !== 'object') {
            throw new LocationValidationError('Position must be an object');
        }
        if (!position.coords ?? typeof position.coords !== 'object') {
            throw new LocationValidationError('Position must have coords property');
        }
        if ((typeof position.coords.latitude !== 'number' || position.coords.latitude < -90) ??
            position.coords.latitude > 90) {
            throw new LocationValidationError('Invalid latitude');
        }
        if ((typeof position.coords.longitude !== 'number' || position.coords.longitude < -180) ??
            position.coords.longitude > 180) {
            throw new LocationValidationError('Invalid longitude');
        }
        if (typeof position.coords.accuracy !== 'number' || position.coords.accuracy < 0) {
            throw new LocationValidationError('Invalid accuracy');
        }
        if (typeof position.timestamp !== 'number' || position.timestamp <= 0) {
            throw new LocationValidationError('Invalid timestamp');
        }
    }
    static hasMovedBeyondThreshold(oldPosition, newPosition, threshold) {
        if (!oldPosition)
            return true;
        return this.calculatePositionDistance(oldPosition, newPosition) > threshold;
    }
    static positionToString(position) {
        return `${position.coords.latitude},${position.coords.longitude}`;
    }
    static stringToPosition(str) {
        const [lat, lon] = str.split(',').map(Number);
        if (isNaN(lat) || isNaN(lon)) {
            throw new LocationValidationError('Invalid position string');
        }
        const coords = {
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
LocationUtils.EARTH_RADIUS = 6371e3;
//# sourceMappingURL=LocationUtils.js.map