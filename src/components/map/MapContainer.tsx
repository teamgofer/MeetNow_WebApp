import React, { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import type { ILocation } from '@/types/location';
import type { IMeetup } from '@/types/meetup';

import useGeolocation from '../../hooks/useGeolocation';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useComponentRegistry } from '../ui/ComponentRegistry';
import { ErrorNotification, Spinner, NearbyMeetups } from '../ui';
import { MapWrapper, FloatingWindowWrapper } from '../wrappers';
import { useLeafletMap } from '../wrappers/MapWrapper';
import CreateMeetup from '../CreateMeetup';

interface IMapContainerProps {
  /** Location from geolocation hook or other source */
  location?: ILocation;
  /** Currently selected location on the map */
  selectedLocation?: ILocation | null;
  /** Array of meetups to display on the map */
  meetups?: IMeetup[];
  /** Called when a location is selected on the map */
  onLocationSelect: (location: ILocation) => void;
  /** Called when a new meetup is created */
  onCreateMeetup?: (meetup: Partial<IMeetup>) => Promise<IMeetup | null>;
  /** Called when the map is ready */
  onMapReady?: () => void;
  /** Called to close location selection */
  onClose?: () => void;
  /** Whether the map is ready for interaction */
  isMapReady?: boolean;
  /** Additional class names */
  className?: string;
  /** Child elements */
  children?: React.ReactNode;
}

/**
 * MapContainer component for displaying and interacting with the map
 */
