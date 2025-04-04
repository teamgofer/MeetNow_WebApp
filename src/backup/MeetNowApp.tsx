import React, { useState, useEffect, useCallback } from 'react';
import type { ILocation } from '@/types/location';
import type { IMeetup } from '@/types/meetup';

import { useGeolocation } from '../hooks/useGeolocation';
import { useLogger } from '../hooks/useLogger';
import { useMeetups } from '../hooks/useMeetups';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

import { MapContainer } from './map/MapContainer';
import { useComponentRegistry } from './ui/ComponentRegistry';
import { ErrorNotification } from './ui/ErrorNotification';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { FloatingWindowWrapper, PinMarkerWrapper } from './wrappers';

const MeetNowApp: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useGeolocation({
    timeout: 15000, // 15 seconds timeout
    retryCount: 2, // Retry twice on failure
    useCaching: true, // Use location caching
    maximumAge: 60000, // Cache valid for 1 minute
  });
  const isOnline = useOnlineStatus();
  const { meetups, isLoading: isMeetupsLoading, error: meetupsError } = useMeetups(location);
  const { registerFloatingWindow, unregisterFloatingWindow } = useComponentRegistry();
  const logger = useLogger();

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (meetupsError) {
      setError(meetupsError);
    }
  }, [meetupsError]);

  const handleLocationSelect = useCallback((newLocation: ILocation) => {
    setSelectedLocation(newLocation);
  }, []);

  const handleCreateMeetup = useCallback(
    (meetup: IMeetup) => {
      // Handle meetup creation
      logger.info('Creating meetup:', meetup);
    },
    [logger]
  );

  const handleClose = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  if (error) {
    return <ErrorNotification error={error} onRetry={() => setError(null)} />;
  }

  if (isLocationLoading || isMeetupsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="meetnow-app">
      <MapContainer
        location={location}
        selectedLocation={selectedLocation}
        meetups={meetups}
        onLocationSelect={handleLocationSelect}
        onCreateMeetup={handleCreateMeetup}
        onClose={handleClose}
        isMapReady={isMapReady}
        onMapReady={() => setIsMapReady(true)}
      />
    </div>
  );
};

export default MeetNowApp;
