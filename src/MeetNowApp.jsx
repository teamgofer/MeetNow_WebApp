import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button, Input, Card, CardContent } from './components/ui';
import Loading from './components/ui/loading';
import NearbyMeetups from './components/ui/nearby-meetups';
import NearbyMeetupAlert from './components/ui/NearbyMeetupAlert';
import { FaMapMarkerAlt, FaCog, FaTimes, FaCompass, FaSearch, FaCheck, FaUser, FaSignOutAlt, FaCreditCard } from 'react-icons/fa';
import { createFreeMeetup, getNearbyFreeMeetups } from '@/utils/meetup';
import { searchLocations, locationRequestManager } from '@/utils/location-services';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Credits from './components/Credits';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon 
} from 'lucide-react';
import Logger from './utils/Logger';
import useLogger from './hooks/useLogger';
import MapNavigationController from './utils/MapNavigationController';
import DebugConsole from './components/debug/DebugConsole';
import MapClickHandlerWithController from './components/map/MapClickHandlerWithController';
import MeetupImageUploader from './components/MeetupImageUploader';
import { ComponentRegistryProvider } from './components/ui/ComponentRegistry';
import PersistentFloatingWindow from './components/ui/PersistentFloatingWindow';
import PersistentPinMarker from './components/ui/PersistentPinMarker';
import { isDevelopmentEnvironment } from './config';

const AdminPage = lazy(() => import('./components/admin/AdminPage'));

