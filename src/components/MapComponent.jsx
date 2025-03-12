import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { createMapIcons } from '@/utils/map-icons';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import MapTroubleshooter from './MapTroubleshooter';
import PropTypes from 'prop-types';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLibreGeolocation from './MapLibreGeolocation';
import { searchLocations } from '@/utils/location-services';
import L from 'leaflet';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Map rendering error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-600 font-medium">Map Loading Failed</h3>
          <p className="text-sm text-red-500 mt-1">
            Please check browser permissions, internet connection, and disable any ad-blockers.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Create custom icons
const icons = {
  userIcon: new L.Icon({
    iconUrl: '/user-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  meetupIcon: new L.Icon({
    iconUrl: '/meetup-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
};

// Component to update map center
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], map.getZoom(), {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);

  return null;
};

// Component to handle location selection
const LocationMarker = ({ onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      try {
        // Reverse geocode the coordinates to get the address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        onLocationSelect({
          lat: lat,
          lon: lng,
          display_name: data.display_name || 'Selected Location',
          address: data.display_name
        });
      } catch (error) {
        console.error('Error getting address:', error);
        onLocationSelect({
          lat: lat,
          lon: lng,
          display_name: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      }
    });

    return () => {
      map.off('click');
    };
  }, [map, onLocationSelect]);

  return null;
};

const MapComponent = ({ location, matchedMeetups = [], onLocationSelect }) => {
  const [currentCenter, setCurrentCenter] = useState(location);
  const mapRef = useRef(null);

  // Update center when location changes
  useEffect(() => {
    setCurrentCenter(location);
  }, [location]);

  // Fit bounds to show all nearby meetups
  useEffect(() => {
    if (mapRef.current && matchedMeetups.length > 0) {
      const map = mapRef.current;
      const bounds = L.latLngBounds([location]);
      
      matchedMeetups.forEach(meetup => {
        if (meetup.location?.lat && meetup.location?.lng) {
          bounds.extend([meetup.location.lat, meetup.location.lng]);
        }
      });

      // Add some padding to the bounds
      map.fitBounds(bounds.pad(0.1));
    }
  }, [matchedMeetups, location]);

  return (
    <ErrorBoundary>
      <div className="map-container relative" style={{ height: '100vh' }}>
        <MapContainer
          center={[currentCenter.lat, currentCenter.lng]}
          zoom={16}
          style={{ height: '100vh', width: '100%' }}
          ref={mapRef}
          doubleClickZoom={false}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <MapUpdater center={currentCenter} />
          <LocationMarker onLocationSelect={onLocationSelect} />
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* User location marker */}
          <Marker 
            position={[currentCenter.lat, currentCenter.lng]} 
            icon={icons.userIcon}
          >
            <Popup>Your Location</Popup>
          </Marker>

          {/* Meetup markers */}
          {matchedMeetups.map((meetup) => (
            <Marker 
              key={meetup.id}
              position={[meetup.location.lat, meetup.location.lng]} 
              icon={icons.meetupIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold mb-1">{meetup.address || 'Meeting Point'}</p>
                  <p className="text-gray-600">
                    {meetup.distance ? `${(meetup.distance * 1000).toFixed(0)}m away` : ''}
                  </p>
                  <p className="text-gray-600">
                    Expires: {new Date(meetup.expires_at).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
};

MapComponent.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  location: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired,
  matchedMeetups: PropTypes.arrayOf(
    PropTypes.shape({
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired
      }).isRequired,
      availability: PropTypes.string.isRequired,
      selectedPlace: PropTypes.string,
      boost: PropTypes.bool
    })
  ).isRequired
};

export default MapComponent;