import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface IMapWrapperProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: () => void;
  onLocationChange?: (location: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onMapClick?: (e: { latlng: { lat: number; lng: number } }) => void;
  onMapMove?: (e: { latlng: { lat: number; lng: number } }) => void;
  onMarkerClick?: (markerId: string, data?: any) => void;
  onPopupOpen?: (popupId: string, data?: any) => void;
  onPopupClose?: (popupId: string) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

/**
 * MapWrapper component for wrapping a map library (like Leaflet)
 */
const MapWrapper: React.FC<IMapWrapperProps> = ({
  center = [0, 0],
  zoom = 13,
  className = '',
  style = {},
  onMapReady,
  onLocationChange,
  onZoomChange,
  onMapClick,
  onMapMove,
  onMarkerClick,
  onPopupOpen,
  onPopupClose,
  onError,
  children,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Map initialization logic
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    try {
      // Initialize Leaflet map
      const map = L.map(mapRef.current, {
        center: center as L.LatLngExpression,
        zoom: zoom,
        zoomControl: false,
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Register click event
      if (onMapClick) {
        map.on('click', e => {
          onMapClick(e as any);
        });
      }

      // Register move event
      if (onMapMove) {
        map.on('move', () => {
          const center = map.getCenter();
          onMapMove({ latlng: { lat: center.lat, lng: center.lng } });
        });
      }

      // Register zoom change event
      if (onZoomChange) {
        map.on('zoomend', () => {
          onZoomChange(map.getZoom());
        });
      }

      // Store map reference
      leafletMapRef.current = map;

      // Map is ready
      setIsMapReady(true);
      onMapReady?.();
    } catch (error) {
      console.error('Map initialization error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown map error'));
    }

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [center, zoom, onMapReady, onMapClick, onMapMove, onZoomChange, onError]);

  // Handle center changes
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current) return;

    // Update map center when the center prop changes
    leafletMapRef.current.setView(center as L.LatLngExpression, leafletMapRef.current.getZoom(), {
      animate: true,
    });

    onLocationChange?.(center);
  }, [center, isMapReady, onLocationChange]);

  // Handle zoom changes
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current) return;

    // Update map zoom when the zoom prop changes
    if (leafletMapRef.current.getZoom() !== zoom) {
      leafletMapRef.current.setZoom(zoom);
    }

    onZoomChange?.(zoom);
  }, [zoom, isMapReady, onZoomChange]);

  return (
    <div
      ref={mapRef}
      className={`map-wrapper ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {isMapReady && children}
    </div>
  );
};

export default MapWrapper;
