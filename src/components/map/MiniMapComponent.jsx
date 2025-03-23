import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import Logger from '../../utils/Logger';

// Mini-map updater component to sync with external changes
const MiniMapUpdater = ({ center, zoom, onMapClick }) => {
  const map = useMap();
  
  // Update the map when props change
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: false });
    }
  }, [map, center, zoom]);
  
  // Set up click handler
  useEffect(() => {
    if (!map || !onMapClick) return;
    
    const handleClick = () => {
      onMapClick();
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

/**
 * MiniMapComponent - A small overview map that shows the current location
 * and allows users to click to reset the main map view.
 */
const MiniMapComponent = ({ 
  userLocation, 
  selectedLocation, 
  onModeChange,
  zoom = 16,
  width = '100%',
  height = '150px',
  navigationController
}) => {
  const [mapCenter, setMapCenter] = useState(null);
  const mapRef = useRef(null);
  
  // Update center when locations change
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng]);
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation, selectedLocation]);
  
  // Create a click handler for the entire container
  const handleContainerClick = () => {
    // Handle the click based on whether we have a navigation controller
    if (navigationController) {
      Logger.info('MiniMapComponent', 'MiniMap clicked - using navigation controller to navigate to selected location');
      
      // Set to Free Navigation mode
      navigationController.setNavigationMode(1);
      
      // Navigate to the selected location with a high zoom
      if (selectedLocation) {
        navigationController.flyTo([selectedLocation.lat, selectedLocation.lng], 19, {
          animate: true,
          duration: 0.75
        });
      }
      // Fall back to user location if no selected location
      else if (userLocation) {
        navigationController.flyTo([userLocation.lat, userLocation.lng], 19, {
          animate: true,
          duration: 0.75
        });
      }
    } else if (onModeChange) {
      // Fall back to onModeChange for compatibility
      Logger.info('MiniMapComponent', 'MiniMap clicked - using onModeChange callback');
      onModeChange(1); // Set to free navigation mode
    }
  };
  
  if (!mapCenter) {
    return <div className="mini-map-placeholder" style={{ width, height }} />;
  }
  
  return (
    <div 
      style={{ width, height, cursor: 'pointer' }}
      onClick={handleContainerClick}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '4px' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          crossOrigin="anonymous"
        />
        
        <MiniMapUpdater 
          center={mapCenter}
          zoom={zoom}
          onMapClick={handleContainerClick}
        />
        
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker-mini',
              html: '<div style="width: 12px; height: 12px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })}
          />
        )}
        
        {selectedLocation && (selectedLocation.lat !== userLocation.lat || selectedLocation.lng !== userLocation.lng) && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={L.divIcon({
              className: 'selected-location-marker-mini',
              html: '<div style="width: 12px; height: 12px; background-color: #ef4444; border: 2px solid white; border-radius: 50%;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })}
          />
        )}
      </MapContainer>
      
      {/* Overlay indicating it's clickable */}
      <div 
        className="mini-map-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          cursor: 'pointer',
          pointerEvents: 'none'
        }}
      />
      
      {/* Mini-map custom styles */}
      <style>{`
        .mini-map-user-dot {
          width: 12px;
          height: 12px;
          background-color: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .mini-map-selected-dot {
          width: 14px;
          height: 14px;
          background-color: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
        }
        
        .mini-map-container:hover .mini-map-overlay {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

MiniMapComponent.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  onModeChange: PropTypes.func,
  zoom: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  navigationController: PropTypes.object
};

export default MiniMapComponent; 