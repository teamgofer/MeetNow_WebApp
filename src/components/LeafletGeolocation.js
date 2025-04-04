import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import Logger from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
const LeafletGeolocation = ({ onLocationSelect, navigationController, watchPosition = false, maximumAge = 0, timeout = 10000, enableHighAccuracy = true, showAccuracyCircle = false, }) => {
    const map = useMap();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    useEffect(() => {
        const handleGeolocationSuccess = (position) => {
            const timestamp = Date.now();
            const duration = timestamp - startTimeRef.current;
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
                display_name: 'Current Location',
                _source: 'geolocation',
            };
            Logger.debug('LeafletGeolocation', 'Geolocation success', location);
            PerformanceMonitor.trackOperationTiming('geolocation', 'getCurrentPosition', duration, {
                success: true,
                accuracy: position.coords.accuracy,
                hasAltitude: position.coords.altitude !== null,
                hasSpeed: position.coords.speed !== null,
            });
            if (onLocationSelect) {
                onLocationSelect(location);
            }
            if (navigationController) {
                navigationController.setUserLocation(location);
            }
            setIsLoading(false);
        };
        const handleGeolocationError = (error) => {
            const timestamp = Date.now();
            const duration = timestamp - startTimeRef.current;
            Logger.error('LeafletGeolocation', 'Geolocation error', error);
            PerformanceMonitor.trackOperationTiming('geolocation', 'getCurrentPosition', duration, {
                success: false,
                errorCode: error.code,
                errorMessage: error.message,
            });
            setError(error);
            setIsLoading(false);
        };
        const options = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        };
        startTimeRef.current = Date.now();
        setError(null);
        if ('geolocation' in navigator) {
            setIsLoading(true);
            if (watchPosition) {
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
                watchIdRef.current = navigator.geolocation.watchPosition(handleGeolocationSuccess, handleGeolocationError, options);
                Logger.debug('LeafletGeolocation', 'Started watching position', {
                    watchId: watchIdRef.current,
                });
            }
            else {
                navigator.geolocation.getCurrentPosition(handleGeolocationSuccess, handleGeolocationError, options);
            }
        }
        else {
            const browserError = new Error('Geolocation is not supported by your browser');
            Logger.error('LeafletGeolocation', 'Browser error', browserError);
            setError(browserError);
        }
        return () => {
            if (watchPosition && watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                Logger.debug('LeafletGeolocation', 'Stopped watching position', {
                    watchId: watchIdRef.current,
                });
                watchIdRef.current = null;
            }
        };
    }, [
        onLocationSelect,
        navigationController,
        watchPosition,
        maximumAge,
        timeout,
        enableHighAccuracy,
    ]);
    return null;
};
export default LeafletGeolocation;
//# sourceMappingURL=LeafletGeolocation.js.map