const MeetNowApp = () => {
  // Initialize logger with component name
  const log = useLogger('MeetNowApp');

  // Main state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null); // Start with null instead of arbitrary location
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSignedUrl, setImageSignedUrl] = useState(null);
  const [address, setAddress] = useState('');
  const [meetupCreated, setMeetupCreated] = useState(false);
  const [nearbyMeetups, setNearbyMeetups] = useState([]);
  const [nearbyMeetupsForNotification, setNearbyMeetupsForNotification] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(17);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  
  // State for map functionality
  const [centerLocation, setCenterLocation] = useState(null);
  
  // Refs
  const locationBoxRef = useRef(null);
  const meetupsIntervalRef = useRef(null);
  const navigationController = useRef(null);
  const mapRef = useRef(null);
  const geolocationRequested = useRef(false);
  const locationSourceRef = useRef('initial'); // Track which source last updated location
  
  // Define map marker icons
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div style="width: 16px; height: 16px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
  
  const pinIcon = L.divIcon({
    className: 'selected-location-marker',
    html: '<div style="width: 24px; height: 24px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 12px; height: 12px;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  
  // Centralized function to update location
  const updateAppLocation = useCallback((newLocation, source) => {
    if (!newLocation || typeof newLocation.lat !== 'number' || typeof newLocation.lng !== 'number') {
      console.warn('Invalid location provided to updateAppLocation:', newLocation);
      return false;
    }

    console.log(`Updating app location from source: ${source}`, newLocation);
    locationSourceRef.current = source;
    
    // Ensure the location has all required fields
    const normalizedLocation = {
      ...newLocation,
      lat: newLocation.lat,
      lng: newLocation.lng,
      display_name: newLocation.display_name || "Selected Location"
    };
    
    setLocation(normalizedLocation);
    return true;
  }, []);
  
  // Function to use mock location for development
  const useMockLocation = () => {
    console.log('Using mock location for development environment');
    const mockLocation = { 
      lat: 34.052235, // Los Angeles
      lng: -118.243683, 
      display_name: 'Los Angeles, CA (Dev Mode)'
    };
    updateAppLocation(mockLocation, 'mock_location');
    setSelectedLocation(mockLocation);
    setIsLocationLoading(false);
    
    // Consider showing a development-only message
    if (isDevelopmentEnvironment) {
      setError('Using mock location for development. Real geolocation is often blocked in localhost/development environments.');
    }
  };
  
  // Initialize navigation controller
  useEffect(() => {
    navigationController.current = new MapNavigationController({
      onReady: (isReady) => console.log('🚀 [NAV] Navigation controller ready:', isReady),
      onLocationChange: (location) => {
        console.log('🚀 [NAV] Location changed via controller:', location);
        // Don't update location state if it's from a map click to avoid re-centering issues
        if (location._source === 'map') {
          console.log('🚀 [NAV] Skipping location state update for map click');
          return;
        }
      },
      onMapClick: (event) => console.log('🚀 [NAV] Raw map click:', event),
      onLocationSelect: (location) => {
        console.log('🚀 [NAV] Selected location via controller:', location);
        // Always preserve source information when handling location select
        handleLocationSelect(location, location._source || 'map');
      },
      onReverseGeocodingStart: () => setIsReverseGeocoding(true),
      onReverseGeocodingEnd: () => setIsReverseGeocoding(false),
      onSearchAddressUpdate: (displayName) => setSearchAddress(displayName),
      onError: (error) => {
        console.error('🚀 [NAV] Controller error:', error);
        setError(error);
      }
    });

    // Cleanup on unmount
    return () => {
      if (navigationController.current) {
        navigationController.current.dispose();
      }
    };
  }, []);
  
  // Track if map initialization has already happened
  const mapInitialized = useRef(false);
  
  // Handle when the map is ready to use
  const handleMapReady = useCallback((map) => {
    // Prevent multiple initializations
    if (mapInitialized.current) {
      console.log('🚀 [MAP] Map already initialized, skipping redundant initialization');
      return;
    }
    
    console.log('🚀 [MAP] Map is ready now ✅', map);
    
    // Store the map reference
    mapRef.current = map;
    setIsMapReady(true);
    mapInitialized.current = true;
    
    // Update the map reference in the navigation controller
    if (navigationController.current) {
      console.log('🚀 [MAP] Updating map reference in controller with actual map instance');
      
      // Ensure we pass the raw Leaflet map instance, not a React wrapper
      const success = navigationController.current.updateMapReference(map);
      console.log(`🚀 [MAP] Map reference update ${success ? 'succeeded' : 'failed'}`);
      
      if (!success) {
        console.warn('🚀 [MAP] Failed to update map reference in controller. Map clicks may not work.');
        console.log('🚀 [MAP] Map instance type:', typeof map);
        console.log('🚀 [MAP] Map instance methods:', Object.keys(map).filter(key => typeof map[key] === 'function').join(', '));
      } else {
        console.log('🚀 [MAP] Map reference successfully updated in controller. Map clicks should work.');
      }
      
      // Center map on user location if available
      if (location) {
        console.log('🚀 [MAP] Centering map on user location:', location);
        setTimeout(() => {
          navigationController.current.navigateTo({
            lat: location.lat,
            lng: location.lng
          }, {
            zoom: 17, 
            animate: true
          })
          .then(success => {
            console.log(`🚀 [MAP] Map centering ${success ? 'succeeded' : 'failed'}`);
          });
        }, 300); // Small delay to ensure map is fully ready
      }
    }
  }, [navigationController, location]);
  
  // Update navigation controller when location changes
  useEffect(() => {
    // Skip if no location or not a valid coordinate
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return;
    }
    
    // If this location update came from a map click, don't trigger any map view changes
    if (location._source === 'map') {
      console.log('Location from map click, skipping controller update to prevent recentering');
      return;
    }
    
    // Always log location changes for debugging
    console.log(`Location changed to: ${location.lat},${location.lng} (source: ${locationSourceRef.current})`);
    
    // Skip location update if map not yet initialized - handleMapReady will handle initial centering
    if (!mapInitialized.current) {
      console.log('Map not yet initialized, skipping controller location update');
      return;
    }
    
    if (navigationController.current) {
      console.log(`Updating navigation controller with location from ${locationSourceRef.current}`);
      
      try {
        // Pass location using consistent lat/lng format
        navigationController.current.setUserLocation(location);
      } catch (error) {
        console.error('Error updating location in controller:', error);
      }
    }
  }, [location]);
  
  // Update controller when selected location changes
  useEffect(() => {
    if (navigationController.current && selectedLocation && 
        typeof selectedLocation.lat === 'number' && 
        typeof selectedLocation.lng === 'number') {
      console.log('Setting selected location in controller');
      
      // Pass the full location object including source info
      navigationController.current.setSelectedLocation(selectedLocation);
      
      // Don't do further map updates if it came from a map click
      if (selectedLocation._source === 'map') {
        console.log('Selected location from map click, not triggering further map actions');
        return;
      }
    }
  }, [navigationController, selectedLocation]);
  
  // Debounce reference for nearby meetups refresh
  const nearbyMeetupsDebounceRef = useRef(null);
  
  // Update when zoom changes or map becomes ready
  useEffect(() => {
    // Only make this API call when zoom changes and we have a location
    // But don't if the location is from a map click that's happening right now
    if (isMapReady && location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      // Skip if this is from a map click and we're actively getting the location (to avoid flickering)
      if (location._source === 'map') {
        console.log('Skip nearby meetups refresh for map click source');
        return;
      }
      
      // Clear any previous debounce timeout
      if (nearbyMeetupsDebounceRef.current) {
        clearTimeout(nearbyMeetupsDebounceRef.current);
      }
      
      // Set a debounce to avoid too many API calls during rapid zooming/panning
      nearbyMeetupsDebounceRef.current = setTimeout(() => {
        console.log(`Map is ready or zoom changed to ${currentZoom}, refreshing nearby meetups`);
        // Use the user's actual location, not the selected map point
        fetchNearbyMeetups(location, currentZoom);
        // Clear the reference
        nearbyMeetupsDebounceRef.current = null;
      }, 300); // 300ms debounce
    }
    
    // Clean up debounce on unmount
    return () => {
      if (nearbyMeetupsDebounceRef.current) {
        clearTimeout(nearbyMeetupsDebounceRef.current);
      }
    };
  }, [currentZoom, isMapReady, location]);
  
  // Initial location setup
  useEffect(() => {
    console.log('Initial location setup effect running');
    
    // Skip if geolocation was already requested
    if (geolocationRequested.current) {
      console.log('Geolocation was already requested, skipping duplicate request');
      return;
    }
    
    // Mark that we've requested geolocation
    geolocationRequested.current = true;
    locationSourceRef.current = 'initial_setup';
    
    setIsLocationLoading(true);
    
    // Check if we're in development environment (localhost)
    const isDevelopmentEnvironment = window.location.hostname === 'localhost' || 
                                    window.location.hostname === '127.0.0.1' ||
                                    window.location.hostname.includes('192.168.');
    
    // Function to handle geolocation timeout
    const geolocationTimeout = setTimeout(() => {
      console.log('Geolocation timed out after 15 seconds');
      useMockLocation();
    }, 15000); // 15 second timeout
    
    // If we're in development mode, optionally skip real geolocation
    if (isDevelopmentEnvironment) {
      // Option 1: Skip geolocation entirely for more predictable development
      // useMockLocation();
      // clearTimeout(geolocationTimeout);
      // return;
      
      // Option 2: Try geolocation but with a shorter timeout for development
      // Just proceed with regular flow but shorter timeout
      console.log('Development environment detected. Geolocation may fail, but trying anyway.');
    }
    
    if (navigator.geolocation) {
      console.log('Geolocation is supported, requesting location...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
          // Clear timeout since we got a response
          clearTimeout(geolocationTimeout);
          
          console.log('Geolocation success:', position.coords.latitude, position.coords.longitude);
          const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            display_name: "Your Location"
          };
          
          // Set both user location and initial selected location
          updateAppLocation(newLocation, 'browser_geolocation');
          setSelectedLocation(newLocation);
          setIsLocationLoading(false);
          console.log('Location set successfully');
        },
        (error) => {
          // Clear timeout since we got a response (error)
          clearTimeout(geolocationTimeout);
          
          console.error('Geolocation error:', error);
          
          // For development mode, use mock location without alarming the user too much
          if (isDevelopmentEnvironment) {
            console.log('Using mock location due to geolocation error in development environment');
            useMockLocation();
      return;
    }

          // Fall back to default location only if geolocation fails
          // Using Los Angeles as the default location now
          const defaultLocation = { 
            lat: 34.052235, // Los Angeles
            lng: -118.243683, 
            display_name: 'Los Angeles, CA'
          };
          console.log('Using default location:', defaultLocation);
          updateAppLocation(defaultLocation, 'default_fallback');
          setSelectedLocation(defaultLocation);
          setIsLocationLoading(false);
          
          // Set appropriate error message based on error code
          if (error.code === 1) {
            setError('Location access denied. Using default location.');
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE - often occurs during development or with VPN
            setError('Your location is unavailable. This may be due to network issues or VPN settings. Using default location.');
    } else {
            setError('Could not access your location. Using default location.');
          }
          },
          {
            enableHighAccuracy: true,
                timeout: isDevelopmentEnvironment ? 5000 : 10000, // Shorter timeout for development
                maximumAge: 60000 // Accept a location up to 1 minute old
              }
            );
    } else {
      // Clear timeout since we determined browser doesn't support geolocation
      clearTimeout(geolocationTimeout);
      
      // Browser doesn't support geolocation
      console.warn('Geolocation is not supported by this browser');
      const defaultLocation = { 
        lat: 34.052235, // Los Angeles
        lng: -118.243683, 
        display_name: 'Los Angeles, CA'
      };
      console.log('Using default location (no geolocation support):', defaultLocation);
      updateAppLocation(defaultLocation, 'default_fallback');
      setSelectedLocation(defaultLocation);
      setIsLocationLoading(false);
      setError('Geolocation is not supported by your browser. Using default location.');
    }
    
    // Clean up timeout if component unmounts
    return () => clearTimeout(geolocationTimeout);
  }, []);

  // Fetch nearby meetups
  const fetchNearbyMeetups = async (userLocation, zoom) => {
    // Skip fetching if this location update came from a map click and we're currently reverse geocoding
    // This prevents unnecessary API calls during map interaction
    if (userLocation._source === 'map' && isReverseGeocoding) {
      console.log('Skipping nearby meetups fetch during map click and reverse geocoding');
      return [];
    }
    
    try {
      console.log('Fetching nearby meetups for user location:', userLocation);
      setError('');
      
      const { success, meetups, error } = await getNearbyFreeMeetups(
        userLocation.lat,
        userLocation.lng,
        5000, // Fixed radius for consistent results
        {}
      );
      
      if (!success || error) {
        console.error('Error fetching nearby meetups:', error);
        setNearbyMeetups([]);
        setError('Failed to fetch nearby meetups.');
        return [];
      }
    
      console.log(`Found ${meetups?.length || 0} nearby meetups`);
      
      // Note: getNearbyFreeMeetups should now return meetups with signed image URLs
      // thanks to the addSignedImageUrlsToMeetups function we added to meetup.js
      setNearbyMeetups(meetups || []);
      
      // For notification purposes, only show meetups that are within 2.5km (was 1km)
      const nearbyMeetups = (meetups || []).filter(m => 
        m.distance_meters && m.distance_meters <= 2500
      );
      
      // Check if these are new meetups that weren't in the previous notification
      const existingIds = nearbyMeetupsForNotification.map(m => m.id);
      const newNearbyMeetups = nearbyMeetups.filter(m => !existingIds.includes(m.id));
      
      if (newNearbyMeetups.length > 0) {
        console.log(`Found ${newNearbyMeetups.length} new nearby meetups for notification`);
        setNearbyMeetupsForNotification(newNearbyMeetups);
      }
      
      // Return the meetups for immediate use
      return meetups || [];
    } catch (error) {
      console.error('Error in fetchNearbyMeetups:', error);
      setNearbyMeetups([]);
      setError('An unexpected error occurred.');
      return [];
    }
  };
  
  // Handle location selection
  const handleLocationSelect = async (location, source = 'unknown') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use source from the location itself if it has one, otherwise use the provided source parameter
      const actualSource = location._source || source;
      
      // Log the selected location and source
      log.info('Location selected:', location, 'source:', actualSource);
      
      // Create a new location object with the source property
      const locationWithSource = {
        ...location,
        _source: actualSource
      };
      
      // Update the selected location
      setSelectedLocation(locationWithSource);
      
      // If this is from a map click, don't recenter the map
      if (actualSource === 'map') {
        log.info('Map click detected, not recentering');
        setIsLoading(false);
        
        // Update the URL without recentering
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('lat', location.lat);
        searchParams.set('lng', location.lng);
        window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
        
        return; // Early return to prevent further map manipulation
      }
      
      // For non-map sources, update the map view
      if (mapRef.current) {
        log.info('Centering map for non-map source:', actualSource);
        mapRef.current.setView([location.lat, location.lng], 15);
      }
      
      // Update the URL with the new location
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('lat', location.lat);
      searchParams.set('lng', location.lng);
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
      
      // Log success
      log.info('Location selection completed successfully');
    } catch (error) {
      log.error('Error handling location selection:', error);
      setError('Failed to process location selection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle zoom change
  const handleZoomChange = (newZoom) => {
    setCurrentZoom(newZoom);
  };
  
  // Search for addresses
  const searchAddresses = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true); // Use separate loading state for search
      const results = await searchLocations(query);
      setSearchResults(results);
      
      // If it's a direct search (not just typing), auto-select first result
      if (results && results.length > 0 && query === searchAddress.trim()) {
        // Explicitly set source as 'search' for auto-selected results
        handleLocationSelect(results[0], 'search');
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setError('Failed to search for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Update the dropdown result click handler to explicitly set source
  // Look for the JSX where search results are rendered and update the onClick handler
  const handleSearchResultClick = (result) => {
    // Clear search results after selection
    setSearchResults([]);
    // Explicitly set source as 'dropdown' for clicked results
    handleLocationSelect(result, 'dropdown');
    // Update search field with selected name
    setSearchAddress(result.display_name || '');
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
      return;
    }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create a meetup
  const handleCreateMeetup = async () => {
    if (!selectedLocation) {
      setError('Please select a location for your meetup');
      return;
    }

    try {
      setIsLoading(true);
      await createFreeMeetup({
        title: title || 'Instant Meetup',
        description: description || 'Join me for a spontaneous meetup!',
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        },
        address: selectedLocation.display_name || address,
        image: image,
        imageSignedUrl: imageSignedUrl // Pass the signed URL if available
      });
      
      setMeetupCreated(true);
      // Clear form
      setTitle('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      setImageSignedUrl(null); // Clear the signed URL too
      
      // Refresh nearby meetups - use user's actual location, not the selected map point
      await fetchNearbyMeetups(location, currentZoom);
    } catch (error) {
      console.error('Error creating meetup:', error);
      setError(error.message || 'Failed to create meetup');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle admin panel
  const toggleAdmin = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!isAdmin) {
      setError('You do not have admin privileges.');
      return;
    }

    // Close other modals
    setShowAuth(false);
    setShowProfile(false);
    setShowCredits(false);
    
    // Toggle admin panel
    setShowAdmin(!showAdmin);
  }, [user, isAdmin, showAdmin]);
  
  // Handle auth change
  const handleAuthChange = (newUser) => {
    setUser(newUser);
    if (newUser) {
      // In a real app, check if user is admin via roles or permissions
      setIsAdmin(newUser.email === 'admin@example.com');
    }
    setShowAuth(false);
  };
  
  // Toggle auth modal
  const toggleAuth = () => {
    setShowAuth(!showAuth);
    setShowProfile(false);
    setShowCredits(false);
  };
  
  // Toggle profile modal
  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowAuth(false);
    setShowCredits(false);
  };
  
  // Toggle credits modal
  const toggleCredits = () => {
    setShowCredits(!showCredits);
    setShowAuth(false);
    setShowProfile(false);
  };
  
  // Handle credits update
  const handleCreditsUpdated = (newCredits) => {
    setUserCredits(newCredits);
  };
  
  // Request user's location
  const requestUserLocation = async () => {
    setIsLocationLoading(true);
    setError(null);
    
    const useMockLocation = () => {
      console.log('Using mock location for development environment');
      const mockLocation = { 
        lat: 34.053235,
        lng: -118.245683, 
        display_name: "Your Current Location (Dev Mode)"
      };
      
      updateAppLocation(mockLocation, 'mock_location');
      setIsLocationLoading(false);
      
      if (mapRef.current && navigationController.current) {
        navigationController.current.navigateTo(
          mockLocation, 
          { 
            zoom: mapRef.current.getZoom(),
            animate: true 
          }
        );
      }
      
      if (isDevelopmentEnvironment) {
        setError('Using mock location in development mode. Real location services often fail in development environments.');
      }
    };

    try {
      // Use LocationRequestManager which handles timeouts and caching
      const position = await locationRequestManager.requestLocation();
      
      const newLocation = {
        lat: position.lat,
        lng: position.lng,
        display_name: "Your Current Location"
      };
      
      updateAppLocation(newLocation, 'browser_geolocation');
      
      if (mapRef.current && navigationController.current) {
        navigationController.current.navigateTo(
          newLocation, 
          { 
            zoom: mapRef.current.getZoom(),
            animate: true 
          }
        );
      }
    } catch (error) {
      console.error('Location request error:', error);
      
      if (isDevelopmentEnvironment) {
        useMockLocation();
      } else {
        setError('Unable to get your location. Please check your location settings.');
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  // CSS for toast animation
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
    }

    /* Meetup location marker styles */
    .meetup-location-marker {
      transition: all 0.2s ease-in-out;
      z-index: 900 !important;
    }
    
    .meetup-location-marker:hover, 
    .meetup-marker:hover {
      transform: scale(1.2);
      z-index: 1000 !important;
    }
    
    /* Standard meetup marker without image */
    .meetup-marker {
      transition: all 0.2s ease-in-out;
      z-index: 900 !important;
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

  // Reset error state when component remounts or key updates
  useEffect(() => {
    setHadError(false);
  }, [mapRef.current]);
  
  // Graceful error handling
  const handleComponentError = (error, errorInfo) => {
    console.error("MeetNowApp encountered an error:", error, errorInfo);
    setHadError(true);
    // Prevent further renders that might cause cascading errors
    setNearbyMeetups([]);
    setIsMapReady(false);
  };
  
  // Handler to view the nearby meetups when clicking on notification
  const handleViewNearbyMeetups = () => {
    // Clear the notification
    setNearbyMeetupsForNotification([]);
    
    // Here you might also want to:
    // 1. Open the nearby meetups panel if it's closed
    // 2. Scroll to the nearby meetups section
    // 3. Or implement any other UX enhancement
    
    console.log('User clicked to view nearby meetups from notification');
  };
  
  // If we had a critical error, show a minimal view
  if (hadError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">Something went wrong</h2>
          <p className="mb-4">The map encountered an error. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ComponentRegistryProvider>
    <div className="min-h-screen bg-gray-100" role="application">
      {/* Add the style tag */}
      <style>{toastAnimationStyle}</style>
      
      {/* Map container - only show when not in admin view */}
      {!showAdmin && (
      <div className="relative w-full h-screen">
        <ErrorBoundary
            onError={handleComponentError}
          fallback={<div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 mt-4">
            <h3 className="font-semibold">Map Failed to Load</h3>
            <p>Please check your internet connection and try reloading</p>
          </div>}
        >
            {/* Admin debug info */}
            {false && (
            <div className="absolute top-20 right-4 z-50 bg-white p-2 rounded shadow-md text-xs">
              <div><strong>Admin Status:</strong> {isAdmin ? 'YES' : 'NO'}</div>
              <div><strong>User ID:</strong> {user ? user.id?.substring(0, 8) + '...' : 'Not logged in'}</div>
              <div><strong>Map Key:</strong> {mapRef.current}</div>
            </div>
            )}
            
            {isLocationLoading ? (
              // Location loading screen
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                <div className="text-center p-6 max-w-md">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Finding your location...</h2>
                  <p className="text-gray-600 mb-4">We're getting your exact position to center the map.</p>
                  <div className="w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : location ? (
              // Only render the map when we have a valid location
                    <MapContainer
                      whenCreated={(map) => {
                  console.log('🚀 [MAP-CONTAINER] Map instance created');
                  // Just store the reference, don't call handleMapReady yet
                          mapRef.current = map;
                      }}
                      whenReady={(mapInstance) => handleMapReady(mapInstance.target)}
                center={[location.lat, location.lng]}
                zoom={currentZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <ZoomControl position="bottomright" />
                      
                      {/* User location marker */}
                      {location && (
                          <PersistentPinMarker
                            id="user-location"
                            position={location}
                          icon={userIcon}
                            popupContent={
                              <div className="p-2">
                                <h3 className="font-semibold">Your Location</h3>
                                <p className="text-sm">{location.display_name || 'Current location'}</p>
                            </div>
                            }
                          />
                      )}
                      
                      {/* Selected location marker */}
                      {selectedLocation && (!location || 
                        selectedLocation.lat !== location.lat || 
                        selectedLocation.lng !== location.lng) && (
                          <PersistentPinMarker
                            id="selected-location"
                            position={selectedLocation}
                          icon={pinIcon}
                          zIndexOffset={1001}
                            popupContent={
                            <div className="text-center">
                              <div className="font-bold">{selectedLocation.display_name || "Selected Location"}</div>
                              <div className="text-xs text-gray-500">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</div>
                            </div>
                            }
                          />
                      )}
                      
                      {/* Add MapClickHandlerWithController directly passing the navigationController without .current */}
                      <MapClickHandlerWithController navigationController={navigationController.current} />
                      
                      {/* Nearby meetups markers */}
                      {nearbyMeetups && nearbyMeetups.map((meetup) => {
                        // Create a custom icon for meetups with images
                        const meetupIcon = meetup.image_url || meetup.signed_image_url
                          ? L.divIcon({
                              className: 'meetup-location-marker',
                              html: `<div style="width: 36px; height: 36px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <img src="${meetup.signed_image_url || meetup.image_url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://via.placeholder.com/40'; this.style.opacity=0.7;" />
                                </div>`,
                              iconSize: [36, 36],
                              iconAnchor: [18, 18]
                            })
                          : L.divIcon({
                              className: 'meetup-marker',
                              html: '<div style="width: 32px; height: 32px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 16px; height: 16px;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
                              iconSize: [32, 32],
                              iconAnchor: [16, 16]
                            });
                        
                        return (
                            <PersistentPinMarker
                            key={meetup.id}
                              id={`meetup-${meetup.id}`}
                            position={[meetup.location.lat, meetup.location.lng]}
                            icon={meetupIcon}
                            zIndexOffset={900}
                              popupContent={
                              <div className="meetup-popup">
                                {(meetup.signed_image_url || meetup.image_url) && (
                                  <div className="meetup-popup-image mb-2">
                                    <img 
                                      src={meetup.signed_image_url || meetup.image_url} 
                                      alt={meetup.title}
                                      className="w-full h-32 object-cover rounded-md"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/320x180?text=No+Image';
                                        e.target.style.opacity = 0.7;
                                      }}
                                    />
                                  </div>
                                )}
                                <h3 className="font-bold">{meetup.title}</h3>
                                <p>{meetup.description}</p>
                                <p className="text-sm text-gray-500">
                                  {meetup.address}
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                  {meetup.username || 'Anonymous'}
                                </p>
                              </div>
                              }
                            />
                        );
                      })}
                    </MapContainer>
            ) : (
              // No location available yet
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                <div className="text-center p-6 max-w-md">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Location Not Available</h2>
                  <p className="text-gray-600 mb-4">We couldn't determine your location. Please check your browser permissions and try again.</p>
                  <button
                    onClick={requestUserLocation}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Card with loading state */}
            {isLocationLoading && (
              <div className="absolute top-4 left-4 z-10 w-96">
                <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center">
                      <Loading />
                      <span className="ml-2">Getting your location...</span>
                </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Debug info if in dev mode */}
            {process.env.NODE_ENV === 'development' && false && (
              <div className="absolute top-4 right-4 z-10 text-xs bg-white/80 p-2 rounded shadow">
                <div><strong>Location:</strong> {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'None'}</div>
                <div><strong>Selected:</strong> {selectedLocation ? `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}` : 'None'}</div>
                <div><strong>Admin Status:</strong> {isAdmin ? 'YES' : 'NO'}</div>
                <div><strong>User ID:</strong> {user ? user.id?.substring(0, 8) + '...' : 'Not logged in'}</div>
                <div><strong>Map Key:</strong> {mapRef.current}</div>
                </div>
            )}

            {/* Meetup creation form - with transparency effects */}
        <div className="absolute top-4 left-4 z-10 w-96 space-y-4">
              {!isLocationLoading && location && (
          <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
            <CardContent>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Create an Instant Meetup</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Create a free 1-hour meetup that starts right now - no sign-up required!
                </p>
                
                      <form 
                        onSubmit={(e) => {
                          // Always prevent the default form submission no matter what
                          e.preventDefault();
                          e.stopPropagation();
                          // Do not create a meetup or update loading state
                          return false;
                        }}
                        className="location-search-form"
                        noValidate
                        style={{ margin: 0, padding: 0 }}
                      >
                <div className="space-y-4">
                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Give your meetup a title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="w-full bg-white/90 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="What's this meetup about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add a photo (optional)
                    </label>
                    <MeetupImageUploader 
                      onImageUploaded={(imageUrl, signedViewUrl) => {
                        console.log('Image uploaded:', imageUrl);
                        console.log('Signed view URL:', signedViewUrl);
                        setImage(imageUrl);
                        setImageSignedUrl(signedViewUrl);
                      }}
                      isAnonymous={true}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 5MB. Recommended: Square image.
                    </p>
                  </div>

                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Where would you like to meet?
                    </label>
                            <div className="relative">
                      <Input
                        type="text"
                                placeholder="Search location..."
                        value={searchAddress}
                        onChange={(e) => {
                          setSearchAddress(e.target.value);
                          searchAddresses(e.target.value);
                        }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    
                                    // Don't do anything if searching
                                    if (isSearching) return;
                                    
                                    // Start searching
                                    setIsSearching(true);
                                    
                                    console.log("Searching for location from Enter key:", searchAddress);
                                    
                                    // Search for location
                                    searchLocations(searchAddress.trim())
                                      .then(results => {
                                        console.log("Search results:", results);
                                        setSearchResults(results || []);
                                        
                                        if (results && results.length > 0) {
                                          const result = results[0];
                                          console.log("Selecting first result:", result);
                                          
                                          // Update the selected location with source='search'
                                          setSelectedLocation({
                                            ...result,
                                            _source: 'search'
                                          });
                                          
                                          // Update the search field with the selected location name
                                          setSearchAddress(result.display_name || '');
                                          
                                          // Clear search results
                                          setSearchResults([]);
                                          
                                          // Update the controller's selected location
                                          if (navigationController.current) {
                                            navigationController.current.setSelectedLocation({
                                              ...result,
                                              _source: 'search'
                                            });
                                            
                                            // Since Enter was pressed, we also center the map
                                            // This is the explicit navigation action
                                            navigationController.current.navigateTo({
                                              lat: result.lat,
                                              lng: result.lng,
                                              _source: 'search'
                                            }, {
                                              zoom: 16,
                                              animate: true
                                            });
                                          }
                                        }
                                      })
                                      .catch(error => {
                                        console.error('Error searching location:', error);
                                        setError('Error finding location. Please try again.');
                                      })
                                      .finally(() => {
                                        setIsSearching(false);
                                      });
                                  }
                                }}
                                className="w-full pr-10 bg-white/90 backdrop-blur-sm"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                                {isReverseGeocoding ? (
                                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                                ) : (
                                  <FaMapMarkerAlt className="text-gray-400" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Or click anywhere on the map to select a location
                            </p>
                          </div>

                  {searchResults.length > 0 && (
                            <div className="absolute w-full bg-white/95 backdrop-blur-sm mt-1 rounded-md shadow-lg z-20">
                              {searchResults.map((result, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-2 hover:bg-blue-50/80 cursor-pointer transition-colors"
                                  onClick={() => {
                                    // Update the selected location
                                    handleSearchResultClick(result);
                                  }}
                                >
                                  {result.display_name}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="bg-blue-50/70 backdrop-blur-sm p-3 rounded-lg">
                            <p className="text-sm text-blue-700">
                              ⏰ Your meetup will start immediately and be active for 1 hour
                            </p>
                          </div>

                          <Button
                            type="button" 
                                      onClick={(e) => {
                              // Ensure the click doesn't trigger any form submission
                              e.preventDefault();
                              handleCreateMeetup();
                            }}
                            disabled={isLoading || meetupCreated}
                            className={`w-full transition-colors ${
                              meetupCreated 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                                        </span>
                            ) : meetupCreated ? (
                              'Meetup Created!'
                            ) : (
                              'Start 1-Hour Meetup Now'
                            )}
                          </Button>
                        </div>
                      </form>
                      
                      {error && (
                        <div className="text-red-500 text-sm mt-2 bg-red-50/70 backdrop-blur-sm p-3 rounded-lg">
                          {error}
                                          </div>
                      )}

                      {meetupCreated && (
                        <div className="mt-4 p-4 bg-green-50/70 backdrop-blur-sm border border-green-200/50 rounded-lg">
                          <p className="text-green-700">
                            Your meetup is now active! It will expire in 1 hour.
                          </p>
                                          </div>
                      )}
                                        </div>
                  </CardContent>
                </Card>
                          )}
                                      </div>
            
            {/* Nearby meetups panel */}
            {Array.isArray(nearbyMeetups) && nearbyMeetups.length > 0 && !isLocationLoading && (
              <div className="absolute bottom-4 right-4 z-10 w-96">
                  <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
                  <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Nearby Meetups</h3>
                        <button 
                          onClick={() => {
                            if (navigationController.current && location) {
                              // Create a location with _source='user_location_button'
                              const userLocationForNav = {
                                lat: location.lat,
                                lng: location.lng,
                                display_name: location.display_name || "Your Location",
                                _source: 'user_location_button' // Add source to indicate this is from the UI button
                              };
                              
                              // Navigate to user location and force center regardless of source
                              navigationController.current.navigateTo(userLocationForNav, {
                                zoom: 21,
                                animate: true,
                                forceCenter: true // Override source check to force centering
                              });
                            }
                          }}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
                          title="Center map on your location"
                        >
                          <FaCompass className="h-4 w-4" />
                        </button>
                            </div>
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {nearbyMeetups.map(meetup => meetup && (
                          <div 
                            key={meetup.id || `meetup-item-${Math.random()}`}
                            className="p-2 bg-white/70 rounded-md cursor-pointer hover:bg-white/90 flex justify-between"
                            onClick={() => {
                              if (navigationController.current && 
                                  meetup.location && 
                                  typeof meetup.location.lat === 'number' && 
                                  typeof meetup.location.lng === 'number') {
                                // Create a location object with _source='meetup_panel' to track the source
                                const meetupLocation = {
                                  lat: meetup.location.lat,
                                  lng: meetup.location.lng,
                                  display_name: meetup.title || meetup.address || 'Selected Meetup',
                                  _source: 'meetup_panel' // Add source to indicate this came from the meetups panel
                                };
                                
                                // Navigate to the meetup location - explicitly allow recentering
                                navigationController.current.navigateTo(meetupLocation, {
                                  zoom: 17,
                                  animate: true,
                                  forceCenter: true // Override source check to force centering
                                });
                                
                                // Also update selected location so UI shows this meetup is selected
                                setSelectedLocation(meetupLocation);
                              }
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-medium truncate">{meetup.title || 'Unnamed Meetup'}</div>
                              <div className="text-sm text-gray-600 truncate">{meetup.description || 'No description'}</div>
                            </div>
                            <div className="flex flex-col items-end justify-between text-xs">
                              <div className="text-blue-600 font-medium">
                                {meetup.distance_meters ? 
                                  (meetup.distance_meters < 1000 ? 
                                    `${Math.round(meetup.distance_meters)}m` : 
                                    `${(meetup.distance_meters / 1000).toFixed(1)}km`)
                                  : ''}
                              </div>
                              <div className="text-orange-500">
                                {meetup.created_at ? 
                                  (() => {
                                    const created = new Date(meetup.created_at);
                                    const expires = new Date(created.getTime() + 60 * 60 * 1000); // 1 hour later
                                    const now = new Date();
                                    const minutesLeft = Math.max(0, Math.floor((expires - now) / (60 * 1000)));
                                    return minutesLeft > 0 ? `${minutesLeft}m left` : 'Expired';
                                  })() 
                                  : '1h'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                  </CardContent>
                </Card>
                        </div>
            )}
          </ErrorBoundary>
                                </div>
      )}
      
      {/* Admin panel */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <ErrorBoundary
            fallback={
              <div className="p-6">
                <h2 className="text-xl font-bold text-red-600">Admin Panel Failed to Load</h2>
                <p className="mt-2">There was an error loading the admin panel. Please try again.</p>
                                <button 
                  onClick={toggleAdmin}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Return to Map
                                </button>
                                    </div>
            }
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-lg">Loading Admin Panel...</p>
                    </div>
                              </div>
            }>
              <AdminPage onClose={toggleAdmin} />
            </Suspense>
          </ErrorBoundary>
                            </div>
                      )}
                      
      {/* User menu buttons - always visible */}
      {false && (
      <div className="absolute top-4 right-4 z-50 flex space-x-2">
        {user ? (
          <>
            {isAdmin && (
                                <button 
                onClick={toggleAdmin}
                className="flex items-center justify-center h-10 w-10 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
                title="Admin Dashboard"
              >
                <FaCog />
                                </button>
            )}
                                <button 
              onClick={toggleProfile}
              className="flex items-center justify-center h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
              title="Your Profile"
            >
              <span className="text-sm font-semibold">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                                </button>
                                <button 
                          onClick={toggleCredits}
              className="flex items-center justify-center h-10 w-10 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md"
              title="Credits"
                        >
              <span className="text-sm font-semibold">{userCredits}</span>
                                </button>
          </>
        ) : (
          <button
            onClick={toggleAuth}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md"
          >
            Sign In
          </button>
                      )}
                    </div>
      )}
      
      {/* Modals */}
      {showAuth && !showAdmin && (
        <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                          <button 
                            onClick={toggleAuth}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          >
              <FaTimes className="w-5 h-5" />
            </button>
            <Auth onAuthChange={handleAuthChange} />
                        </div>
                    </div>
      )}
      
      {showProfile && !showAdmin && (
        <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <button 
              onClick={toggleProfile}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
              <FaTimes className="w-5 h-5" />
                        </button>
            <Profile user={user} />
                    </div>
                  </div>
      )}
      
      {showCredits && !showAdmin && (
        <div className="absolute inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <button 
              onClick={toggleCredits}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <Credits user={user} credits={userCredits} onCreditsUpdated={handleCreditsUpdated} />
                  </div>
        </div>
      )}
      
      {/* Toast notification */}
                  {error && (
        <div 
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-up"
        >
                      {error}
                    </div>
                  )}

      {/* Nearby Meetup Alert Notification */}
      {/* Commented out to avoid redundant notifications 
      <NearbyMeetupAlert 
        meetups={nearbyMeetupsForNotification}
        onView={handleViewNearbyMeetups}
        onClose={() => setNearbyMeetupsForNotification([])}
      />
      */}

      {/* Debug tools in dev mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-20 flex space-x-2">
          <a 
            href="/wasabi-test" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-800/80 hover:bg-gray-900/80 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1 backdrop-blur-sm"
          >
            <span className="hidden sm:inline">Test Wasabi</span>
          </a>
          
          <a 
            href="/image-upload-test" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-600/80 hover:bg-purple-700/80 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1 backdrop-blur-sm"
          >
            <span className="hidden sm:inline">Test Image Upload</span>
          </a>
        </div>
      )}

        {/* Debug Console */}
        {process.env.NODE_ENV === 'development' && (
          <DebugConsole 
            mapRef={mapRef}
            mapNavigator={navigationController.current}
            userLocation={location}
            selectedLocation={selectedLocation}
            onNavigationTest={(loc) => {
              if (navigationController.current) {
                navigationController.current.navigateTo(loc);
              }
            }}
          />
        )}

        {/* Replace floating windows with PersistentFloatingWindow */}
        <PersistentFloatingWindow
          id="location-info"
          position="top-right"
          isVisible={!!location}
        >
          <div className="location-info-card">
            {/* Location info content */}
    </div>
        </PersistentFloatingWindow>
      </div>
    </ComponentRegistryProvider>
  );
};

export default MeetNowApp;