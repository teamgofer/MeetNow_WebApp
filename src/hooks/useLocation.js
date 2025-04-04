import { useCallback, useState } from 'react';
import Logger from '../utils/Logger';
const useLocation = () => {
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const searchLocations = useCallback(async (query, options = {}) => {
        if (!query)
            return [];
        try {
            setIsLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.append('q', query);
            Object.entries(options).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
            const response = await fetch(`/api/geocode?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Search failed with status: ${response.status}`);
            }
            const results = await response.json();
            return Array.isArray(results) ? results : [];
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search locations';
            setError(errorMessage);
            console.error('Error searching locations:', err);
            return [];
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const reverseGeocode = useCallback(async (coordinates) => {
        if (!coordinates?.lat || !coordinates.lng) {
            return [];
        }
        try {
            setIsLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.append('lat', coordinates.lat.toString());
            params.append('lng', coordinates.lng.toString());
            const response = await fetch(`/api/reverse-geocode?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to reverse geocode location');
            }
            const results = await response.json();
            return Array.isArray(results) ? results : [];
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get address information';
            setError(errorMessage);
            console.error('Error reverse geocoding:', err);
            return [];
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const getCurrentLocation = useCallback(async (options = {}) => {
        try {
            setIsLoading(true);
            setError(null);
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                    ...options,
                });
            });
            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
            };
            try {
                const geocodeResults = await reverseGeocode(locationData);
                if (geocodeResults && geocodeResults.length > 0) {
                    return {
                        ...locationData,
                        ...geocodeResults[0],
                    };
                }
            }
            catch (geocodeErr) {
                console.warn('Failed to reverse geocode location:', geocodeErr);
            }
            return locationData;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
            setError(errorMessage);
            console.error('Error getting current location:', err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [reverseGeocode]);
    const calculateDistance = useCallback((point1, point2) => {
        try {
            const R = 6371e3;
            const φ1 = (point1.lat * Math.PI) / 180;
            const φ2 = (point2.lat * Math.PI) / 180;
            const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
            const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            Logger.debug('LocationHook', `Distance calculated: ${distance}m`, {
                from: point1,
                to: point2,
                distance,
            });
            return distance;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to calculate distance');
            Logger.error('LocationHook', 'Failed to calculate distance', error);
            throw error;
        }
    }, []);
    return {
        location,
        isLoading,
        error,
        searchLocations,
        reverseGeocode,
        getCurrentLocation,
        calculateDistance,
    };
};
export default useLocation;
//# sourceMappingURL=useLocation.js.map