import type { LatLngExpression, DivIcon } from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';

import Logger from '../../utils/Logger';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

export interface ILocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  display_name?: string;
  [key: string]: any;
}

export interface ILocationMarkerProps {
  position: LocationPosition;
  icon: DivIcon;
  onLocationSelect?: (location: LocationPosition) => void;
  showInfoByDefault?: boolean;
  zIndexOffset?: number;
  pulsate?: boolean;
  interactive?: boolean;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  onLocationSelect,
  position,
  icon,
  showInfoByDefault = false,
  zIndexOffset = 1000,
  pulsate = true,
  interactive = true,
}) => {
  const map = useMap();
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const renderStartTimeRef = useRef<number>(Date.now());
  const [showInfo, setShowInfo] = useState<boolean>(showInfoByDefault);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    // Track component initialization
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('map', 'locationMarkerInit', duration, {
      success: true,
      hasPosition: !!position,
      hasIcon: !!icon,
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Track position updates
  useEffect(() => {
    if (position) {
      const startTime = Date.now();
      PerformanceMonitor.trackOperationTiming('map', 'locationMarkerUpdate', 0, {
        success: true,
        lat: position.lat,
        lng: position.lng,
        hasIcon: !!icon,
      });

      Logger.debug('LocationMarker', 'Position updated', {
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
      });
    }
  }, [position, icon]);

  // Handle marker click
  const handleMarkerClick = () => {
    const startTime = Date.now();

    // Toggle info display
    setShowInfo(!showInfo);

    // Call the callback if provided
    if (onLocationSelect) {
      onLocationSelect(position);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('map', 'locationMarkerClick', duration, {
        success: true,
        lat: position.lat,
        lng: position.lng,
      });
    }
  };

  return (
    <>
      {position && position.lat && position.lng && (
        <Marker
          position={[position.lat, position.lng] as LatLngExpression}
          icon={icon}
          zIndexOffset={zIndexOffset}
          interactive={interactive}
          eventHandlers={{
            click: handleMarkerClick,
          }}
        >
          {showInfo && (
            <Popup>
              <div className="location-info">
                <h3>Your Location</h3>
                {position.display_name && <p>{position.display_name}</p>}
                {position.accuracy && <p>Accuracy: ±{Math.round(position.accuracy)}m</p>}
              </div>
            </Popup>
          )}
        </Marker>
      )}
      {isGeocoding && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600">
          Getting location details...
        </div>
      )}
    </>
  );
};

export default LocationMarker;
