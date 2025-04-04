import { useState, useEffect, useRef, useCallback } from 'react';
import { handleGeolocationError, createGeolocationError } from '../utils/error-handler';
import { locationRequestManager } from '../utils/location-services';
import logger from '../utils/Logger';
export const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        retryCount: 2,
        retryDelay: 2000,
        useCaching: true,
    };
    const geolocationOptions = { ...defaultOptions, ...options };
    const attemptsRef = useRef(0);
    const abortControllerRef = useRef(null);
    const timeoutIdRef = useRef(null);
    const cachedLocationRef = useRef(null);
    const lastRequestTimeRef = useRef(0);
    const refresh = useCallback(async () => {
        if (isLoading)
            return;
        setIsLoading(true);
        setError(null);
        attemptsRef.current = 0;
        try {
            await getLocation();
        }
        catch (err) {
            logger.error('Location refresh failed', err instanceof Error ? err.message : String(err));
        }
    }, [isLoading]);
    const getLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            const error = createGeolocationError('Geolocation is not supported by your browser');
            setError(error.message);
            setIsLoading(false);
            handleGeolocationError(error);
            return;
        }
        if (geolocationOptions.useCaching &&
            cachedLocationRef.current &&
            Date.now() - lastRequestTimeRef.current < geolocationOptions.maximumAge) {
            logger.info('Using cached location', JSON.stringify(cachedLocationRef.current));
            setLocation(cachedLocationRef.current);
            setIsLoading(false);
            return;
        }
        if (geolocationOptions.useCaching) {
            try {
                const requestedLocation = await locationRequestManager.requestLocation();
                setLocation(requestedLocation);
                cachedLocationRef.current = requestedLocation;
                lastRequestTimeRef.current = Date.now();
                setIsLoading(false);
                return;
            }
            catch (error) {
                logger.warn('LocationRequestManager failed, falling back to direct geolocation', error instanceof Error ? error.message : String(error));
            }
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }
        abortControllerRef.current = new AbortController();
        try {
            const timeoutPromise = new Promise((_, reject) => {
                const id = setTimeout(() => {
                    reject(new Error('Location request timed out'));
                }, geolocationOptions.timeout);
                timeoutIdRef.current = id;
            });
            const positionPromise = new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: geolocationOptions.enableHighAccuracy,
                    timeout: geolocationOptions.timeout,
                    maximumAge: geolocationOptions.maximumAge,
                });
            });
            const position = await Promise.race([positionPromise, timeoutPromise]);
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
            const { latitude, longitude } = position.coords;
            const newLocation = {
                lat: latitude,
                lng: longitude,
                display_name: 'Your Location',
                latitude: latitude,
                longitude: longitude,
            };
            setLocation(newLocation);
            setIsLoading(false);
            if (geolocationOptions.useCaching) {
                cachedLocationRef.current = newLocation;
                lastRequestTimeRef.current = Date.now();
            }
            logger.info('Geolocation obtained successfully', JSON.stringify({ latitude, longitude }));
        }
        catch (error) {
            if (attemptsRef.current < geolocationOptions.retryCount) {
                attemptsRef.current++;
                logger.warn(`Geolocation attempt ${attemptsRef.current} failed, retrying in ${geolocationOptions.retryDelay}ms`, error instanceof Error ? error.message : String(error));
                setTimeout(() => {
                    getLocation();
                }, geolocationOptions.retryDelay);
                return;
            }
            let errorMessage = 'Unable to retrieve your location';
            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case 1:
                        errorMessage = 'Location permission denied';
                        break;
                    case 2:
                        errorMessage = 'Location information unavailable';
                        break;
                    case 3:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred';
                }
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            const geoError = createGeolocationError(errorMessage);
            handleGeolocationError(geoError, {
                originalError: error instanceof Error ? error : undefined,
            });
            setError(errorMessage);
            setIsLoading(false);
            logger.error('Geolocation error', JSON.stringify({
                message: errorMessage,
                originalError: error instanceof Error ? error.message : String(error),
            }));
        }
    }, [geolocationOptions]);
    useEffect(() => {
        getLocation();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, [getLocation]);
    return {
        location,
        error,
        isLoading,
        refresh,
    };
};
export default useGeolocation;
//# sourceMappingURL=useGeolocation.js.map