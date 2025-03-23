import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Button, Input, Card, CardContent } from '@/components/ui';
import Loading from '@/components/ui/loading';
import NearbyMeetups from '@/components/ui/nearby-meetups';
import { FaMapMarkerAlt, FaCog, FaTimes, FaCompass, FaLayerGroup, FaRuler, FaSearch, FaCheck, FaUser, FaSignOutAlt, FaCreditCard } from 'react-icons/fa';
import { createFreeMeetup, getNearbyFreeMeetups } from '@/utils/meetup';
import { searchLocations } from '@/utils/location-services';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Credits from './components/Credits';

// Import the navigation related components
import MapViewControlBar from './components/map/MapViewControlBar';
import BirdsEyePathOverlay from './components/map/BirdsEyePathOverlay';
import VicinityCircle from './components/map/VicinityCircle';
import RadarOverlay from './components/map/RadarOverlay';
import MiniMapComponent from './components/map/MiniMapComponent';

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
  const [showMinimap, setShowMinimap] = useState(true);
  const [mapMode, setMapMode] = useState('default'); // 'default', 'satellite', 'terrain'
  const [navMode, setNavMode] = useState('browse'); // 'browse', 'measure', 'layers'
  const [currentNavigationMode, setCurrentNavigationMode] = useState(1); // 1: Free Nav, 2: Bird's Eye, 3: Vicinity
  
  // Refs
  const mapRef = useRef(null);
  const mapKey = useRef(1);
  
  // Update map key when returning from admin panel
  useEffect(() => {
    if (!showAdmin) {
      // When leaving admin mode, increment key to force map recreation
      mapKey.current += 1;
    }
  }, [showAdmin]);
  
  // Fetch meetups when location changes
  useEffect(() => {
    // Add validation before triggering fetch
    if (selectedLocation && 
        isMapReady && 
        typeof selectedLocation.lat === 'number' && 
        typeof selectedLocation.lng === 'number' &&
        !isLocationLoading) { // Only fetch when location is fully loaded
      fetchNearbyMeetups(selectedLocation, currentZoom);
    }
  }, [selectedLocation, isMapReady, currentZoom, isLocationLoading]);
  
  // Periodic refresh of nearby meetups
  useEffect(() => {
    if (!isMapReady || isLocationLoading) return; // Don't start interval if location is still loading
    
    const refreshInterval = setInterval(() => {
      // Add validation before triggering refresh
      if (selectedLocation && 
          typeof selectedLocation.lat === 'number' && 
          typeof selectedLocation.lng === 'number') {
        fetchNearbyMeetups(selectedLocation, currentZoom);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [selectedLocation, isMapReady, currentZoom, isLocationLoading]);
  
  // Initial location setup
  useEffect(() => {
    console.log('Initial location setup effect running');
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      console.log('Geolocation is supported, requesting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fall back to default location only if geolocation fails
          const defaultLocation = { 
            lat: 37.7749, 
            lng: -122.4194, 
            display_name: 'San Francisco, CA'
          };
          console.log('Using default location:', defaultLocation);
          setLocation(defaultLocation);
          setSelectedLocation(defaultLocation);
          setIsLocationLoading(false);
          setError('Could not access your location. Using default location instead.');
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    } else {
      // Browser doesn't support geolocation
      console.warn('Geolocation is not supported by this browser');
      const defaultLocation = { 
        lat: 37.7749, 
        lng: -122.4194, 
        display_name: 'San Francisco, CA'
      };
      console.log('Using default location (no geolocation support):', defaultLocation);
      setLocation(defaultLocation);
      setSelectedLocation(defaultLocation);
      setIsLocationLoading(false);
      setError('Geolocation is not supported by your browser. Using default location.');
    }
  }, []);

  // Fetch nearby meetups
  const fetchNearbyMeetups = async (userLocation, zoom) => {
    // Validate location data thoroughly before proceeding
    if (!userLocation || 
        typeof userLocation !== 'object' || 
        typeof userLocation.lat !== 'number' || 
        typeof userLocation.lng !== 'number' ||
        isNaN(userLocation.lat) || 
        isNaN(userLocation.lng)) {
      console.log('Skipping meetup fetch - invalid location:', userLocation);
      return;
    }
    
    try {
      setIsLoading(true);
      // Calculate radius based on zoom level (higher zoom = smaller radius)
      const radius = Math.max(2000, 20000 / (zoom || 13));
      const meetups = await getNearbyFreeMeetups(userLocation.lat, userLocation.lng, radius);
      
      // Only update state if we got a valid array back
      if (Array.isArray(meetups)) {
        setNearbyMeetups(meetups);
      } else {
        console.warn('Received non-array meetups data:', meetups);
        setNearbyMeetups([]);
      }
    } catch (error) {
      console.error('Error fetching nearby meetups:', error);
      // Don't show error to user during automatic refreshes
      if (!isMapReady) {
        setError('Failed to fetch nearby meetups.');
      }
      // Ensure nearbyMeetups is always an array
      setNearbyMeetups([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelect = (location) => {
    console.log("handleLocationSelect called with:", location);
    
    // First update selected location state
    setSelectedLocation(location);
    setSearchAddress(location.display_name || '');
    setSearchResults([]);
    
    // Note: We are NOT updating the user location (setLocation)
    // This preserves the distinction between user location and selected location
    
    // Handle map view update based on the current navigation mode
    if (mapRef.current) {
      const map = mapRef.current;
      
      try {
        console.log("Navigation mode when selecting location:", currentNavigationMode);
        
        switch (currentNavigationMode) {
          case 1: // Free Navigation
            // Just center on the selected location without changing zoom
            const currentMapZoom = map.getZoom();
            console.log("Free Navigation: centering at zoom", currentMapZoom);
            
            map.setView([location.lat, location.lng], currentMapZoom, {
              animate: true,
              duration: 0.75
            });
            break;
            
          case 2: // Bird's Eye View
            // Show both the user's location and the selected location
            console.log("Bird's Eye View: showing both user and selected points");
            
            if (map._setMapViewMode) {
              // Use the existing map mode controller with the CURRENT user location
              map._setMapViewMode(2, {
                userLocation: location, // User location stays as-is
                selectedLocation: location, // Selected location is the new one
                immediate: true
              });
            } else {
              // Create a bounds that includes both user and selected location
              const bounds = L.latLngBounds(
                // User location (from state)
                L.latLng(location.lat, location.lng),
                // Selected location (newly clicked/searched)
                L.latLng(location.lat, location.lng)
              );
              
              // If bounds are too small (same point), add padding
              if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                bounds.pad(0.5);
              }
              
              map.fitBounds(bounds, {
                animate: true,
                padding: [50, 50],
                maxZoom: 16
              });
            }
            break;
            
          case 3: // Vicinity
            // Keep focus on user location regardless of selection
            console.log("Vicinity mode: keeping focus on user location");
            
            if (map._setMapViewMode) {
              // Use user location from state, not the newly selected location
              map._setMapViewMode(3, {
                userLocation: location,
                immediate: true
              });
            } else {
              // Fallback - high zoom centered on user location (from state)
              map.setView([location.lat, location.lng], 18, {
                animate: true,
                duration: 0.75
              });
            }
            break;
            
          default:
            // Fallback behavior - just center on the selected location
            map.setView([location.lat, location.lng], map.getZoom());
            break;
        }
      } catch (error) {
        console.error('Error updating map view:', error);
        
        // Emergency fallback - direct centering
        map.setView([location.lat, location.lng], map.getZoom(), {
          animate: false
        });
      }
    } else {
      console.warn("Map reference not available");
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
      
      // Refresh nearby meetups
      await fetchNearbyMeetups(selectedLocation, currentZoom);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            display_name: "Your Current Location"
          };
          
          // Update the user location (NOT the selected location)
          setLocation(newLocation);
          
          // Different behavior based on current navigation mode
          if (mapRef.current) {
            const map = mapRef.current;
            
            if (currentNavigationMode === 1) {
              // In Free Navigation, we center on user location
              map.setView([newLocation.lat, newLocation.lng], map.getZoom(), {
                animate: true
              });
            } 
            else if (currentNavigationMode === 2) {
              // In Bird's Eye View, we show both user and selected location
              if (selectedLocation && 
                  typeof selectedLocation.lat === 'number' && 
                  typeof selectedLocation.lng === 'number') {
                  
                // If we have a selected location, fit bounds to show both
                const bounds = L.latLngBounds(
                  [newLocation.lat, newLocation.lng],
                  [selectedLocation.lat, selectedLocation.lng]
                );
                
                map.fitBounds(bounds, { 
                  padding: [50, 50],
                  animate: true,
                  maxZoom: 16
                });
              } else {
                // If no selected location, just center on user
                map.setView([newLocation.lat, newLocation.lng], 15, {
                  animate: true
                });
              }
            }
            else if (currentNavigationMode === 3) {
              // In Vicinity mode, we focus on the user location at high zoom
              map.setView([newLocation.lat, newLocation.lng], 18, {
                animate: true
              });
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Could not access your location. Please check your browser settings.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Handle navigation mode change (free map, bird's eye view, vicinity)
  const handleNavigationModeChange = (mode) => {
    console.log(`Navigation mode changed to: ${mode}`);
    setCurrentNavigationMode(mode);
  };

  // MapClickHandler component
  const MapClickHandler = ({ onLocationSelect }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
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
      
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }, [map, onLocationSelect]);
    
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
            <button
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>}
        >
            {/* Admin debug info */}
            <div className="absolute top-20 right-4 z-50 bg-white p-2 rounded shadow-md text-xs">
              <div><strong>Admin Status:</strong> {isAdmin ? 'YES' : 'NO'}</div>
              <div><strong>User ID:</strong> {user ? user.id?.substring(0, 8) + '...' : 'Not logged in'}</div>
              <div><strong>Map Key:</strong> {mapKey.current}</div>
            </div>
            
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
                      setIsMapReady(true);
                      console.log('Map created successfully');
                    } catch (error) {
                      console.error('Error setting map reference:', error);
                    }
                  }}
                  whenReady={() => {
                    console.log('Map is ready');
                    setIsMapReady(true);
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
                    initialMode={1}
                    onModeChange={handleNavigationModeChange}
                    userLocation={location}
              selectedLocation={selectedLocation}
                  />
                  
                  {/* Vicinity Circle - only visible in Vicinity mode */}
                  <VicinityCircle 
                    currentMode={currentNavigationMode}
                    userLocation={location}
                    radiusMeters={150}
                  />
                  
                  {/* Radar animation - only active in Vicinity mode */}
                  <RadarOverlay 
                    isActive={currentNavigationMode === 3}
                    userLocation={location}
                    radiusMeters={150}
                  />
                  
                  {/* Bird's Eye flight path - only visible in Bird's Eye View mode */}
                  <BirdsEyePathOverlay 
                    isActive={currentNavigationMode === 2}
                    userLocation={location}
                    selectedLocation={selectedLocation}
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

        {/* Add a "Use My Location" button */}
            <div className="absolute top-4 right-20 z-10">
          {!isLocationLoading && location && (
          <button
            onClick={requestUserLocation}
            className="px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 flex items-center space-x-2"
          >
            <FaMapMarkerAlt className="text-blue-500" />
            <span>Use My Location</span>
          </button>
          )}
        </div>

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
                                          if (currentNavigationMode === 1) {
                                            // Free Navigation: Just center the map on the location
                                            console.log("Free Navigation mode: centering map on selected location");
                                            const currentMapZoom = map.getZoom();
                                            map.setView([result.lat, result.lng], currentMapZoom, { 
                                              animate: true,
                                              duration: 0.75
                                            });
                                          }
                                          else if (currentNavigationMode === 2) {
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
                                          else if (currentNavigationMode === 3) {
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
                        </form>
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
                        <h3 className="text-lg font-semibold mb-2">Nearby Meetups</h3>
                        <div className="space-y-2 max-h-60 overflow-auto">
                          {nearbyMeetups.map(meetup => meetup && (
                            <div 
                              key={meetup.id || `meetup-item-${Math.random()}`}
                              className="p-2 bg-white/70 rounded-md cursor-pointer hover:bg-white/90"
                                  onClick={() => {
                                if (mapRef.current && 
                                    typeof mapRef.current.flyTo === 'function' && 
                                    meetup.location && 
                                    typeof meetup.location.lat === 'number' && 
                                    typeof meetup.location.lng === 'number') {
                                  try {
                                    mapRef.current.flyTo([meetup.location.lat, meetup.location.lng], 15);
                                  } catch (error) {
                                    console.error('Error navigating to meetup:', error);
                                  }
                                }
                              }}
                            >
                              <div className="font-medium">{meetup.title || 'Unnamed Meetup'}</div>
                              <div className="text-sm text-gray-600 truncate">{meetup.description || 'No description'}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* MiniMap component - placed under the location field */}
                {showMinimap && !isLocationLoading && location && selectedLocation && (
                  <div className="absolute bottom-4 left-4 z-10 w-64">
                    <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
                      <CardContent className="p-2">
                        <h3 className="text-sm font-semibold mb-1">Overview Map</h3>
                        <MiniMapComponent
                          userLocation={location}
                          selectedLocation={selectedLocation}
                          onMiniMapClick={() => {
                            // When clicked, center the main map on the selected location
                            // and set to free navigation mode with high zoom
                            if (mapRef.current && selectedLocation) {
                              console.log("Minimap clicked - zooming to selected location");
                              
                              // Set to Free Navigation mode first to ensure map control
                              if (currentNavigationMode !== 1) {
                                setCurrentNavigationMode(1);
                              }
                              
                              // Use high zoom (19 is max for most map providers)
                              const highZoom = 19;
                              
                              // Force immediate view change with animation
                              mapRef.current.flyTo(
                                [selectedLocation.lat, selectedLocation.lng],
                                highZoom,
                                {
                                  animate: true,
                                  duration: 0.75
                                }
                              );
                              
                              // Ensure any mode-specific constraints are cleared
                              mapRef.current._overrideCenter = false;
                              mapRef.current._birdEyeViewActive = false;
                              mapRef.current._vicinityActive = false;
                              
                              if (mapRef.current._directSetMode) {
                                // Tell the map controller we're in free navigation mode
                                mapRef.current._directSetMode(1);
                              }
                            }
                          }}
                          zoom={19}
                          width="100%"
                          height="150px"
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}
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
      
        <div 
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-up"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default MeetNowApp;