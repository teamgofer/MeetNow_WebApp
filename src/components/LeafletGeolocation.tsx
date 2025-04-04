import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';

import Logger from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

export interface ILocation {
  lat: number;
  lng: number;
  display_name?: string;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  [key: string]: any;
}

export interface IMapNavigationController {
  setUserLocation: (location: Location) => boolean;
  navigateTo: (location: Location, options?: any) => Promise<boolean>;
  [key: string]: any;
}

interface ILeafletGeolocationProps {
  onLocationSelect?: (location: Location) => void;
  navigationController?: MapNavigationController | null;
  watchPosition?: boolean;
  maximumAge?: number;
  timeout?: number;
  enableHighAccuracy?: boolean;
  showAccuracyCircle?: boolean;
}

const LeafletGeolocation: React.FC<LeafletGeolocationProps> = ({
  onLocationSelect,
  navigationController,
  watchPosition = false,
  maximumAge = 0,
  timeout = 10000,
  enableHighAccuracy = true,
  showAccuracyCircle = false,
}) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleGeolocationSuccess = (position: GeolocationPosition) => {
      const timestamp = Date.now();
      const duration = timestamp - startTimeRef.current;

      const location: Location = {
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

      // Track performance
      PerformanceMonitor.trackOperationTiming('geolocation', 'getCurrentPosition', duration, {
        success: true,
        accuracy: position.coords.accuracy,
        hasAltitude: position.coords.altitude !== null,
        hasSpeed: position.coords.speed !== null,
      });

      // Notify parent component
      if (onLocationSelect) {
        onLocationSelect(location);
      }

      // Update the navigation controller
      if (navigationController) {
        navigationController.setUserLocation(location);
      }

      // Update loading state
      setIsLoading(false);
    };

    const handleGeolocationError = (error: GeolocationPositionError) => {
      const timestamp = Date.now();
      const duration = timestamp - startTimeRef.current;

      Logger.error('LeafletGeolocation', 'Geolocation error', error);

      // Track error
      PerformanceMonitor.trackOperationTiming('geolocation', 'getCurrentPosition', duration, {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
      });

      setError(error);
      setIsLoading(false);
    };

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    // Reset for a fresh start
    startTimeRef.current = Date.now();
    setError(null);

    if ('geolocation' in navigator) {
      setIsLoading(true);

      if (watchPosition) {
        // Clear any existing watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        // Start a new watch
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleGeolocationSuccess,
          handleGeolocationError,
          options
        );

        Logger.debug('LeafletGeolocation', 'Started watching position', {
          watchId: watchIdRef.current,
        });
      } else {
        // Just get position once
        navigator.geolocation.getCurrentPosition(
          handleGeolocationSuccess,
          handleGeolocationError,
          options
        );
      }
    } else {
      const browserError = new Error('Geolocation is not supported by your browser');
      Logger.error('LeafletGeolocation', 'Browser error', browserError);
      setError(browserError);
    }

    // Cleanup function
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

  // The component doesn't render anything visible
  return null;
};

export default LeafletGeolocation;
