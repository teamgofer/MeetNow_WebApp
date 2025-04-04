import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../global.css';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple, LatLngExpression, Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';

// Import map components
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Circle, Popup } from 'react-leaflet';
import UserLocationMarker from './map/UserLocationMarker';
import AnimatedUserLocationMarker from './map/AnimatedUserLocationMarker';
import MeetupMarker from './map/MeetupMarker';
import PinMarker from './map/PinMarker';
import MapClickHandler from './map/MapClickHandler';
import { IMeetup } from './map/MeetupMarkers';
import MemoizedMeetupMarker from './map/MemoizedMeetupMarker';
import DirectionsControl from './map/DirectionsControl';

// Import UI components
import { FaImage, FaMapMarkerAlt, FaCompass } from 'react-icons/fa';
import { FloatingWindowWrapper } from './wrappers';
import LocationSearch, { LocationSearchResult } from './search/LocationSearch';
import MeetupImageUploader from './MeetupImageUploader';
import { IMeetupCreateData } from '../types/meetup';
import {
  SelectedMeetupCard, // Kept for backward compatibility
  UnifiedMeetupCard,
  CardMode,
  CardWrapper,
  MultiModeMeetupCard,
  MeetupFormData,
} from './meetup';
import CountdownDisplay from './ui/CountdownDisplay';
import { NearbyMeetups } from './ui/nearby-meetups';
import GlobeIcon from './ui/GlobeIcon';

// Import API functions
import { getNearbyMeetups, createNewMeetup } from '../lib/supabase';
import { fromPostGISPoint } from '../lib/geo-utils';
import { getSignedUrlFromFullUrl } from '../utils/wasabi-storage';
import { getFeatureFlag } from '../utils/feature-flags';
import { refreshMeetupImageUrls } from '../utils/meetup/index';

// Import debug component
import CacheMonitor from './debug/CacheMonitor';

// Import new dependencies
import useDirections from '../hooks/useDirections';
import { TransportMode } from '../utils/routing-service';
import useBreakpoint from '../hooks/useBreakpoint';

// Interface for pinned locations
interface IPinnedLocation {
  id: string;
  position: LatLngExpression;
  title?: string;
  address?: string;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  isTemporary?: boolean;
}

// Default center position if user location isn't available
const DEFAULT_CENTER: LatLngTuple = [51.505, -0.09];
const DEFAULT_ZOOM = 13;

// Define marker icons - restored from original implementation
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

// Component to locate the user
const LocationDetector: React.FC<{
  onLocationFound: (pos: LatLngTuple, accuracy: number) => void;
  onLocationError: () => void; // Add error callback
}> = ({ onLocationFound, onLocationError }) => {
  const map = useMap();

  useEffect(() => {
    // Track whether we've already resolved the location
    let locationResolved = false;

    // Use a shorter timeout for fallback location - 5 seconds instead of 8
    const fallbackTimer = setTimeout(() => {
      // Only use fallback if we still haven't resolved location
      if (!locationResolved) {
        console.warn('Location detection timed out');
        onLocationError();
      }
    }, 5000); // 5 second timeout

    // Start both high and low accuracy requests in parallel

    // Try to locate the user with high accuracy
    map.locate({
      setView: false, // Don't set view automatically
      maxZoom: 20,
      enableHighAccuracy: true,
      watch: false,
      timeout: 4000, // 4 seconds timeout for high accuracy
      maximumAge: 1 * 60 * 1000, // 1 minute cache
    });

    // Also try locating with low accuracy (faster)
    setTimeout(() => {
      if (!locationResolved) {
        map.locate({
          setView: false,
          maxZoom: 19,
          enableHighAccuracy: false, // Low accuracy request
          watch: false,
          timeout: 3000, // 3 seconds timeout for low accuracy
          maximumAge: 5 * 60 * 1000, // 5 minutes cache
        });
      }
    }, 100); // Small delay to ensure this starts after the high accuracy request

    // Handle location found event
    const handleLocationFound = (e: L.LocationEvent) => {
      // Only use the location if we haven't resolved yet
      if (!locationResolved) {
        clearTimeout(fallbackTimer); // Clear the timeout
        locationResolved = true;

        const userPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
        onLocationFound(userPos, e.accuracy);

        // Set the view centered on the user's location with a fractional zoom level
        map.setView(userPos, 19.5);

        // Cache the location for future sessions
        try {
          sessionStorage.setItem(
            'cachedLocation',
            JSON.stringify({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              accuracy: e.accuracy,
              timestamp: Date.now(),
            })
          );
        } catch (err) {
          console.warn('Failed to cache location:', err);
        }
      }
    };

    // Handle location error event
    const handleLocationError = (e: L.ErrorEvent) => {
      console.warn('Location error:', e.message);
      // Don't trigger error handler here - wait for the fallback timer
      // This ensures we try all methods before falling back
    };

    // First try to use cached location if available
    try {
      const cachedLocationStr = sessionStorage.getItem('cachedLocation');
      if (cachedLocationStr) {
        const cachedLocation = JSON.parse(cachedLocationStr);
        const cacheAge = Date.now() - (cachedLocation.timestamp || 0);

        // Use cached location if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          locationResolved = true;
          clearTimeout(fallbackTimer);

          const userPos: LatLngTuple = [cachedLocation.lat, cachedLocation.lng];
          onLocationFound(userPos, cachedLocation.accuracy || 1000);

          // Set the view centered on the cached location with a fractional zoom level
          map.setView(userPos, 19.5);

          console.log('Using cached location');

          // Still try to get a more accurate location in the background
          map.locate({
            setView: false,
            maxZoom: 20,
            enableHighAccuracy: true,
            watch: false,
            timeout: 8000,
            maximumAge: 0, // Force fresh location
          });
        }
      }
    } catch (err) {
      console.warn('Error reading cached location:', err);
    }

    // Register event handlers
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    // Clean up when component unmounts
    return () => {
      clearTimeout(fallbackTimer);
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
      map.stopLocate(); // Stop watching location
    };
  }, [map, onLocationFound, onLocationError]);

  return null; // This component doesn't render anything
};

