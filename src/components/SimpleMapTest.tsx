import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

interface SimpleMapTestProps {
  className?: string;
}

/**
 * A simple map component to test Leaflet integration
 */
const SimpleMapTest: React.FC<SimpleMapTestProps> = ({ className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // San Francisco

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    try {
      // Initialize Leaflet map
      const map = L.map(mapRef.current, {
        center: mapCenter as L.LatLngExpression,
        zoom: 13,
        zoomControl: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add marker at center
      const marker = L.marker(mapCenter as L.LatLngExpression).addTo(map);
      marker.bindPopup('Test Marker').openPopup();

      // Store map reference
      leafletMapRef.current = map;

      // Map is ready
      setIsMapReady(true);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Map initialization error:', error);
      setError(error instanceof Error ? error.message : 'Unknown map error');
    }

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapCenter]);

  // Handle click on map
  const handleMapClick = () => {
    if (leafletMapRef.current) {
      const randomLat = mapCenter[0] + (Math.random() - 0.5) * 0.1;
      const randomLng = mapCenter[1] + (Math.random() - 0.5) * 0.1;

      // Add a new marker at the random position
      const newMarker = L.marker([randomLat, randomLng] as L.LatLngExpression).addTo(
        leafletMapRef.current
      );

      newMarker
        .bindPopup(`New marker at ${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`)
        .openPopup();
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Map Error</h3>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="simple-map-container">
      <h2 className="text-2xl font-bold mb-4">Simple Map Test</h2>
      <p className="mb-4">
        This is a simple Leaflet map with minimal dependencies to test map functionality. Click the
        button below to add random markers to the map.
      </p>

      <button
        onClick={handleMapClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
      >
        Add Random Marker
      </button>

      <div
        ref={mapRef}
        className={`map-wrapper ${className}`}
        style={{ width: '100%', height: '500px' }}
      />

      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-800">Initializing map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMapTest;
