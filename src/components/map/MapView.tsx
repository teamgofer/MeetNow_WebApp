import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { LatLngExpression, LatLngTuple, LatLngBounds } from 'leaflet';
import MapClickHandler from './MapClickHandler';
import UserLocationMarker from './UserLocationMarker';
import PinMarker from './PinMarker';
import MeetupMarkers, { IMeetup } from './MeetupMarkers';
import { MAP_CONSTANTS } from '../../lib/map/config';
import MapNavigationController from '../../utils/MapNavigationController';

// Default center position if user location isn't available
const DEFAULT_CENTER: LatLngTuple = [51.505, -0.09];
const DEFAULT_ZOOM = MAP_CONSTANTS.DEFAULT_ZOOM;

// Component to locate the user and center the map
function UserLocationDetector({
  setUserLocation,
  centerOnUser = true,
}: {
  setUserLocation: (location: LatLngTuple, accuracy?: number) => void;
  centerOnUser?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    // Try to locate the user
    map.locate({
      setView: centerOnUser,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    // Handle location found event
    const handleLocationFound = (e: L.LocationEvent) => {
      console.log('User location found:', e.latlng, 'Accuracy:', e.accuracy);
      const userPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setUserLocation(userPos, e.accuracy);

      if (centerOnUser) {
        map.setView(userPos, 15);
      }
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
  }, [map, setUserLocation, centerOnUser]);

  return null; // This component doesn't render anything
}

// Component to fit bounds when needed
function MapController({
  bounds,
  shouldFitBounds,
}: {
  bounds?: LatLngBounds | null;
  shouldFitBounds?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds && shouldFitBounds) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [map, bounds, shouldFitBounds]);

  return null;
}

interface IPinnedLocation {
  id: string;
  position: LatLngExpression;
  title?: string;
  address?: string;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  isTemporary?: boolean;
}

interface MapViewProps {
  meetups?: IMeetup[];
  pins?: IPinnedLocation[];
  onMapClick?: (position: LatLngExpression) => void;
  onMeetupClick?: (id: string) => void;
  onPinClick?: (id: string) => void;
  selectedMeetupId?: string | null;
  selectedPinId?: string | null;
  showUserLocation?: boolean;
  centerOnUserLocation?: boolean;
  fitAllMarkers?: boolean;
  height?: string;
  width?: string;
  className?: string;
}

/**
 * Full-featured map component that uses all specialized markers
 */
const MapView: React.FC<MapViewProps> = ({
  meetups = [],
  pins = [],
  onMapClick,
  onMeetupClick,
  onPinClick,
  selectedMeetupId = null,
  selectedPinId = null,
  showUserLocation = true,
  centerOnUserLocation = true,
  fitAllMarkers = false,
  height = '100%',
  width = '100%',
  className = '',
}) => {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | undefined>(undefined);
  const [controller] = useState<MapNavigationController>(
    new MapNavigationController({
      defaultZoom: DEFAULT_ZOOM,
      animateTransitions: true,
      enableDebug: true,
    })
  );
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);

  // Calculate bounds to fit all markers and user location
  useEffect(() => {
    if (!fitAllMarkers) return;

    const points: LatLngExpression[] = [];

    // Add user location
    if (userLocation) {
      points.push(userLocation);
    }

    // Add meetup locations
    meetups.forEach(meetup => {
      points.push(meetup.position);
    });

    // Add pin locations
    pins.forEach(pin => {
      points.push(pin.position);
    });

    // Create bounds if we have at least 2 points
    if (points.length >= 2) {
      const newBounds = new LatLngBounds(points as LatLngTuple[]);
      setBounds(newBounds);
    } else {
      setBounds(null);
    }
  }, [meetups, pins, userLocation, fitAllMarkers]);

  // Handle setting user location
  const handleUserLocationFound = useCallback((location: LatLngTuple, accuracy?: number) => {
    setUserLocation(location);
    setUserAccuracy(accuracy);
  }, []);

  // Handle map click
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      const position: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      onMapClick(position);
    }
  };

  // Handle map ready
  const handleMapReady = (map: L.Map) => {
    // Setup click handler for the map
    if (onMapClick) {
      map.on('click', handleMapClick);
    }

    // Set up controller
    controller.updateMapReference(map);
  };

  return (
    <div style={{ height, width }} className={`map-container ${className}`}>
      <MapContainer
        center={userLocation || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Remove zoom control */}
        {/* <ZoomControl position="bottomright" /> */}

        {/* Add tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location detection */}
        {showUserLocation && (
          <UserLocationDetector
            setUserLocation={handleUserLocationFound}
            centerOnUser={centerOnUserLocation}
          />
        )}

        {/* Fit bounds controller */}
        <MapController bounds={bounds} shouldFitBounds={fitAllMarkers} />

        {/* Register map click handler */}
        <MapClickHandler navigationController={controller} onMapReady={handleMapReady} />

        {/* Display user location marker if available */}
        {showUserLocation && userLocation && (
          <UserLocationMarker position={userLocation} accuracy={userAccuracy} showPopup={false} />
        )}

        {/* Display meetup markers */}
        <MeetupMarkers
          meetups={meetups}
          onMeetupClick={onMeetupClick}
          selectedMeetupId={selectedMeetupId}
          showPopups={false}
        />

        {/* Display pin markers */}
        {pins.map(pin => (
          <PinMarker
            key={pin.id}
            id={pin.id}
            position={pin.position}
            title={pin.title}
            address={pin.address}
            color={pin.color}
            isTemporary={pin.isTemporary}
            onClick={onPinClick}
            selected={selectedPinId === pin.id}
            showPopup={selectedPinId === pin.id}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