// Map initialization component
const MapInitializer: React.FC<{
  onMapReady: (map: LeafletMap) => void;
  onMapClick: (e: L.LeafletMouseEvent) => void;
}> = ({ onMapReady, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    // Call the onMapReady callback with the map reference
    onMapReady(map);

    // Set up click handler
    map.on('click', onMapClick);

    // Clean up
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapReady, onMapClick]);

  return null;
};

/**
 * Convert API meetup data to the IMeetup interface
 */
const convertToIMeetup = (meetup: any): IMeetup => {
  // Extract lat/lng using the utility function
  let lat = 0,
    lng = 0;

  if (meetup.location) {
    const position = fromPostGISPoint(meetup.location);
    lat = position.lat;
    lng = position.lng;
  } else {
    // Fall back to direct properties if available
    lat = meetup.lat || meetup.latitude || 0;
    lng = meetup.lng || meetup.longitude || meetup.lon || 0;
  }

  // Convert data structure to IMeetup format
  return {
    id: meetup.id || '',
    position: [lat, lng],
    title: meetup.title || 'Instant Meetup',
    description: meetup.description || null,
    address: meetup.address || 'Unknown location',
    distance: meetup.distance || 0,
    status: meetup.status || 'active',
    createdAt: meetup.created_at || new Date().toISOString(),
    expiresAt: meetup.expires_at || new Date(Date.now() + 3600000).toISOString(),
    image_url: meetup.image_url || null,
    signed_image_url: meetup.signed_image_url || null,
    // Add support for starts_at and duration_minutes
    starts_at: meetup.starts_at || meetup.created_at || new Date().toISOString(),
    duration_minutes: meetup.duration_minutes || 60,
  };
};

/**
 * Transform raw address data from Nominatim into a more relevant location name
 */
const transformAddressToLocationName = (data: any): string => {
  if (!data) return 'Unknown Location';

  // For fully formatted display_name from Nominatim
  if (data.display_name) {
    // Try to create a more relevant name from the address parts
    const parts = [];

    // If we have address details, use them to build a cleaner name
    if (data.address) {
      // Add the most relevant parts in order of specificity
      const relevantParts = [
        data.address.amenity,
        data.address.building,
        data.address.shop,
        data.address.leisure,
        data.address.tourism,
      ].filter(Boolean);

      // If we have a specific place name, use it
      if (relevantParts.length > 0) {
        parts.push(relevantParts[0]);
      }

      // Add location context (neighborhood, suburb, etc.)
      const locationContext = [
        data.address.road,
        data.address.neighbourhood,
        data.address.suburb,
        data.address.quarter,
      ].filter(Boolean);

      if (locationContext.length > 0) {
        parts.push(locationContext[0]);
      }

      // Add the city/town and region
      const cityPart =
        data.address.city || data.address.town || data.address.village || data.address.hamlet;
      if (cityPart) parts.push(cityPart);

      // Add state/region for context if in the US
      if (data.address.state && data.address.country_code === 'us') {
        parts.push(data.address.state);
      }

      // Always include the country for international context
      if (data.address.country) {
        parts.push(data.address.country);
      }
    }

    // If we couldn't build a good name from parts, fall back to display_name
    // but limit it to a reasonable length
    if (parts.length === 0) {
      const shortened = data.display_name.split(',').slice(0, 3).join(',');
      return shortened.length < 60 ? shortened : shortened.substring(0, 60) + '...';
    }

    return parts.join(', ');
  }

  // Fallback for raw coordinates
  if (data.lat && data.lon) {
    return `Location near (${parseFloat(data.lat).toFixed(4)}, ${parseFloat(data.lon).toFixed(4)})`;
  }

  return 'Selected Location';
};

