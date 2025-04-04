import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import Credits from './components/Credits';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import {
  FaMapMarkerAlt,
  FaCog,
  FaTimes,
  FaCompass,
  FaSearch,
  FaCheck,
  FaUser,
  FaSignOutAlt,
  FaCreditCard,
} from 'react-icons/fa';
import { searchLocations, locationRequestManager } from './utils/location-services';
import { createMeetup } from './utils/meetup';
import Auth from './components/Auth';

import DebugConsole from './components/debug/DebugConsole';
import ErrorBoundary from './components/ErrorBoundary';
import MapClickHandlerWithController from './components/map/MapClickHandlerWithController';
import MeetupImageUploader from './components/MeetupImageUploader';
import Profile from './components/Profile';
import { Button, Input, Card, CardContent } from './components/ui';
import { ComponentRegistryProvider } from './components/ui/ComponentRegistry';
import Loading from './components/ui/loading';
import { NearbyMeetups } from './components/ui/nearby-meetups';
import NearbyMeetupAlert from './components/ui/NearbyMeetupAlert';
import PersistentFloatingWindow from './components/ui/PersistentFloatingWindow';
import PersistentPinMarker from './components/ui/PersistentPinMarker';
import { isDevelopmentEnvironment } from './config';
import useLogger from './hooks/useLogger';
import Logger from './utils/Logger';
import MapNavigationController from './utils/MapNavigationController';

const AdminPage = lazy(() => import('./components/admin/AdminPage'));

// Define basic interfaces for our data structures
interface Location {
  lat: number;
  lng: number;
  display_name?: string;
  _source?: string;
  [key: string]: any; // For additional properties
}

interface Meetup {
  id?: string;
  title: string;
  description: string;
  location: Location;
  address?: string;
  created_by?: string;
  created_at?: string;
  expires_at?: string;
  image_url?: string;
  [key: string]: any; // For additional properties
}

interface User {
  id: string;
  email: string;
  [key: string]: any; // For additional properties
}

// Map reference handling component
const MapInitializer: React.FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
};

const MeetNowApp: React.FC = () => {
  // Initialize logger with component name
  const log = useLogger('MeetNowApp');

  // Main state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [location, setLocation] = useState<Location | null>(null); // Start with null instead of arbitrary location
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSignedUrl, setImageSignedUrl] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [meetupCreated, setMeetupCreated] = useState<boolean>(false);
  const [nearbyMeetups, setNearbyMeetups] = useState<Meetup[]>([]);
  const [nearbyMeetupsForNotification, setNearbyMeetupsForNotification] = useState<Meetup[]>([]);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(17);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [hadError, setHadError] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  // State for map functionality
  const [centerLocation, setCenterLocation] = useState<Location | null>(null);

  // Refs
  const locationBoxRef = useRef<HTMLDivElement>(null);
  const meetupsIntervalRef = useRef<number | null>(null);
  const navigationController = useRef<any>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geolocationRequested = useRef<boolean>(false);
  const locationSourceRef = useRef<string>('initial'); // Track which source last updated location

  // Define map marker icons
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div style="width: 16px; height: 16px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  const pinIcon = L.divIcon({
    className: 'selected-location-marker',
    html: '<div style="width: 24px; height: 24px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 12px; height: 12px;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Centralized function to update location
  const updateAppLocation = useCallback((newLocation: Location, source: string): boolean => {
    if (
      !newLocation ||
      typeof newLocation.lat !== 'number' ||
      typeof newLocation.lng !== 'number'
    ) {
      console.warn('Invalid location provided to updateAppLocation:', newLocation);
      return false;
    }

    console.log(`Updating app location from source: ${source}`, newLocation);
    locationSourceRef.current = source;

    // Ensure the location has all required fields
    const normalizedLocation: Location = {
      ...newLocation,
      lat: newLocation.lat,
      lng: newLocation.lng,
      display_name: newLocation.display_name || 'Selected Location',
    };

    setLocation(normalizedLocation);
    return true;
  }, []);

  // Function to use mock location for development
  const useMockLocation = (): void => {
    console.log('Using mock location for development environment');
    const mockLocation: Location = {
      lat: 34.052235, // Los Angeles
      lng: -118.243683,
      display_name: 'Los Angeles, CA (Dev Mode)',
    };
    updateAppLocation(mockLocation, 'mock_location');
    setSelectedLocation(mockLocation);
    setIsLocationLoading(false);

    // Consider showing a development-only message
    if (isDevelopmentEnvironment) {
      setError(
        'Using mock location for development. Real geolocation is often blocked in localhost/development environments.'
      );
    }
  };

  // Initialize on component mount
  useEffect(() => {
    // Initialize with mock location for development
    if (isDevelopmentEnvironment) {
      useMockLocation();
    } else {
      // TODO: Implement real geolocation
      useMockLocation(); // Fallback for now
    }
  }, []);

  // Callback for when map is ready
  const handleMapReady = useCallback((map: L.Map) => {
    console.log('Map is ready');
    mapRef.current = map;
    setIsMapReady(true);

    // Initialize navigation controller with map reference
    if (navigationController.current) {
      navigationController.current.updateMapReference(map);
    }
  }, []);

  return (
    <div className="app bg-gray-50 min-h-screen">
      <ErrorBoundary>
        {isLocationLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <Loading />
              <p className="mt-4 text-gray-600">Getting your location...</p>
            </div>
          </div>
        ) : (
          <>
            {location && (
              <div className="relative h-screen">
                {/* Map Container */}
                <div className="absolute inset-0">
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={currentZoom}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <ZoomControl position="bottomleft" />

                    {/* Use the MapInitializer to handle map references */}
                    <MapInitializer onMapReady={handleMapReady} />

                    {/* User Location Marker */}
                    {location && <Marker position={[location.lat, location.lng]} icon={userIcon} />}

                    {/* Selected Location Marker */}
                    {selectedLocation && (
                      <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                        icon={pinIcon}
                      />
                    )}
                  </MapContainer>
                </div>

                {/* Basic UI Controls */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    className="bg-white p-3 rounded-full shadow-lg"
                    onClick={() => setShowProfile(!showProfile)}
                  >
                    <FaUser className="text-blue-500" />
                  </button>
                </div>

                {/* Display error message if any */}
                {error && (
                  <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 p-4 rounded-lg shadow">
                    <p className="text-red-700">{error}</p>
                    <button className="mt-2 text-blue-500" onClick={() => setError('')}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default MeetNowApp;
