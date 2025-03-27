import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapWrapper, FloatingWindowWrapper, PinMarkerWrapper } from '../wrappers';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { ErrorNotification } from '../ui/ErrorNotification';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useComponentRegistry } from '../ui/ComponentRegistry';

const MapContainer = ({
  onLocationSelect,
  onMapReady,
  className,
  children
}) => {
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    location, 
    isLoading: isLocationLoading, 
    error: locationError,
    refresh: refreshLocation
  } = useGeolocation({ 
    timeout: 15000, // 15 seconds timeout
    retryCount: 1,  // Retry once on failure
    useCaching: true, // Use location caching
    maximumAge: 30000 // Cache valid for 30 seconds
  });
  const isOnline = useOnlineStatus();
  const { registerFloatingWindow, unregisterFloatingWindow } = useComponentRegistry();

  useEffect(() => {
    if (location) {
      setMapCenter([location.latitude, location.longitude]);
      setMapZoom(13);
    }
  }, [location]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  const handleMapClick = useCallback((e) => {
    if (!isOnline) {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }

    const { lat, lng } = e.latlng;
    const newLocation = {
      latitude: lat,
      longitude: lng,
      address: 'Selected location'
    };
    
    setSelectedLocation(newLocation);
    onLocationSelect(newLocation);
  }, [isOnline, onLocationSelect]);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    onMapReady?.();
  }, [onMapReady]);

  const handleMapMove = useCallback((e) => {
    const { lat, lng } = e.latlng;
    setMapCenter([lat, lng]);
  }, []);

  const handleRefreshLocation = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  if (isLocationLoading) {
    return <LoadingSpinner />;
  }

  if (locationError) {
    return (
      <div className="map-error">
        <h3>Location Error</h3>
        <p>{locationError}</p>
        <button onClick={handleRefreshLocation} className="refresh-btn">
          Refresh Location
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapWrapper
        center={mapCenter}
        zoom={mapZoom}
        onMapClick={handleMapClick}
        onMapMove={handleMapMove}
        onMapReady={handleMapReady}
      >
        {children}
        
        {location && (
          <PinMarkerWrapper
            id="user-location"
            position={[location.latitude, location.longitude]}
            popupContent={<div>Your location</div>}
            isVisible={true}
            zIndexOffset={1000}
          />
        )}
        
        {selectedLocation && (
          <PinMarkerWrapper
            id="selected-location"
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            popupContent={<div>{selectedLocation.address}</div>}
            isVisible={true}
            zIndexOffset={1001}
          />
        )}
      </MapWrapper>

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

MapContainer.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  onMapReady: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node
};

export default MapContainer; 
 
 
 
 
 