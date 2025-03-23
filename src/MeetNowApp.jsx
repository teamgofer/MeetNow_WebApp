import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Button, Input, Card, CardContent } from '@/components/ui';
import Loading from '@/components/ui/loading';
import NearbyMeetups from '@/components/ui/nearby-meetups';
import NearbyMeetupAlert from '@/components/ui/NearbyMeetupAlert';
import { FaMapMarkerAlt, FaCog, FaTimes, FaCompass, FaLayerGroup, FaRuler, FaSearch, FaCheck, FaUser, FaSignOutAlt, FaCreditCard } from 'react-icons/fa';
import { createFreeMeetup, getNearbyFreeMeetups } from '@/utils/meetup';
import { searchLocations } from '@/utils/location-services';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Credits from './components/Credits';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon 
} from 'lucide-react';

// Import the navigation related components
import MapViewControlBar from './components/map/MapViewControlBar';
import BirdsEyePathOverlay from './components/map/BirdsEyePathOverlay';
import VicinityIndicator from './components/map/VicinityIndicator';
import MiniMapComponent from './components/map/MiniMapComponent';

// Import debug tools
import DebugConsole from './components/debug/DebugConsole';
import Logger from './utils/Logger';
import MapNavigationController from './utils/MapNavigationController';

const AdminPage = lazy(() => import('./components/admin/AdminPage'));

