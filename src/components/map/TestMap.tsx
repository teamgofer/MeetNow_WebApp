import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Icon, LatLngExpression, DivIcon, LatLngTuple } from 'leaflet';
import MapClickHandler from './MapClickHandler';
import MapMarkers from './MapMarkers';
import { MAP_CONSTANTS } from '../../lib/map/config';
import MapNavigationController from '../../utils/MapNavigationController';
import { ILocation } from '../../utils/MapNavigationController';

// Default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create a user location marker icon
const userLocationIcon = new DivIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-location-dot">
      <div class="user-location-pulse"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Define default center position
const DEFAULT_CENTER: LatLngTuple = [51.505, -0.09];
const DEFAULT_ZOOM = MAP_CONSTANTS.DEFAULT_ZOOM;

// Convert LatLngExpression to ILocation
const convertToILocation = (position: LatLngExpression): ILocation => {
  if (Array.isArray(position)) {
    return {
      lat: position[0],
      lng: position[1],
    };
  } else if (typeof position === 'object' && 'lat' in position && 'lng' in position) {
    return {
      lat: position.lat,
      lng: position.lng,
    };
  }
  // Default fallback
  return {
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1],
  };
};

// Component to locate the user and center the map
function UserLocationController({
  setUserLocation,
}: {
  setUserLocation: React.Dispatch<React.SetStateAction<LatLngTuple | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    // Try to locate the user
    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    // Handle location found event
    const handleLocationFound = (e: L.LocationEvent) => {
      console.log('User location found:', e.latlng);
      const userPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setUserLocation(userPos);
      map.setView(userPos, 15);
    };

    // Handle location error event
    const handleLocationError = (e: L.ErrorEvent) => {
      console.warn('Location error:', e.message);
      // Keep the default location if user location fails
    };

    // Register event handlers
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    // Clean up when component unmounts
    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map, setUserLocation]);

  return null; // This component doesn't render anything
}

interface TestMapProps {
  center?: LatLngExpression;
  zoom?: number;
  height?: string;
  width?: string;
}

/**
 * Test map component that demonstrates the use of all map-related components
 */
const TestMap: React.FC<TestMapProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '500px',
  width = '100%',
}) => {
  const [markers, setMarkers] = useState<
    Array<{
      id: string;
      position: LatLngExpression;
      popupContent: React.ReactNode;
      icon?: Icon | DivIcon;
    }>
  >([]);
  const [controller] = useState<MapNavigationController>(
    new MapNavigationController({
      defaultZoom: zoom,
      animateTransitions: true,
      defaultLocation: convertToILocation(center),
      enableDebug: true,
    })
  );
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);

  // Add user location marker when location is found
  useEffect(() => {
    if (userLocation) {
      // Check if user marker already exists
      const existingUserMarker = markers.find(m => m.id === 'user-location');

      if (existingUserMarker) {
        // Update existing user marker
        setMarkers(prev =>
          prev.map(m =>
            m.id === 'user-location'
              ? {
                  ...m,
                  position: userLocation,
                  popupContent: <div className="p-2">Your Location</div>,
                }
              : m
          )
        );
      } else {
        // Add new user marker
        setMarkers(prev => [
          ...prev,
          {
            id: 'user-location',
            position: userLocation,
            popupContent: <div className="p-2">Your Location</div>,
            icon: userLocationIcon,
          },
        ]);
      }
    }
  }, [userLocation, markers]);

  // Handle when map is ready
  const handleMapReady = (map: L.Map) => {
    console.log('Map is ready!', map);

    // Setup click handler on the map
    map.on('click', handleMapClick);
  };

  // Handle map click to add new markers
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const newId = `marker-${Date.now()}`;
    const newPosition: LatLngTuple = [e.latlng.lat, e.latlng.lng];

    setMarkers(prev => [
      ...prev.filter(m => m.id !== 'default'), // Remove default marker if it exists
      ...prev.filter(m => m.id === 'user-location'), // Keep user location marker
      {
        id: newId,
        position: newPosition,
        popupContent: (
          <div className="p-2">
            <strong>New Location</strong>
            <p className="text-sm">
              {e.latlng.lat.toFixed(5)}, {e.latlng.lng.toFixed(5)}
            </p>
            <button
              className="px-2 py-1 mt-2 bg-red-500 text-white rounded text-sm"
              onClick={() => {
                setMarkers(prev => prev.filter(m => m.id !== newId));
              }}
            >
              Remove
            </button>
          </div>
        ),
      },
    ]);

    // Auto-select the new marker
    setSelectedMarkerId(newId);
  };

  // Handle marker click
  const handleMarkerClick = (markerId: string | number) => {
    setSelectedMarkerId(markerId as string);
    console.log(`Marker clicked: ${markerId}`);
  };

  return (
    <div style={{ height, width }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location controller */}
        <UserLocationController setUserLocation={setUserLocation} />

        {/* Register map click handler */}
        <MapClickHandler navigationController={controller} onMapReady={handleMapReady} />

        {/* Display markers */}
        <MapMarkers
          markers={markers.map(m => ({
            ...m,
            icon: m.icon || defaultIcon,
          }))}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedMarkerId}
        />
      </MapContainer>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Map Instructions:</h3>
        <p className="text-sm">
          Click anywhere on the map to add a new marker. Click on markers to select them.
        </p>
        <p className="text-sm mt-2">Total markers: {markers.length}</p>
        {userLocation && (
          <p className="text-sm mt-1 text-blue-600">
            Your location detected at: {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};

export default TestMap;