const MapContainer: React.FC<IMapContainerProps> = ({
  location: externalLocation,
  selectedLocation: externalSelectedLocation,
  meetups = [],
  onLocationSelect,
  onCreateMeetup,
  onMapReady,
  onClose,
  isMapReady: externalIsMapReady,
  className = '',
  children,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(
    externalSelectedLocation || null
  );
  const [isMapReady, setIsMapReady] = useState(externalIsMapReady || false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateMeetupForm, setShowCreateMeetupForm] = useState<boolean>(false);

  // Fall back to internal geolocation if external location not provided
  const {
    location: internalLocation,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useGeolocation({
    timeout: 15000,
    retryCount: 1,
    useCaching: true,
    maximumAge: 30000,
  });

  // Use external location if available, otherwise use internal location
  const location = externalLocation || internalLocation;

  const { online } = useOnlineStatus();
  const { registerFloatingWindow } = useComponentRegistry();

  useEffect(() => {
    if (location) {
      setMapCenter([location.latitude, location.longitude]);
      setMapZoom(13);
    }
  }, [location]);

  useEffect(() => {
    // Keep the internal and external selected locations in sync
    if (externalSelectedLocation !== undefined) {
      setSelectedLocation(externalSelectedLocation);
    }
  }, [externalSelectedLocation]);

  useEffect(() => {
    if (locationError) {
      setError(
        typeof locationError === 'string'
          ? locationError
          : locationError instanceof Error
            ? locationError.message
            : 'Unknown location error'
      );
    }
  }, [locationError]);

  const handleMapClick = useCallback(
    (e: { latlng: { lat: number; lng: number } }) => {
      if (!online) {
        setError('You are currently offline. Please check your internet connection.');
        return;
      }

      const { lat, lng } = e.latlng;
      const newLocation: ILocation = {
        latitude: lat,
        longitude: lng,
        address: 'Selected location',
      };

      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);
    },
    [online, onLocationSelect]
  );

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    onMapReady?.();
  }, [onMapReady]);

  const handleMapMove = useCallback((e: { latlng: { lat: number; lng: number } }) => {
    const { lat, lng } = e.latlng;
    setMapCenter([lat, lng]);
  }, []);

  const handleRefreshLocation = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleCreateMeetupClick = useCallback(() => {
    setShowCreateMeetupForm(true);
  }, []);

  const handleCreateMeetupClose = useCallback(
    (meetup?: IMeetup) => {
      setShowCreateMeetupForm(false);
      if (meetup && onClose) {
        // Close the location selection after creating a meetup
        onClose();
      }
    },
    [onClose]
  );

  const handleMeetupClick = useCallback(
    (meetup: IMeetup) => {
      // Get location from meetup
      if (meetup.location) {
        // Convert meetup location to ILocation if needed
        const meetupLocation: ILocation = {
          latitude:
            typeof meetup.location === 'object'
              ? meetup.location.latitude || (meetup.location as any).lat || 0
              : 0,
          longitude:
            typeof meetup.location === 'object'
              ? meetup.location.longitude || (meetup.location as any).lng || 0
              : 0,
          address:
            typeof meetup.location === 'object'
              ? meetup.location.address || (meetup as any).address || 'Meetup location'
              : 'Meetup location',
        };

        setSelectedLocation(meetupLocation);
        onLocationSelect(meetupLocation);
      }
    },
    [onLocationSelect]
  );

  if (!externalLocation && isLocationLoading) {
    return <Spinner />;
  }

  if (!externalLocation && locationError) {
    return (
      <div className="map-error p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-800">Location Error</h3>
        <p className="mt-2 text-red-700">{error || 'Unable to get your location'}</p>
        <button
          onClick={handleRefreshLocation}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Refresh Location
        </button>
      </div>
    );
  }

  return (
    <div className={`relative h-screen ${className}`}>
      <MapWrapper
        center={mapCenter}
        zoom={mapZoom}
        onMapClick={handleMapClick}
        onMapMove={handleMapMove}
        onMapReady={handleMapReady}
      >
        {children}

        {location && (
          <div className="user-location-marker">
            {/* User location marker would go here - rendered by map library */}
          </div>
        )}

        {selectedLocation && (
          <div className="selected-location-marker">
            {/* Selected location marker would go here - rendered by map library */}
          </div>
        )}

        {meetups &&
          meetups.map(meetup => (
            <div key={meetup.id} className="meetup-marker">
              {/* Meetup marker would go here - rendered by map library */}
            </div>
          ))}
      </MapWrapper>

      {/* Nearby Meetups Panel */}
      <FloatingWindowWrapper
        id="nearby-meetups"
        position="bottom-left"
        isVisible={isMapReady && !!location}
        className="bg-white shadow-lg rounded-lg p-4 max-w-xs"
      >
        {location && (
          <NearbyMeetups
            meetups={meetups}
            currentLocation={location}
            onMeetupClick={handleMeetupClick}
          />
        )}
      </FloatingWindowWrapper>

      {/* Selected Location Info */}
      <FloatingWindowWrapper
        id="location-info"
        position="top-right"
        isVisible={!!selectedLocation}
        className="bg-white shadow-lg rounded-lg p-4"
      >
        {selectedLocation && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Selected Location</h3>
            <p>Latitude: {selectedLocation.latitude.toFixed(6)}</p>
            <p>Longitude: {selectedLocation.longitude.toFixed(6)}</p>
            <p>Address: {selectedLocation.address}</p>

            {onCreateMeetup && (
              <button
                onClick={handleCreateMeetupClick}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Meetup Here
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            )}
          </div>
        )}
      </FloatingWindowWrapper>

      {/* Create Meetup Form */}
      {showCreateMeetupForm && selectedLocation && (
        <FloatingWindowWrapper
          id="create-meetup-form"
          position="center"
          isVisible={true}
          className="bg-white shadow-lg rounded-lg overflow-auto"
          style={{ maxHeight: '80vh', width: '90%', maxWidth: '500px' }}
        >
          <CreateMeetup
            onClose={handleCreateMeetupClose}
            initialLocation={{
              lat: selectedLocation.latitude,
              lng: selectedLocation.longitude,
              display_name: selectedLocation.address,
            }}
          />
        </FloatingWindowWrapper>
      )}

      {error && <ErrorNotification message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default MapContainer;