const MeetNowApp = () => {
  // State
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194, display_name: 'San Francisco, CA' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 37.7749, lng: -122.4194, display_name: 'San Francisco, CA' });
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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
  
  // Navigation widget state
  const [showMinimap, setShowMinimap] = useState(false);
  const [mapMode, setMapMode] = useState('default'); // 'default', 'satellite', 'terrain'
  const [navMode, setNavMode] = useState('browse'); // 'browse', 'measure', 'layers'
  
  // Refs
  const mapRef = useRef(null);
  const mapKey = useRef(1);
  const searchTimeoutRef = useRef(null);
  const meetupsIntervalRef = useRef(null);
  const navigationController = useRef(null);
  
  // Initialize navigation controller once at component mount
  useEffect(() => {
    // Import constants from navigation controller
    const { FREE_NAVIGATION, BIRDS_EYE_VIEW, VICINITY_MODE } = MapNavigationController;
    
    // Initialize controller with options object
    navigationController.current = new MapNavigationController({
      defaultMode: FREE_NAVIGATION, // Start with free navigation mode
      defaultZoom: currentZoom,
      debug: true, // Enable debug logging
      onModeChange: (newMode, previousMode) => {
        // This callback will be called whenever the mode changes in the controller
        Logger.info('MeetNowApp', `Navigation mode changed ${previousMode ? `from ${previousMode}` : ''} to ${newMode}`);
        
        // Update UI elements based on mode changes
        if (newMode === BIRDS_EYE_VIEW) {
          Logger.debug('MeetNowApp', 'Entered Bird\'s Eye View mode');
        } else if (newMode === VICINITY_MODE) {
          Logger.debug('MeetNowApp', 'Entered Vicinity mode');
        } else if (newMode === FREE_NAVIGATION) {
          Logger.debug('MeetNowApp', 'Entered Free Navigation mode');
        }
      },
      onReady: (controller) => {
        Logger.info('MeetNowApp', 'Navigation controller is ready');
        // Process any pending navigation operations
      },
      onLocationChange: (location) => {
        Logger.debug('MeetNowApp', 'User location updated in navigation controller');
      },
      onSelectedLocationChange: (location) => {
        Logger.debug('MeetNowApp', 'Selected location updated in navigation controller');
      },
      onZoomChange: (zoom) => {
        Logger.debug('MeetNowApp', 'Zoom level updated to:', zoom);
      }
    });
    
    // Clean up function
    return () => {
      // No need to unsubscribe, we're using callback properties now
      navigationController.current = null;
    };
  }, [currentZoom]);
  
  // Update controller when location or selected location changes
  useEffect(() => {
    if (navigationController.current && location) {
      navigationController.current.setUserLocation(location);
    }
  }, [location]);
  
  useEffect(() => {
    if (navigationController.current && selectedLocation) {
      navigationController.current.setSelectedLocation(selectedLocation);
    }
  }, [selectedLocation]);
  
  // Handle map readiness
  const handleMapReady = useCallback((map) => {
    Logger.info('MeetNowApp', 'Map is ready');
    
    // Update the map reference in the navigation controller
    if (navigationController.current) {
      Logger.info('MeetNowApp', 'Updating map reference in controller');
      
      // The map passed from whenCreated is the raw Leaflet instance
      // Create a proper ref structure that mimics React's ref objects
      const mapRefObject = { current: map };
      navigationController.current.updateMapReference(mapRefObject);
      
      // Force readiness check after setting map reference
      setTimeout(() => {
        if (navigationController.current && !navigationController.current.isReadyToNavigate()) {
          Logger.warn('MeetNowApp', 'Navigation controller still not ready after map initialization');
        } else {
          Logger.info('MeetNowApp', 'Navigation controller ready status confirmed');
        }
      }, 100);
    } else {
      Logger.warn('MeetNowApp', 'Navigation controller not available when map is ready');
    }
    
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  // Update when currentZoom changes (useEffect)
  useEffect(() => {
    // Only make this API call when zoom changes and we have a location
    if (isMapReady && location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      console.log(`Zoom changed to ${currentZoom}, refreshing nearby meetups`);
      // Use the user's actual location, not the selected map point
      fetchNearbyMeetups(location, currentZoom);
    }
  }, [currentZoom, isMapReady, location]);
  
  // Update meetups on map ready
  useEffect(() => {
    if (isMapReady && location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      console.log('Map is ready, fetching nearby meetups');
      // Use the user's actual location, not the selected map point
      fetchNearbyMeetups(location, currentZoom);
    }
  }, [isMapReady, location]);
  
  // Initial location setup
  useEffect(() => {
    console.log('Initial location setup effect running');
    setIsLocationLoading(true);
    
    // Clear any previous errors
    setError('');
    
    // Check if we're in development environment (localhost)
    const isDevelopmentEnvironment = window.location.hostname === 'localhost' || 
                                    window.location.hostname === '127.0.0.1' ||
                                    window.location.hostname.includes('192.168.');
    
    // Function to use mock location for development
    const useMockLocation = () => {
      console.log('Using mock location for development environment');
      const mockLocation = { 
        lat: 34.052235, // Los Angeles
        lng: -118.243683, 
        display_name: 'Los Angeles, CA (Dev Mode)'
      };
      setLocation(mockLocation);
      setSelectedLocation(mockLocation);
      setIsLocationLoading(false);
      
      // Consider showing a development-only message
      if (isDevelopmentEnvironment) {
        setError('Using mock location for development. Real geolocation is often blocked in localhost/development environments.');
      }
      
      // Fetch nearby meetups based on the user's location
      fetchNearbyMeetups(mockLocation, currentZoom);
    };
    
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
          setLocation(newLocation);
          setSelectedLocation(newLocation);
          setIsLocationLoading(false);
          console.log('Location set successfully');
          
          // Fetch nearby meetups using the user's actual location
          fetchNearbyMeetups(newLocation, currentZoom);
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
          setLocation(defaultLocation);
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
          
          // Fetch nearby meetups using the fallback location
          fetchNearbyMeetups(defaultLocation, currentZoom);
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
      setLocation(defaultLocation);
      setSelectedLocation(defaultLocation);
      setIsLocationLoading(false);
      setError('Geolocation is not supported by your browser. Using default location.');
      
      // Fetch nearby meetups using the fallback location
      fetchNearbyMeetups(defaultLocation, currentZoom);
    }
    
    // Clean up timeout if component unmounts
    return () => clearTimeout(geolocationTimeout);
  }, []);

  // Fetch nearby meetups
  const fetchNearbyMeetups = async (userLocation, zoom) => {
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
  const handleLocationSelect = (location) => {
    Logger.info('MeetNowApp', 'Location selected', {
      location: location ? { lat: location.lat, lng: location.lng } : null
    });
    
    // First update selected location state
    setSelectedLocation(location);
    setSearchAddress(location.display_name || '');
    setSearchResults([]);
    
    // Check for valid location coordinates
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      Logger.error('MeetNowApp', 'Invalid location coordinates', location);
      return;
    }
    
    // Use the navigation controller to handle the actual navigation
    if (navigationController.current) {
      // Ensure the controller has a valid map reference before attempting navigation
      if (!navigationController.current.checkReadyStatus()) {
        Logger.warn('MeetNowApp', 'Navigation controller not ready, retrying in 1s');
        // Retry navigation after a short delay to allow map to be ready
        setTimeout(() => {
          if (navigationController.current) {
            navigationController.current.navigateTo(location, {
              animate: true,
              updateSelectedLocation: true
            })
            .catch(error => {
              Logger.error('MeetNowApp', 'Navigation failed on retry', error);
            });
          }
        }, 1000);
        return;
      }
      
      // Attempt immediate navigation
      navigationController.current.navigateTo(location, {
        animate: true,
        updateSelectedLocation: true
      })
      .then(() => {
        Logger.debug('MeetNowApp', 'Navigation completed successfully');
      })
      .catch(error => {
        Logger.error('MeetNowApp', 'Navigation failed', error);
      });
    } else {
      Logger.error('MeetNowApp', 'Navigation controller not available');
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
        handleLocationSelect(results[0]);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setError('Failed to search for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
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
        image: image
      });
      
      setMeetupCreated(true);
      // Clear form
      setTitle('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      
      // Refresh nearby meetups - use user's actual location, not the selected map point
      await fetchNearbyMeetups(location, currentZoom);
    } catch (error) {
      console.error('Error creating meetup:', error);
      setError('Failed to create meetup. Please try again.');
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
  
  // Request user location
  const requestUserLocation = () => {
    // Set loading state
    setIsLocationLoading(true);
    
    // Clear any previous errors
    setError('');
    
    // Check if we're in development environment (localhost)
    const isDevelopmentEnvironment = window.location.hostname === 'localhost' || 
                                     window.location.hostname === '127.0.0.1' ||
                                     window.location.hostname.includes('192.168.');
    
    // Function to use mock location for development
    const useMockLocation = () => {
      console.log('Using mock location for development environment');
      // Slightly different location than the default to show movement
      const mockLocation = { 
        lat: 34.053235, // Slightly different coordinates
        lng: -118.245683, 
        display_name: "Your Current Location (Dev Mode)"
      };
      
      // Update the user location (NOT the selected location)
      setLocation(mockLocation);
      setIsLocationLoading(false);
      
      // Different behavior based on current navigation mode
      if (mapRef.current) {
        const map = mapRef.current;
        
        if (currentNavigationMode === 1) {
          // In Free Navigation, we center on user location
          if (navigationController.current) {
            navigationController.current.setView(
              [mockLocation.lat, mockLocation.lng], 
              map.getZoom(),
              { animate: true }
            );
          } else {
            // Fallback to direct call if controller not available
            map.setView([mockLocation.lat, mockLocation.lng], map.getZoom(), {
              animate: true
            });
          }
        }
      }
      
      // Only show dev message if in dev mode
      if (isDevelopmentEnvironment) {
        setError('Using mock location in development mode. Real location services often fail in development environments.');
      }
    };
    
    // Create a timeout as a fallback
    const locationTimeout = setTimeout(() => {
      console.log('Geolocation request timed out');
      setIsLocationLoading(false);
      
      if (isDevelopmentEnvironment) {
        useMockLocation();
      } else {
        setError('Location request timed out. Using last known location.');
      }
    }, isDevelopmentEnvironment ? 5000 : 10000); // Shorter timeout in development
    
    // For development mode, optionally skip real geolocation
    if (isDevelopmentEnvironment) {
      // Option 1: Skip geolocation entirely
      // useMockLocation();
      // clearTimeout(locationTimeout);
      // return;
      
      // Option 2: Try geolocation but with shorter timeout (continuing with code below)
      console.log('Development environment detected in requestUserLocation. Trying geolocation with shorter timeout.');
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Clear timeout since we got a response
          clearTimeout(locationTimeout);
          
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            display_name: "Your Current Location"
          };
          
          // Update the user location (NOT the selected location)
          setLocation(newLocation);
          setIsLocationLoading(false);
          
          // Different behavior based on current navigation mode
          if (mapRef.current) {
            const map = mapRef.current;
            
            if (currentNavigationMode === 1) {
              // In Free Navigation, we center on user location
              if (navigationController.current) {
                navigationController.current.setView(
                  [newLocation.lat, newLocation.lng], 
                  map.getZoom(),
                  { animate: true }
                );
              } else {
                // Fallback to direct call if controller not available
                map.setView([newLocation.lat, newLocation.lng], map.getZoom(), {
                  animate: true
                });
              }
            } 
            // Other navigation modes use their specific behaviors
          }
        },
        (error) => {
          // Clear timeout since we got a response (error)
          clearTimeout(locationTimeout);
          
          console.error('Geolocation error in requestUserLocation:', error);
          setIsLocationLoading(false);
          
          // For development mode, use mock location
          if (isDevelopmentEnvironment) {
            console.log('Using mock location due to geolocation error in development');
            useMockLocation();
      return;
    }
  
          // Set user-friendly error message based on error code
          if (error.code === 1) {
            setError('Location permission denied. Please enable location access in your browser settings.');
          } else if (error.code === 2) { 
            // POSITION_UNAVAILABLE - likely due to network issues, VPN, or device limitations
            setError('Your location is currently unavailable. This may be due to network issues or VPN settings.');
            
            // Still use the existing location without changing it
            console.log('Using existing location due to POSITION_UNAVAILABLE');
          } else if (error.code === 3) {
            // TIMEOUT
            setError('Location request timed out. Using last known location.');
          } else {
            setError('Could not access your location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: isDevelopmentEnvironment ? 5000 : 8000, // Shorter timeout for development
          maximumAge: 60000 // Accept a location up to 1 minute old
        }
      );
    } else {
      // Clear timeout since we determined browser doesn't support geolocation
      clearTimeout(locationTimeout);
      
      console.warn('Geolocation is not supported by this browser');
      setIsLocationLoading(false);
      setError('Your browser does not support geolocation.');
    }
  };

  // Handle navigation mode change (free map, bird's eye view, vicinity)
  const handleNavigationModeChange = useCallback((mode) => {
    Logger.info('MeetNowApp', `Navigation mode change requested: ${mode}`);
    
    if (navigationController.current) {
      navigationController.current.setNavigationMode(mode);
      
      // Handle mode-specific behaviors
      if (mode === 2) { // Bird's eye view
        // If we have both user location and selected location, show bird's eye view
        if (location && selectedLocation) {
          navigationController.current.showBirdsEyeView(location, selectedLocation);
        }
      } else if (mode === 3) { // Vicinity mode
        // Focus on user's location with vicinity mode
        if (location) {
          navigationController.current.showVicinityView(location);
        }
      } else { // Free navigation mode
        // No specific actions needed, controller handles the mode change
      }
    } else {
      Logger.warn('MeetNowApp', 'Navigation controller not available for mode change');
    }
  }, [location, selectedLocation]);

  // MapClickHandler component
  const MapClickHandler = ({ onLocationSelect }) => {
    const map = useMap();
    
    useEffect(() => {
      // When map is mounted, update the map reference in the app
      if (mapRef.current !== map) {
        mapRef.current = map;
        setIsMapReady(true);
      }
    }, [map]);
    
    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;
      
      // First, provide immediate feedback with a friendly message instead of raw coordinates
      const tempLocation = {
        lat,
        lng,
        display_name: `Finding location...`
      };
      
      // This is a selected location, not user location
      // Pass to parent component to update only the selected location
      onLocationSelect(tempLocation);
      
      // Show loading indicator for reverse geocoding
      setIsReverseGeocoding(true);
      
      try {
        // Then fetch the actual address using reverse geocoding
        const results = await searchLocations(null, { lat, lng });
        
        if (results && results.length > 0) {
          const result = results[0];
          
          // By default, use the full address
          let displayName = result.display_name;
          let isSpecificLocation = false;
          
          // Try to find a place name in the result
          if (result.name) {
            // Direct name property - check if it's not just a general area
            if (result.type && !['suburb', 'neighbourhood', 'village', 'town', 'city', 'county', 'state', 'region', 'country'].includes(result.type)) {
              displayName = result.name;
              isSpecificLocation = true;
            }
          } else if (result.tags && result.tags.name) {
            // OSM tags may have a name - also check type if available
            if (result.tags.amenity || result.tags.building || result.tags.shop || 
                result.tags.tourism || result.tags.leisure || result.tags.historic) {
              displayName = result.tags.name;
              isSpecificLocation = true;
            }
          } 
          
          // If we don't yet have a specific location name, check address components
          if (!isSpecificLocation && result.address) {
            const address = result.address;
            
            // Try to find the most specific name (from most to least specific)
            const placeName = address.attraction || 
                             address.building ||
                             address.amenity ||
                             address.leisure ||
                             address.tourism ||
                             address.shop ||
                             address.historic || 
                             address.natural ||
                             address.office ||
                             address.healthcare || 
                             address.place_of_worship;
            
            // Check if we found a specific place (not just a general area)
            if (placeName) {
              // If we found a place name, use it
              displayName = placeName;
              isSpecificLocation = true;
              
              // For completeness, add the broader location context
              const context = [];
              
              // Add street number and street if available
              if (address.house_number && address.road) {
                context.push(`${address.house_number} ${address.road}`);
              } else if (address.road) {
                context.push(address.road);
              }
              
              // Add city/town/village
              if (address.city) context.push(address.city);
              else if (address.town) context.push(address.town);
              else if (address.village) context.push(address.village);
              
              // Add state/region
              if (address.state) context.push(address.state);
              
              // If we have context, append it to the place name
              if (context.length > 0) {
                displayName += `, ${context.join(', ')}`;
              }
            }
          }
          
          // If we still don't have a specific location, but we have address components,
          // construct a more helpful address string
          if (!isSpecificLocation && result.address) {
            const addr = result.address;
            const addressParts = [];
            
            // Build a more user-friendly address from components
            if (addr.house_number && addr.road) {
              addressParts.push(`${addr.house_number} ${addr.road}`);
            } else if (addr.road) {
              addressParts.push(addr.road);
            }
            
            // Add neighborhood/suburb if available
            if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
            else if (addr.suburb) addressParts.push(addr.suburb);
            
            // Add city/town/village
            if (addr.city) addressParts.push(addr.city);
            else if (addr.town) addressParts.push(addr.town);
            else if (addr.village) addressParts.push(addr.village);
            
            // Add state and postal code
            if (addr.state) {
              if (addr.postcode) {
                addressParts.push(`${addr.state} ${addr.postcode}`);
              } else {
                addressParts.push(addr.state);
              }
            } else if (addr.postcode) {
              addressParts.push(addr.postcode);
            }
            
            // Add country if it's not the user's own country (could be determined from browser locale)
            if (addr.country && !addr.country.includes('United States')) {
              addressParts.push(addr.country);
            }
            
            // Create a clean address string if we have parts
            if (addressParts.length > 0) {
              displayName = addressParts.join(', ');
            }
            // Otherwise fall back to the default display_name
          }
          
          // Update with the place name or address - this is a selected location, not user location
          const locationWithAddress = {
            ...result,
            lat, // Use the exact clicked coordinates
            lng,
            display_name: displayName
          };
          onLocationSelect(locationWithAddress);
        }
      } catch (error) {
        console.error('Error reverse geocoding location:', error);
        // If geocoding fails, show a user-friendly error message instead of coordinates
        const errorLocation = {
          lat,
          lng,
          display_name: "Unable to find address"
        };
        onLocationSelect(errorLocation);
      } finally {
        // Hide loading indicator
        setIsReverseGeocoding(false);
      }
    };
    
    useEffect(() => {
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }, [map, handleClick]);
    
    return null;
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
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.3);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      70% {
        transform: scale(2);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }
  `;

  // Reset error state when component remounts or key updates
  useEffect(() => {
    setHadError(false);
  }, [mapKey.current]);
  
  // Graceful error handling
  const handleComponentError = (error, errorInfo) => {
    console.error("MeetNowApp encountered an error:", error, errorInfo);
    setHadError(true);
    // Prevent further renders that might cause cascading errors
    setNearbyMeetups([]);
    setIsMapReady(false);
  };
  
  // NavigationWidget - Advanced mode control
  const NavigationWidget = ({ navMode, setNavMode, mapMode, setMapMode, showMinimap, setShowMinimap }) => {
    const map = useMap();
    
    // Handle mode change
    const handleModeChange = (mode) => {
      setNavMode(mode);
      
      // Apply mode-specific behaviors
      if (mode === 'measure' && map && window.L) {
        try {
          // Clean up any existing measurement tools
          if (map._measureControl) {
            map.removeControl(map._measureControl);
            map._measureControl = null;
          }
          
          // Initialize measurement tool
          if (window.L.control.measure) {
            map._measureControl = window.L.control.measure({
              primaryLengthUnit: 'meters',
              secondaryLengthUnit: 'kilometers',
              primaryAreaUnit: 'sqmeters',
              secondaryAreaUnit: 'hectares'
            }).addTo(map);
      } else {
            console.log('Measurement control not available - would activate here');
            // Fallback behavior - just show an alert
            alert('Measurement tool would activate here.');
          }
        } catch (error) {
          console.error('Error activating measure mode:', error);
        }
      };
    };
    
    // Handle map type change
    const handleMapTypeChange = (type) => {
      setMapMode(type);
      
      try {
        // Remove existing tile layers
        if (map) {
          map.eachLayer(layer => {
            if (layer instanceof window.L.TileLayer) {
              map.removeLayer(layer);
            }
          });
          
          // Add new tile layer based on selected type
          if (type === 'satellite') {
            window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }).addTo(map);
          } else if (type === 'terrain') {
            window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
              attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
            }).addTo(map);
          } else {
            // Default OpenStreetMap
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
          }
        }
      } catch (error) {
        console.error('Error changing map type:', error);
      }
    };
    
    // Toggle minimap
    const toggleMinimap = () => {
      setShowMinimap(!showMinimap);
    };
    
    return (
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex space-x-2 mb-2">
            <button
              className={`p-2 rounded-md text-xs ${navMode === 'browse' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => handleModeChange('browse')}
            >
              Browse
            </button>
            
            <button
              className={`p-2 rounded-md text-xs ${navMode === 'measure' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => handleModeChange('measure')}
            >
              Measure
            </button>
            
            <button
              className={`p-2 rounded-md text-xs ${navMode === 'layers' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => handleModeChange('layers')}
            >
              Layers
            </button>
          </div>
          
          {navMode === 'layers' && (
            <>
              <button
                className={`p-2 rounded-md text-xs ${mapMode === 'default' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                onClick={() => handleMapTypeChange('default')}
              >
                Map
              </button>
              
              <button
                className={`p-2 rounded-md text-xs ${mapMode === 'satellite' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                onClick={() => handleMapTypeChange('satellite')}
              >
                Satellite
              </button>
              
              <button
                className={`p-2 rounded-md text-xs ${mapMode === 'terrain' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                onClick={() => handleMapTypeChange('terrain')}
              >
                Terrain
              </button>
              
              <div className="h-0.5 bg-gray-200 my-1"></div>
              
              <button
                className={`p-2 rounded-md text-xs ${showMinimap ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                onClick={toggleMinimap}
              >
                Minimap: {showMinimap ? 'On' : 'Off'}
              </button>
            </>
          )}
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gray-100">
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
              <div><strong>Map Key:</strong> {mapKey.current}</div>
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
            ) : (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          }>
                <div id="map-container" className="h-full w-full">
                  {location && selectedLocation && (
                    <MapContainer
                      key={mapKey.current}
                      center={[selectedLocation.lat, selectedLocation.lng]}
                      zoom={currentZoom}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false} // Disable default zoom control, we'll position it manually
                      whenCreated={(map) => {
                        try {
                          mapRef.current = map;
                          Logger.info('MeetNowApp', 'Map created via whenCreated callback');
                          
                          // Don't call handleMapReady here - it's better to wait for the whenReady event
                          // which ensures the map is fully initialized
                          console.log('Map created successfully');
                        } catch (error) {
                          console.error('Error setting map reference:', error);
                        }
                      }}
                      whenReady={(e) => {
                        try {
                          console.log('Map is ready');
                          
                          // The map instance comes from e.target in the whenReady event
                          const map = e.target;
                          
                          // Now it's safe to handle map ready with the fully initialized map
                          handleMapReady(map);
                          
                          // Additional safety - ensure our mapRef is properly set
                          if (!mapRef.current) {
                            mapRef.current = map;
                          }
                        } catch (error) {
                          console.error('Error in map ready handler:', error);
                          Logger.error('MeetNowApp', 'Error in map ready handler', error);
                        }
                      }}
                    >
                      {/* Base tile layer */}
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Custom positioned zoom control */}
                      <ZoomControl position="bottomright" />
                      
                      {/* Navigation Widget */}
                      <NavigationWidget 
                        navMode={navMode} 
                        setNavMode={setNavMode} 
                        mapMode={mapMode} 
                        setMapMode={setMapMode}
                        showMinimap={showMinimap}
                        setShowMinimap={setShowMinimap}
                      />
                      
                      {/* Advanced MapViewControlBar for the three navigation modes */}
                      <MapViewControlBar 
                        initialMode={navigationController.current ? navigationController.current.getNavigationMode() : 1}
                        onModeChange={handleNavigationModeChange}
                        userLocation={location}
                        selectedLocation={selectedLocation}
                        navigationController={navigationController.current}
                      />
                      
                      {/* Vicinity Indicator - only visible in Vicinity mode */}
                      <VicinityIndicator 
                        currentMode={navigationController.current ? navigationController.current.getNavigationMode() : 1}
                        userLocation={location}
                        navigationController={navigationController.current}
                      />
                      
                      {/* Bird's Eye flight path - only visible in Bird's Eye View mode */}
                      <BirdsEyePathOverlay 
                        isActive={navigationController.current ? navigationController.current.getNavigationMode() === 2 : false}
                        userLocation={location}
                        selectedLocation={selectedLocation}
                        navigationController={navigationController.current}
                      />
                      
                      {/* User location marker */}
                      {location && 
                       typeof location.lat === 'number' && 
                       typeof location.lng === 'number' && (
                        <Marker 
                          position={[location.lat, location.lng]}
                          icon={L.divIcon({
                            className: 'user-location-marker',
                            html: '<div style="width: 24px; height: 24px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 12px; height: 12px;"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg></div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold">Your Location</h3>
                              <p className="text-sm">{location.display_name || 'Current location'}</p>
        </div>
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Selected location marker */}
                      {selectedLocation && 
                       typeof selectedLocation.lat === 'number' && 
                       typeof selectedLocation.lng === 'number' && 
                       // Only show if different from user location
                       (selectedLocation.lat !== location.lat || selectedLocation.lng !== location.lng) && (
                        <Marker 
                          position={[selectedLocation.lat, selectedLocation.lng]}
                          icon={L.divIcon({
                            className: 'selected-location-marker',
                            html: '<div style="width: 24px; height: 24px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 12px; height: 12px;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold">{title || 'Selected Location'}</h3>
                              <p className="text-sm">{selectedLocation.display_name}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      
                      {Array.isArray(nearbyMeetups) && nearbyMeetups.map(meetup => 
                        meetup && 
                        typeof meetup.location === 'object' && 
                        typeof meetup.location.lat === 'number' && 
                        typeof meetup.location.lng === 'number' && (
                          <Marker
                            key={meetup.id || `meetup-${Math.random()}`}
                            position={[meetup.location.lat, meetup.location.lng]}
                            icon={L.divIcon({
                              className: 'meetup-marker',
                              html: '<div style="width: 28px; height: 28px; background-color: #8b5cf6; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 14px; height: 14px;"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg></div>',
                              iconSize: [28, 28],
                              iconAnchor: [14, 14]
                            })}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold">{meetup.title || 'Unnamed Meetup'}</h3>
                                <p className="text-sm">{meetup.description || 'No description available'}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      )}
                      
                      <MapClickHandler onLocationSelect={handleLocationSelect} />
                    </MapContainer>
                  )}
                </div>
          </Suspense>
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
                    <div className="mt-1 flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                                id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        Choose Image
                      </label>
                      {imagePreview && (
                        <div className="relative w-20 h-20">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
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
                                    // Stop event propagation to prevent it from reaching the form
                                    e.stopPropagation();
                                    // Prevent default browser behavior (form submission)
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
                                          
                                          // This is a selected location, not user location
                                          // Only update selectedLocation, not the user's location
                                          setSelectedLocation(result);
                                          setSearchAddress(result.display_name || '');
                                          setSearchResults([]);
                                          
                                          // Different behavior based on the current navigation mode
                                          if (mapRef.current) {
                                            const map = mapRef.current;
                                            if (navigationController.current.getNavigationMode() === 1) {
                                              // Free Navigation: Just center the map on the location
                                              console.log("Free Navigation mode: centering map on selected location");
                                              const currentMapZoom = map.getZoom();
                                              map.setView([result.lat, result.lng], currentMapZoom, { 
                                                animate: true,
                                                duration: 0.75
                                              });
                                            }
                                            else if (navigationController.current.getNavigationMode() === 2) {
                                              // Bird's Eye View: Show both user and selected location
                                              console.log("Bird's Eye View mode: showing both user and selected locations");
                                              if (map._setMapViewMode) {
                                                // Use the existing map mode controller to update the view
                                                map._setMapViewMode(2, {
                                                  userLocation: location, // Use current user location
                                                  selectedLocation: result, // Use newly selected location
                                                  immediate: true
                                                });
                                              } else {
                                                // Fallback - create a bounds that contains both points
                                                const bounds = L.latLngBounds(
                                                  [location.lat, location.lng],
                                                  [result.lat, result.lng]
                                                );
                                                map.fitBounds(bounds, { padding: [50, 50] });
                                              }
                                            }
                                            else if (navigationController.current.getNavigationMode() === 3) {
                                              // Vicinity mode: Focus on user location
                                              console.log("Vicinity mode: maintaining focus on user location");
                                              // For vicinity mode, we DON'T change the map view
                                              // Just update the selected location in state
                                            }
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
                                  onClick={() => handleLocationSelect(result)}
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
              <div className="absolute top-[10%] right-4 z-10 w-96">
                <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
                  <CardContent>
                    <NearbyMeetups 
                      meetups={nearbyMeetups} 
                      currentLocation={location}
                      mapZoom={currentZoom}
                      onMeetupClick={handleLocationSelect}
                    />
                  </CardContent>
                </Card>
                            </div>
                          )}

            {/* MiniMap component - positioned at bottom right */}
            {showMinimap && !isLocationLoading && location && selectedLocation && (
              <div className="absolute bottom-4 right-4 z-10 w-96">
                <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-md">
                  <CardContent className="p-2">
                    <h3 className="text-sm font-semibold mb-1 text-center">Overview Map</h3>
                    <MiniMapComponent
                      userLocation={location}
                      selectedLocation={selectedLocation}
                      onModeChange={handleNavigationModeChange}
                      navigationController={navigationController.current}
                    />
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

      {/* Debug Console */}
      {process.env.NODE_ENV === 'development' && (
        <DebugConsole 
          mapRef={mapRef}
          mapNavigator={navigationController.current}
          currentMode={navigationController.current ? navigationController.current.getNavigationMode() : 1}
          selectedLocation={selectedLocation}
          userLocation={location}
          onNavigationTest={(loc) => {
            if (navigationController.current) {
              navigationController.current.navigateTo(loc);
            }
          }}
        />
      )}
    </div>
  );
};

export default MeetNowApp;