// Location loading indicator component
const LocationLoadingIndicator: React.FC<{
  isLoading: boolean;
  isFallback: boolean;
}> = ({ isLoading, isFallback }) => {
  const [loadingMessage, setLoadingMessage] = useState<string>('Finding your location...');

  // Cycle through different loading messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = ['Finding your location...', 'Checking nearby meetups...', 'Almost there...'];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex] || 'Loading...');
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-90 z-50">
      <div className="text-center p-6 max-w-md">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{loadingMessage}</h2>
        <p className="text-gray-600 mb-4">
          {isFallback
            ? 'Using approximate location while we find you...'
            : "We're getting your exact position to center the map."}
        </p>
        <div className="w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main application component for MeetNow - Full Screen Map Version
 */
const MeetNowApp: React.FC = () => {
  // Get feature flags (kept for future feature toggles)
  // NOTE: All components now use UnifiedMeetupCard by default, but we keep these flags for backward compatibility
  const useEnhancedCard = getFeatureFlag('USE_ENHANCED_MEETUP_CARD');
  const useUnifiedCard = getFeatureFlag('USE_UNIFIED_CARD');
  const enableAnimations = getFeatureFlag('ENABLE_ANIMATIONS');

  // State from original app
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number>(0);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [selectedMeetupId, setSelectedMeetupId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState<IPinnedLocation | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [meetups, setMeetups] = useState<IMeetup[]>([]);
  const [meetupCreated, setMeetupCreated] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [isUsingFallbackLocation, setIsUsingFallbackLocation] = useState<boolean>(false);

  const mapRef = useRef<LeafletMap | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<string | null>(null);
  const mapInitialized = useRef<boolean>(false);

  // Add ref for tracking geocoding requests
  const geocodingRequestRef = useRef<AbortController | null>(null);

  // Additional CSS styles for toast animation - restored from original
  const toastAnimationStyle = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
    
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
    
    .user-location-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-location-marker::after {
      content: '';
      position: absolute;
      height: 40px;
      width: 40px;
      top: -12px;
      left: -12px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.4);
      animation: pulse 2s infinite ease-in-out;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      70% {
        transform: scale(1.5);
        opacity: 0;
      }
      100% {
        transform: scale(0.5);
        opacity: 0;
      }
    }

    /* Selected location marker */
    .selected-location-marker {
      z-index: 1001 !important;
      transition: transform 0.1s linear !important;
    }

    /* Meetup location marker styles */
    .meetup-location-marker {
      transition: all 0.2s ease-in-out !important;
      z-index: 900 !important;
    }
    
    .meetup-location-marker:hover, 
    .meetup-marker:hover {
      transform: scale(1.2);
      z-index: 1000 !important;
    }
    
    /* Standard meetup marker without image */
    .meetup-marker {
      transition: all 0.2s ease-in-out !important;
      z-index: 900 !important;
    }

    /* Improve marker rendering during animations */
    .leaflet-marker-icon,
    .leaflet-marker-shadow {
      transition: transform 0.15s ease-out !important;
      will-change: transform !important;
    }
    
    /* Custom scrollbar styling */
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 20px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: rgba(107, 114, 128, 0.7);
    }
    
    .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
      background-color: rgba(209, 213, 219, 0.7);
    }
    
    .scrollbar-track-transparent::-webkit-scrollbar-track {
      background: transparent;
    }

    /* Popup styling */
    .meetup-popup {
      max-width: 300px;
    }
    
    .meetup-popup-image img {
      transition: transform 0.3s ease;
    }
    
    .meetup-popup-image img:hover {
      transform: scale(1.05);
    }

    /* User location popup styling */
    .user-location-popup .leaflet-popup-content-wrapper {
      background-color: rgba(239, 246, 255, 0.95);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .user-location-popup .leaflet-popup-tip {
      background-color: rgba(239, 246, 255, 0.95);
    }
  `;

  // Use fallback locations for major cities
  const fallbackLocations = [
    { city: 'New York', coords: [40.7128, -74.006] as LatLngTuple },
    { city: 'Los Angeles', coords: [34.0522, -118.2437] as LatLngTuple },
    { city: 'Chicago', coords: [41.8781, -87.6298] as LatLngTuple },
    { city: 'London', coords: [51.5074, -0.1278] as LatLngTuple },
    { city: 'Tokyo', coords: [35.6762, 139.6503] as LatLngTuple },
  ];

  // Randomly select a fallback location
  const getRandomFallbackLocation = (): { coords: LatLngTuple; city: string } => {
    // We know we have fallback locations because we defined them above
    // But to make TypeScript happy, we'll add this check
    if (fallbackLocations.length === 0) {
      return { city: 'New York', coords: [40.7128, -74.006] as LatLngTuple };
    }

    // This is safe because we checked length above
    const randomIndex = Math.floor(Math.random() * fallbackLocations.length);
    // Use ! to tell TypeScript this will never be undefined
    return fallbackLocations[randomIndex]!;
  };

  // Add a new state for the selected meetup
  const [selectedMeetup, setSelectedMeetup] = useState<IMeetup | null>(null);

  // Add state for clicked location
  const [clickedLocation, setClickedLocation] = useState<LocationSearchResult | null>(null);

  // Add state for menu visibility (we'll use this later)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Add directions state with our custom hook
  const [directionsState, directionsActions] = useDirections({
    showAlternatives: true, // Show alternative routes
    autoRefresh: true, // Automatically refresh routes when transport mode changes
  });

  // Fetch nearby meetups function that can be called from various places
  const fetchNearbyMeetups = useCallback(
    async (customLocation?: { lat: number; lng: number }) => {
      // Use provided custom location or fall back to userLocation
      const location =
        customLocation || (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null);

      if (!location) {
        console.log('No location available to fetch meetups');
        return;
      }

      try {
        setIsLoading(true);
        console.log(`Fetching nearby meetups at (${location.lat}, ${location.lng})`);

        // Use the proper API function
        const result = await getNearbyMeetups(
          location.lat, // latitude
          location.lng, // longitude
          5000 // 5km radius
        );

        if (result.success && result.meetups) {
          console.log(`Found ${result.meetups.length} nearby meetups`);
          // Convert to IMeetup format
          const formattedMeetups = result.meetups.map(convertToIMeetup);

          // Handle background updates for meetup images
          const handleMeetupUpdate = (updatedMeetup: IMeetup, index: number) => {
            setMeetups(currentMeetups => {
              // Make sure we don't update if the meetups have changed
              if (!currentMeetups || index >= currentMeetups.length) return currentMeetups;

              // Create a new array to trigger re-render
              const newMeetups = [...currentMeetups];
              newMeetups[index] = updatedMeetup;
              return newMeetups;
            });
          };

          // Refresh signed URLs for visible meetups immediately, background load the rest
          const meetupsWithVisibleSignedUrls = await refreshMeetupImageUrls(
            formattedMeetups,
            86400, // 24 hour expiry
            5, // First 5 are considered visible
            handleMeetupUpdate // Callback for background updates
          );

          setMeetups(meetupsWithVisibleSignedUrls);
        } else {
          throw new Error(result.error || 'Failed to fetch meetups');
        }
      } catch (err) {
        console.error('Error fetching nearby meetups:', err);
        setError('Failed to fetch nearby meetups. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    [userLocation]
  );

  // Fetch nearby meetups when user location changes
  useEffect(() => {
    fetchNearbyMeetups();
  }, [userLocation, fetchNearbyMeetups]);

  // When a meetup is created, refresh the list of meetups
  useEffect(() => {
    if (meetupCreated) {
      // Fetch fresh data including the new meetup
      fetchNearbyMeetups();
    }
  }, [meetupCreated, fetchNearbyMeetups]);

  // Handle changing transportation mode
  const handleTransportModeChange = useCallback(
    (mode: TransportMode) => {
      directionsActions.setTransportMode(mode);
    },
    [directionsActions]
  );

  // Handle route selection
  const handleRouteSelect = useCallback(
    (index: number) => {
      directionsActions.setSelectedRouteIndex(index);
    },
    [directionsActions]
  );

  // Handle getting directions to a clicked location
  const handleGetDirections = useCallback(
    (location: LocationSearchResult) => {
      if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
        // Multi-point routing: Use first selected point as start and this location as end
        const start = directionsState.firstSelectedPoint;
        const destination: LatLngTuple = [location.lat, location.lon];

        // Show directions between first selected point and destination
        directionsActions.showDirections(start, destination);
        return;
      }

      if (!userLocation) {
        setError("Can't get directions: Your location is unknown");
        return;
      }

      if (directionsState.isDirectionsActive) {
        // "To Another Spot" was clicked - prepare for multi-point routing
        const firstPoint: LatLngTuple = [location.lat, location.lon];
        directionsActions.prepareMultiPointRoute(firstPoint);
        return;
      }

      // Standard routing: user location to destination
      const destination: LatLngTuple = [location.lat, location.lon];
      directionsActions.showDirections(userLocation, destination);
    },
    [userLocation, directionsActions, directionsState]
  );

  // Handle getting directions from the selected meetup card
  const handleMeetupDirections = useCallback(() => {
    if (!selectedMeetup || !selectedMeetup.position) {
      setError("Can't get directions: The meetup location is unknown");
      return;
    }

    // Extract position from meetup - handle different position formats
    let position: LatLngTuple;
    if (Array.isArray(selectedMeetup.position)) {
      // If it's already an array, use it directly
      position = selectedMeetup.position as LatLngTuple;
    } else if (
      typeof selectedMeetup.position === 'object' &&
      'lat' in selectedMeetup.position &&
      'lng' in selectedMeetup.position
    ) {
      // If it's a LatLng object, convert to tuple
      position = [selectedMeetup.position.lat, selectedMeetup.position.lng];
    } else {
      console.error('Invalid position format in meetup:', selectedMeetup.position);
      setError("Can't get directions: Invalid meetup location format");
      return;
    }

    console.log('Extracted position from meetup:', position);

    if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
      // Multi-point routing: Use first selected point as start and meetup as end
      directionsActions.showDirections(directionsState.firstSelectedPoint, position);
      return;
    }

    // Check if we had a previous route with a start point that wasn't the user location
    // This means we likely had another meetup selected as the starting point
    if (directionsState.isDirectionsActive && directionsState.startPoint) {
      // Check if start point is not the user location
      const isUserLocationStart = 
        userLocation &&
        Math.abs(directionsState.startPoint[0] - userLocation[0]) < 0.0001 &&
        Math.abs(directionsState.startPoint[1] - userLocation[1]) < 0.0001;
        
      if (!isUserLocationStart) {
        // We had another point selected, use it as the start for the new route
        console.log('Creating route from previous location to this meetup:', 
          directionsState.startPoint, position);
        directionsActions.showDirections(directionsState.startPoint, position);
        return;
      }
    }

    if (!userLocation) {
      setError("Can't get directions: Your location is unknown");
      return;
    }

    if (directionsState.isDirectionsActive) {
      // "To Another Spot" was clicked - prepare for multi-point routing
      directionsActions.prepareMultiPointRoute(position);
      return;
    }

    // Standard routing: user location to meetup
    directionsActions.showDirections(userLocation, position);
  }, [selectedMeetup, userLocation, directionsActions, directionsState]);

  // Handle user location found
  const handleUserLocationFound = useCallback((location: LatLngTuple, accuracy: number) => {
    setUserLocation(location);
    setUserAccuracy(accuracy);
    setIsLocationLoading(false);
    setIsUsingFallbackLocation(false);
    setError(null);
    console.log('User location found', location);
  }, []);

  // Handle user location error
  const handleUserLocationError = useCallback(() => {
    // Use San Francisco as a fixed fallback location
    const fallback = { city: 'San Francisco', coords: [37.7749, -122.4194] as LatLngTuple };
    console.log(`Using fallback location: ${fallback.city}`);

    // Use the fallback location
    setUserLocation(fallback.coords);
    setUserAccuracy(1000); // Set a large accuracy radius for fallback locations
    setIsLocationLoading(false);
    setIsUsingFallbackLocation(true);

    // Show a notification to the user
    setError(
      `We couldn't determine your exact location, so we're showing you meetups in ${fallback.city} instead.`
    );
  }, []);

  // Automatically timeout loading after 10 seconds as a safety measure
  useEffect(() => {
    if (isLocationLoading) {
      const timeoutId = setTimeout(() => {
        if (isLocationLoading) {
          handleUserLocationError();
        }
      }, 5000); // 5 second fallback timeout (reduced from 10 seconds)

      return () => clearTimeout(timeoutId);
    }
  }, [isLocationLoading, handleUserLocationError]);

  // Handle map ready
  const handleMapReady = useCallback((map: LeafletMap) => {
    // Prevent multiple initializations
    if (mapInitialized.current) {
      console.log('Map already initialized, skipping redundant initialization');
      return;
    }

    console.log('Map is ready now');
    mapRef.current = map;
    mapInitialized.current = true;
  }, []);

  // Handle image upload completed
  const handleImageUploaded = useCallback((imagePath: string, signedViewUrl: string) => {
    // Store the image path to be sent when creating the meetup
    fileRef.current = imagePath;

    // Display the preview using the signed URL
    setImagePreview(signedViewUrl);
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Cancel any pending reverse geocoding
      if (geocodingRequestRef.current) {
        geocodingRequestRef.current.abort();
        geocodingRequestRef.current = null;
      }

      const position: LatLngTuple = [e.latlng.lat, e.latlng.lng];

      // Clear selected items
      setSelectedMeetupId(null);
      setSelectedPinId(null);
      setSelectedMeetup(null);

      // Create a temporary pin at the clicked location
      const newTempPin: IPinnedLocation = {
        id: 'temp-pin',
        position: position,
        title: 'Selected Location',
        color: 'red',
        isTemporary: true,
        address: `Lat: ${position[0].toFixed(6)}, Lng: ${position[1].toFixed(6)}`, // Default address format
      };
      setTempPin(newTempPin);

      // Set reverse geocoding state flag
      setIsReverseGeocoding(true);

      // Handle multi-point routing if we're waiting for a second point
      if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
        console.log(
          'Map clicked while awaiting second point. Creating route from:',
          directionsState.firstSelectedPoint,
          'to:',
          position
        );
        directionsActions.showDirections(directionsState.firstSelectedPoint, position);
      }
      // Update route if directions are already active (and not in multi-point mode)
      else if (
        directionsState.isDirectionsActive &&
        userLocation &&
        !directionsState.awaitingSecondPoint
      ) {
        console.log(
          'Map clicked with active directions. Updating route from user location:',
          userLocation,
          'to:',
          position
        );
        directionsActions.showDirections(userLocation, position);
      }

      // Try to get better address using nominatim (OSM) directly instead of the API endpoint
      const encodedLat = encodeURIComponent(position[0].toString());
      const encodedLng = encodeURIComponent(position[1].toString());

      // Create a new abort controller for this request
      const abortController = new AbortController();
      geocodingRequestRef.current = abortController;

      // Use Nominatim directly (OSM's geocoding service)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodedLat}&lon=${encodedLng}&zoom=18&addressdetails=1`,
        {
          signal: abortController.signal,
        }
      )
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data) {
            // Transform the address data into a more relevant location name
            const locationName = transformAddressToLocationName(data);
            const fullAddress = data.display_name || locationName;

            // Update the search location with the full address for context
            setSearchLocation(fullAddress);

            // Use the transformed location name as the pin title for a more friendly display
            setTempPin(prev =>
              prev && prev.id === 'temp-pin'
                ? {
                    ...prev,
                    title: locationName,
                    address: fullAddress,
                  }
                : prev
            );

            // Set clicked location for MultiModeMeetupCard
            const locationData: LocationSearchResult = {
              display_name: fullAddress,
              lat: position[0],
              lon: position[1],
              address: data.address,
              _source: 'map', // Explicitly mark this as coming from a map click
            };
            setClickedLocation(locationData);

            // If we're awaiting a second point, immediately use it to complete the route
            if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
              directionsActions.showDirections(directionsState.firstSelectedPoint, position);
            }
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Error fetching address:', err);
          }
          // For aborted requests, we don't need to log or handle them
        })
        .finally(() => {
          if (geocodingRequestRef.current === abortController) {
            setIsReverseGeocoding(false);
            geocodingRequestRef.current = null;
          }
        });
    },
    [directionsState, directionsActions, userLocation, transformAddressToLocationName]
  );

  // Handle creating a meetup from the multi-mode card
  const handleCreateMeetupFromCard = useCallback(
    async (data: MeetupFormData & { location: LocationSearchResult }) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the position from the location
        const position: LatLngTuple = [data.location.lat, data.location.lon];

        // Prepare meetup data without the image first
        const meetupData: {
          title: string;
          description: string;
          location: { lat: number; lng: number };
          address: string;
          image?: string;
        } = {
          title: data.title,
          description: data.description,
          location: {
            lat: position[0],
            lng: position[1],
          },
          address: data.location.display_name,
        };

        // If we have an image_url from MeetupImageUploader, use that directly
        if (data.image_url) {
          meetupData.image = data.image_url;
        }
        // Otherwise, if there's an image file, upload it
        else if (data.image) {
          try {
            // Generate a unique path for the image
            const timestamp = Date.now();
            const extension = data.image.name.split('.').pop()?.toLowerCase() || 'file';
            const path = `meetups/meetup_${timestamp}.${extension}`;

            // Import the wasabi-storage module directly
            const wasabiStorage = await import('../utils/wasabi-storage');

            // Use getUploadPresignedUrl and then upload manually since we don't have direct access to uploadFile
            const uploadUrlResult = await wasabiStorage.getUploadPresignedUrl(
              data.image.type,
              path
            );

            if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
              throw new Error(uploadUrlResult.error || 'Failed to generate upload URL');
            }

            // Upload the file
            const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
              method: 'PUT',
              body: data.image,
              headers: {
                'Content-Type': data.image.type,
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            // Use the path from the result
            if (uploadUrlResult.path) {
              meetupData.image = uploadUrlResult.path;
            }
          } catch (uploadError) {
            console.error('Error during image upload:', uploadError);
            // Continue creating meetup without image if upload fails
          }
        }

        // Create the meetup
        const result = await createNewMeetup(meetupData);

        if (result.success && result.meetup) {
          // Signal that a meetup was created (this will trigger a refresh)
          setMeetupCreated(true);

          // Reset form state
          setTitle('');
          setDescription('');
          setImagePreview(null);
          fileRef.current = null;

          // Clear temporary pin
          setTempPin(null);
          setClickedLocation(null);

          // Fetch nearby meetups to ensure new one shows up
          fetchNearbyMeetups();

          // Reset the created flag after a short delay
          setTimeout(() => {
            setMeetupCreated(false);
          }, 3000);
        } else if (!result.success) {
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('Error creating meetup:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while creating the meetup');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [createNewMeetup, fetchNearbyMeetups]
  );

  // Handle meetup click from nearby list
  const handleMeetupClick = useCallback(
    (meetupId: string) => {
      // Find the selected meetup
      const meetup = meetups.find(m => m.id === meetupId);
      if (!meetup) return;

      // Clear temporary pin if exists
      setTempPin(null);

      // Set as selected meetup
      setSelectedMeetupId(meetupId);
      setSelectedPinId(null);
      setClickedLocation(null);
      setSelectedMeetup(meetup);

      // Extract position from meetup - handle different position formats
      let position: LatLngTuple;
      if (Array.isArray(meetup.position)) {
        // If it's already an array, use it directly
        position = meetup.position as LatLngTuple;
      } else if (
        typeof meetup.position === 'object' &&
        'lat' in meetup.position &&
        'lng' in meetup.position
      ) {
        // If it's a LatLng object, convert to tuple
        position = [meetup.position.lat, meetup.position.lng];
      } else {
        console.error('Invalid position format in meetup:', meetup.position);
        setError("Can't use meetup: Invalid location format");
        return;
      }

      // If awaiting second point for multi-point routing, use this meetup as the end point
      if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
        console.log(
          'Meetup clicked while awaiting second point. Creating route from:',
          directionsState.firstSelectedPoint,
          'to meetup:',
          position
        );
        directionsActions.showDirections(directionsState.firstSelectedPoint, position);
        return;
      }

      // Check if a previous meetup was selected with active directions
      if (directionsState.isDirectionsActive && selectedMeetup && selectedMeetup.position) {
        // Extract the previous meetup's position
        let prevPosition: LatLngTuple;
        if (Array.isArray(selectedMeetup.position)) {
          prevPosition = selectedMeetup.position as LatLngTuple;
        } else if (
          typeof selectedMeetup.position === 'object' &&
          'lat' in selectedMeetup.position &&
          'lng' in selectedMeetup.position
        ) {
          prevPosition = [selectedMeetup.position.lat, selectedMeetup.position.lng];
        } else {
          console.error('Invalid position format in previous meetup:', selectedMeetup.position);
          setError("Can't get directions: Invalid meetup location format");
          return;
        }

        // Create route from previous meetup to this meetup
        console.log('Creating route from previous meetup to current meetup:', prevPosition, position);
        directionsActions.showDirections(prevPosition, position);
        return;
      }

      // If directions are already active and we have user location, update the destination
      if (directionsState.isDirectionsActive && userLocation) {
        // If "To Another Spot" was clicked previously, prepare for multi-point routing
        if (directionsState.isDirectionsActive && !directionsState.awaitingSecondPoint) {
          console.log(
            'Meetup clicked with active directions. Preparing for multi-point route with first point:',
            position
          );
          directionsActions.prepareMultiPointRoute(position);
        } else {
          // Normal update from user location to this meetup
          directionsActions.showDirections(userLocation, position);
        }
      }

      // Smoothly fly to the meetup location with animation (for list clicks)
      if (mapRef.current && meetup.position) {
        // Get position coordinates - position is a [lat, lng] tuple

        // Check if position is valid
        if (position && position.length === 2) {
          // Use a gentler flyTo animation with the current zoom level
          const currentZoom = mapRef.current.getZoom();
          mapRef.current.flyTo(
            position,
            currentZoom, // Maintain current zoom level instead of a fixed level
            {
              animate: true,
              duration: 1.5, // Moderate duration
              easeLinearity: 0.15, // Moderate easing
            }
          );
        }
      }
    },
    [meetups, userLocation, directionsState, directionsActions, setError, selectedMeetup]
  );

  // Handle meetup click from map marker - no fly animation
  const handleMapMarkerClick = useCallback(
    (meetupId: string) => {
      // Find the selected meetup
      const meetup = meetups.find(m => m.id === meetupId);
      if (!meetup) return;

      // Clear temporary pin if exists
      setTempPin(null);

      // Set as selected meetup but don't move the map
      setSelectedMeetupId(meetupId);
      setSelectedPinId(null);
      setClickedLocation(null);
      setSelectedMeetup(meetup);

      // Extract position from meetup - handle different position formats
      let position: LatLngTuple;
      if (Array.isArray(meetup.position)) {
        // If it's already an array, use it directly
        position = meetup.position as LatLngTuple;
      } else if (
        typeof meetup.position === 'object' &&
        'lat' in meetup.position &&
        'lng' in meetup.position
      ) {
        // If it's a LatLng object, convert to tuple
        position = [meetup.position.lat, meetup.position.lng];
      } else {
        console.error('Invalid position format in meetup:', meetup.position);
        setError("Can't use meetup: Invalid location format");
        return;
      }

      // If awaiting second point for multi-point routing, use this meetup as the end point
      if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
        console.log(
          'Meetup marker clicked while awaiting second point. Creating route from:',
          directionsState.firstSelectedPoint,
          'to meetup:',
          position
        );
        directionsActions.showDirections(directionsState.firstSelectedPoint, position);
        return;
      }

      // Check if a previous meetup was selected with active directions
      if (directionsState.isDirectionsActive && selectedMeetup && selectedMeetup.position) {
        // Extract the previous meetup's position
        let prevPosition: LatLngTuple;
        if (Array.isArray(selectedMeetup.position)) {
          prevPosition = selectedMeetup.position as LatLngTuple;
        } else if (
          typeof selectedMeetup.position === 'object' &&
          'lat' in selectedMeetup.position &&
          'lng' in selectedMeetup.position
        ) {
          prevPosition = [selectedMeetup.position.lat, selectedMeetup.position.lng];
        } else {
          console.error('Invalid position format in previous meetup:', selectedMeetup.position);
          setError("Can't get directions: Invalid meetup location format");
          return;
        }

        // Create route from previous meetup to this meetup
        console.log('Creating route from previous meetup to current meetup:', prevPosition, position);
        directionsActions.showDirections(prevPosition, position);
        return;
      }

      // If directions are already active and we have user location, update the destination
      if (directionsState.isDirectionsActive && userLocation) {
        // If "To Another Spot" was clicked previously, prepare for multi-point routing
        if (directionsState.isDirectionsActive && !directionsState.awaitingSecondPoint) {
          console.log(
            'Meetup marker clicked with active directions. Preparing for multi-point route with first point:',
            position
          );
          directionsActions.prepareMultiPointRoute(position);
        } else {
          // Normal update from user location to this meetup
          directionsActions.showDirections(userLocation, position);
        }
      }

      // No map movement for marker clicks
    },
    [meetups, userLocation, directionsState, directionsActions, setError, selectedMeetup]
  );

  // Handle closing the multi-mode card
  const handleCloseMultiModeCard = useCallback(() => {
    setClickedLocation(null);
    setTempPin(null);
  }, []);

  // Handle closing the selected meetup card
  const handleCloseSelectedMeetup = useCallback(() => {
    setSelectedMeetup(null);
    setSelectedMeetupId(null);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      {/* Globe Icon */}
      <GlobeIcon onClick={() => setIsMenuOpen(prev => !prev)} className="animate-fade-in" />

      {/* Map container */}
      <div className="relative w-full h-screen">
        {/* Always show the map, even during loading */}
      <MapContainer
          center={userLocation || DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          zoomSnap={0.25}
          zoomDelta={0.25}
        >
          {/* Custom zoom control in the bottom right */}
          <ZoomControl position="bottomright" />

          {/* Add tile layer (map) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Location detector component */}
          <LocationDetector
            onLocationFound={handleUserLocationFound}
            onLocationError={handleUserLocationError}
          />

          {/* Map initializer component */}
          <MapInitializer onMapReady={handleMapReady} onMapClick={handleMapClick} />

          {/* User location marker - now using the animated version */}
          {userLocation && (
            <AnimatedUserLocationMarker position={userLocation} accuracy={userAccuracy} showPopup={false} />
          )}

          {/* Directions control */}
          {directionsState.isDirectionsActive &&
            directionsState.startPoint &&
            directionsState.endPoint && (
              <DirectionsControl
                start={directionsState.startPoint}
                end={directionsState.endPoint}
                isVisible={directionsState.isDirectionsActive}
                isLoading={directionsState.isLoading}
                error={directionsState.error}
                routeData={directionsState.routeData}
                transportMode={directionsState.transportMode}
                selectedRouteIndex={directionsState.selectedRouteIndex}
                showAlternatives={true}
                awaitingSecondPoint={directionsState.awaitingSecondPoint}
                onRouteFound={directionsActions.setRouteData}
                onClose={directionsActions.hideDirections}
                onTransportModeChange={handleTransportModeChange}
                onRouteSelect={handleRouteSelect}
                onCancelMultiPointRoute={directionsActions.cancelMultiPointRoute}
              />
            )}

          {/* Display meetup markers */}
          {meetups.map(meetup => {
            // Create a custom icon for meetups with images - use the signed_image_url with priority
            const imageUrl = meetup.signed_image_url || meetup.image_url;

            return (
              <MemoizedMeetupMarker
                key={`meetup-marker-${meetup.id}`}
                id={meetup.id}
                position={meetup.position}
                title={meetup.title || 'Meetup'}
                description={meetup.description || ''}
                address={meetup.address || ''}
                distance={meetup.distance || 0}
                expiresAt={meetup.expiresAt || ''}
                createdAt={meetup.createdAt || ''}
                status={meetup.status || 'active'}
                onClick={id => handleMapMarkerClick(id)}
                selected={selectedMeetupId === meetup.id}
                showPopup={false} // Don't show popup since we now use the card
                imageUrl={imageUrl}
              />
            );
          })}

          {/* Display temporary pin marker */}
          {tempPin && (
            <PinMarker
              key={`pin-marker-${tempPin.id}`}
              id={tempPin.id}
              position={tempPin.position}
              title={tempPin.title || 'Pin'}
              address={tempPin.address || ''}
              color={tempPin.color || 'red'}
              isTemporary={tempPin.isTemporary || false}
              icon={pinIcon}
              onClick={() => {}}
              selected={true}
              showPopup={true}
            />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {isLocationLoading && (
          <LocationLoadingIndicator
            isLoading={isLocationLoading}
            isFallback={isUsingFallbackLocation}
          />
        )}

        {/* Nearby Meetups Panel */}
        {!isLocationLoading && userLocation && (
          <div className="absolute bottom-4 right-4 z-40 w-96 transition-all duration-300">
            <NearbyMeetups
              meetups={meetups.map(m => ({
                id: m.id,
                location: {
                  lat: Array.isArray(m.position) ? m.position[0] : 0,
                  lng: Array.isArray(m.position) ? m.position[1] : 0,
                },
                address: m.address,
                title: m.title,
                description: m.description,
                created_at: m.createdAt,
                expires_at: m.expiresAt,
                status: m.status === 'expired' ? 'cancelled' : 'active',
              }))}
              currentLocation={{
                lat: userLocation[0],
                lng: userLocation[1],
              }}
              currentMeetupId={selectedMeetupId || undefined}
              className="shadow-xl rounded-lg overflow-hidden"
              onMeetupSelect={id => handleMeetupClick(id)}
            />
          </div>
        )}

        {/* Display clicked location card */}
        {clickedLocation && (
          <CardWrapper position="top">
            <UnifiedMeetupCard
              locationData={clickedLocation}
              mode={CardMode.LOCATION_DISPLAY}
              onClose={handleCloseMultiModeCard}
              onDirections={() => {
                // Even if directions are already active, call the same handler
                // The directionsActions.showDirections method handles updating existing routes
                handleGetDirections(clickedLocation);
              }}
              onCreateMeetup={async formData => {
                await handleCreateMeetupFromCard(formData);
              }}
              isLoading={isLoading}
              isDirectionsActive={directionsState.isDirectionsActive}
              awaitingSecondPoint={directionsState.awaitingSecondPoint}
            />
          </CardWrapper>
        )}

        {/* Display selected meetup card */}
        {selectedMeetup && (
          <CardWrapper position="top">
            <UnifiedMeetupCard
              meetup={selectedMeetup}
              mode={CardMode.MEETUP_DISPLAY}
              onClose={handleCloseSelectedMeetup}
              onDirections={() => {
                // The handleMeetupDirections already has logic to update the route
                // if directions are active
                handleMeetupDirections();
              }}
              isLoading={isLoading}
              isDirectionsActive={directionsState.isDirectionsActive}
              awaitingSecondPoint={directionsState.awaitingSecondPoint}
            />
          </CardWrapper>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg px-6 py-4 max-w-md flex items-start space-x-4">
              <div className="text-red-500 flex-shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                {isUsingFallbackLocation && (
                  <p className="mt-1 text-xs text-red-700">
                    We're showing you a general area instead of your exact location.
                  </p>
                )}
              </div>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Location fallback notification */}
        {isUsingFallbackLocation && !error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg px-6 py-4 max-w-md flex items-start space-x-4">
              <div className="text-blue-500 flex-shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Using approximate location</h3>
                <p className="mt-1 text-xs text-blue-700">
                  We couldn't determine your exact location, so we're showing you a general area
                  instead.
                </p>
              </div>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => setIsUsingFallbackLocation(false)}
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Add cache monitor to track performance in development */}
      <CacheMonitor />
    </div>
  );
};

export default MeetNowApp; 
 