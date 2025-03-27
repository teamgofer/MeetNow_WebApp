import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer } from './map/MapContainer';
import { FloatingWindowWrapper, PinMarkerWrapper } from './wrappers';
import { useGeolocation } from '../hooks/useGeolocation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useMeetups } from '../hooks/useMeetups';
import { ErrorNotification } from './ui/ErrorNotification';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useComponentRegistry } from './ui/ComponentRegistry';
import { useLogger } from '../hooks/useLogger';

const MeetNowApp = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const { 
    location, 
    isLoading: isLocationLoading, 
    error: locationError,
    refresh: refreshLocation
  } = useGeolocation({ 
    timeout: 15000, // 15 seconds timeout
    retryCount: 2,  // Retry twice on failure
    useCaching: true, // Use location caching
    maximumAge: 60000 // Cache valid for 1 minute
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

  const handleLocationSelect = useCallback((newLocation) => {
    setSelectedLocation(newLocation);
    logger.info('Location selected', { location: newLocation });
  }, [logger]);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    logger.info('Map ready');
  }, [logger]);

  const handleRefreshLocation = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  if (isLocationLoading) {
    return <LoadingSpinner />;
  }

  if (locationError) {
    return (
      <div className="error-container">
        <h2>Location Error</h2>
        <p>{locationError}</p>
        <button onClick={handleRefreshLocation}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        onLocationSelect={handleLocationSelect}
        onMapReady={handleMapReady}
        className="w-full h-full"
      >
        {meetups?.map(meetup => (
          <PinMarkerWrapper
            key={meetup.id}
            id={`meetup-${meetup.id}`}
            position={[meetup.latitude, meetup.longitude]}
            popupContent={
              <div>
                <h3 className="font-semibold">{meetup.title}</h3>
                <p>{meetup.description}</p>
                <p>Time: {new Date(meetup.time).toLocaleString()}</p>
              </div>
            }
            isVisible={true}
            zIndexOffset={1002}
          />
        ))}
      </MapContainer>

      <FloatingWindowWrapper
        id="meetup-info"
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
          </div>
        )}
      </FloatingWindowWrapper>

      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

MeetNowApp.propTypes = {};

export default MeetNowApp; 
 
 
 
 
 