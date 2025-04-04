import L from 'leaflet';
import { useState, useEffect, useCallback, RefObject } from 'react';

import { MAP_CONSTANTS, calculateSearchRadius } from './config';

export const useMapZoom = (
  mapRef: RefObject<L.Map>,
  onZoomChange?: (zoom: number) => void,
  onSearchRadiusChange?: (radius: number) => void,
  initialZoom: number = MAP_CONSTANTS.DEFAULT_ZOOM
): [number, React.Dispatch<React.SetStateAction<number>>] => {
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const zoomTimeoutRef: { current: NodeJS.Timeout | null } = { current: null };

    const handleZoomEnd = () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }

      zoomTimeoutRef.current = setTimeout(() => {
        const newZoom = Math.min(
          Math.max(map.getZoom(), MAP_CONSTANTS.MIN_ZOOM),
          MAP_CONSTANTS.MAX_ZOOM
        );

        if (newZoom !== currentZoom) {
          setCurrentZoom(newZoom);
          const searchRadius = calculateSearchRadius(newZoom);
          onSearchRadiusChange?.(searchRadius);
          onZoomChange?.(newZoom);
        }
      }, 100);
    };

    map.on('zoomend', handleZoomEnd);

    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      map.off('zoomend', handleZoomEnd);
    };
  }, [mapRef, onZoomChange, currentZoom, onSearchRadiusChange]);

  return [currentZoom, setCurrentZoom];
};

interface Location {
  lat: number;
  lng: number;
}

interface Meetup {
  location?: {
    lat?: number;
    lng?: number;
  };
  [key: string]: any;
}

export const useMeetupBounds = (
  mapRef: RefObject<L.Map>,
  location: Location | null,
  activeMeetups: Meetup[]
): (() => L.LatLngBounds | undefined) => {
  const updateBounds = useCallback(() => {
    if (!mapRef.current || !location || activeMeetups.length === 0) return;

    const map = mapRef.current;
    const bounds = L.latLngBounds([[location.lat, location.lng]] as L.LatLngExpression[]);

    const includedMeetups = activeMeetups.filter(meetup => {
      if (!meetup.location?.lat || !meetup.location?.lng) return false;
      const distance = map.distance(
        [location.lat, location.lng] as L.LatLngExpression,
        [meetup.location.lat, meetup.location.lng] as L.LatLngExpression
      );
      return distance <= MAP_CONSTANTS.MAX_MEETUP_DISTANCE;
    });

    if (includedMeetups.length === 0) return;

    includedMeetups.forEach(meetup => {
      if (meetup.location?.lat && meetup.location?.lng) {
        bounds.extend([meetup.location.lat, meetup.location.lng] as L.LatLngExpression);
      }
    });

    return bounds;
  }, [mapRef, location, activeMeetups]);

  return updateBounds;
};

export const useMapResize = (mapRef: RefObject<L.Map>): { width: number; height: number } => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        mapRef.current?.invalidateSize();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [mapRef]);

  return windowSize;
};
