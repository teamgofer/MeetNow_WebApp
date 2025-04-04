import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import '../global.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import AnimatedUserLocationMarker from './map/AnimatedUserLocationMarker';
import PinMarker from './map/PinMarker';
import MemoizedMeetupMarker from './map/MemoizedMeetupMarker';
import DirectionsControl from './map/DirectionsControl';
import { UnifiedMeetupCard, CardMode, CardWrapper, } from './meetup';
import { NearbyMeetups } from './ui/nearby-meetups';
import GlobeIcon from './ui/GlobeIcon';
import { getNearbyMeetups, createNewMeetup } from '../lib/supabase';
import { fromPostGISPoint } from '../lib/geo-utils';
import { getFeatureFlag } from '../utils/feature-flags';
import { refreshMeetupImageUrls } from '../utils/meetup/index';
import CacheMonitor from './debug/CacheMonitor';
import useDirections from '../hooks/useDirections';
const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 13;
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
const LocationDetector = ({ onLocationFound, onLocationError }) => {
    const map = useMap();
    useEffect(() => {
        let locationResolved = false;
        const fallbackTimer = setTimeout(() => {
            if (!locationResolved) {
                console.warn('Location detection timed out');
                onLocationError();
            }
        }, 5000);
        map.locate({
            setView: false,
            maxZoom: 20,
            enableHighAccuracy: true,
            watch: false,
            timeout: 4000,
            maximumAge: 1 * 60 * 1000,
        });
        setTimeout(() => {
            if (!locationResolved) {
                map.locate({
                    setView: false,
                    maxZoom: 19,
                    enableHighAccuracy: false,
                    watch: false,
                    timeout: 3000,
                    maximumAge: 5 * 60 * 1000,
                });
            }
        }, 100);
        const handleLocationFound = (e) => {
            if (!locationResolved) {
                clearTimeout(fallbackTimer);
                locationResolved = true;
                const userPos = [e.latlng.lat, e.latlng.lng];
                onLocationFound(userPos, e.accuracy);
                map.setView(userPos, 19.5);
                try {
                    sessionStorage.setItem('cachedLocation', JSON.stringify({
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                        accuracy: e.accuracy,
                        timestamp: Date.now(),
                    }));
                }
                catch (err) {
                    console.warn('Failed to cache location:', err);
                }
            }
        };
        const handleLocationError = (e) => {
            console.warn('Location error:', e.message);
        };
        try {
            const cachedLocationStr = sessionStorage.getItem('cachedLocation');
            if (cachedLocationStr) {
                const cachedLocation = JSON.parse(cachedLocationStr);
                const cacheAge = Date.now() - (cachedLocation.timestamp || 0);
                if (cacheAge < 5 * 60 * 1000) {
                    locationResolved = true;
                    clearTimeout(fallbackTimer);
                    const userPos = [cachedLocation.lat, cachedLocation.lng];
                    onLocationFound(userPos, cachedLocation.accuracy || 1000);
                    map.setView(userPos, 19.5);
                    console.log('Using cached location');
                    map.locate({
                        setView: false,
                        maxZoom: 20,
                        enableHighAccuracy: true,
                        watch: false,
                        timeout: 8000,
                        maximumAge: 0,
                    });
                }
            }
        }
        catch (err) {
            console.warn('Error reading cached location:', err);
        }
        map.on('locationfound', handleLocationFound);
        map.on('locationerror', handleLocationError);
        return () => {
            clearTimeout(fallbackTimer);
            map.off('locationfound', handleLocationFound);
            map.off('locationerror', handleLocationError);
            map.stopLocate();
        };
    }, [map, onLocationFound, onLocationError]);
    return null;
};
const MapInitializer = ({ onMapReady, onMapClick }) => {
    const map = useMap();
    useEffect(() => {
        onMapReady(map);
        map.on('click', onMapClick);
        return () => {
            map.off('click', onMapClick);
        };
    }, [map, onMapReady, onMapClick]);
    return null;
};
const convertToIMeetup = (meetup) => {
    let lat = 0, lng = 0;
    if (meetup.location) {
        const position = fromPostGISPoint(meetup.location);
        lat = position.lat;
        lng = position.lng;
    }
    else {
        lat = meetup.lat || meetup.latitude || 0;
        lng = meetup.lng || meetup.longitude || meetup.lon || 0;
    }
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
        starts_at: meetup.starts_at || meetup.created_at || new Date().toISOString(),
        duration_minutes: meetup.duration_minutes || 60,
    };
};
const transformAddressToLocationName = (data) => {
    if (!data)
        return 'Unknown Location';
    if (data.display_name) {
        const parts = [];
        if (data.address) {
            const relevantParts = [
                data.address.amenity,
                data.address.building,
                data.address.shop,
                data.address.leisure,
                data.address.tourism,
            ].filter(Boolean);
            if (relevantParts.length > 0) {
                parts.push(relevantParts[0]);
            }
            const locationContext = [
                data.address.road,
                data.address.neighbourhood,
                data.address.suburb,
                data.address.quarter,
            ].filter(Boolean);
            if (locationContext.length > 0) {
                parts.push(locationContext[0]);
            }
            const cityPart = data.address.city || data.address.town || data.address.village || data.address.hamlet;
            if (cityPart)
                parts.push(cityPart);
            if (data.address.state && data.address.country_code === 'us') {
                parts.push(data.address.state);
            }
            if (data.address.country) {
                parts.push(data.address.country);
            }
        }
        if (parts.length === 0) {
            const shortened = data.display_name.split(',').slice(0, 3).join(',');
            return shortened.length < 60 ? shortened : shortened.substring(0, 60) + '...';
        }
        return parts.join(', ');
    }
    if (data.lat && data.lon) {
        return `Location near (${parseFloat(data.lat).toFixed(4)}, ${parseFloat(data.lon).toFixed(4)})`;
    }
    return 'Selected Location';
};
const LocationLoadingIndicator = ({ isLoading, isFallback }) => {
    const [loadingMessage, setLoadingMessage] = useState('Finding your location...');
    useEffect(() => {
        if (!isLoading)
            return;
        const messages = ['Finding your location...', 'Checking nearby meetups...', 'Almost there...'];
        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % messages.length;
            setLoadingMessage(messages[currentIndex] || 'Loading...');
        }, 2000);
        return () => clearInterval(interval);
    }, [isLoading]);
    if (!isLoading)
        return null;
    return (_jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-90 z-50", children: _jsxs("div", { className: "text-center p-6 max-w-md", children: [_jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6" }), _jsx("h2", { className: "text-2xl font-semibold text-gray-800 mb-2", children: loadingMessage }), _jsx("p", { className: "text-gray-600 mb-4", children: isFallback
                        ? 'Using approximate location while we find you...'
                        : "We're getting your exact position to center the map." }), _jsx("div", { className: "w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 animate-pulse" }) })] }) }));
};
const MeetNowApp = () => {
    const useEnhancedCard = getFeatureFlag('USE_ENHANCED_MEETUP_CARD');
    const useUnifiedCard = getFeatureFlag('USE_UNIFIED_CARD');
    const enableAnimations = getFeatureFlag('ENABLE_ANIMATIONS');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [userAccuracy, setUserAccuracy] = useState(0);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [selectedMeetupId, setSelectedMeetupId] = useState(null);
    const [selectedPinId, setSelectedPinId] = useState(null);
    const [tempPin, setTempPin] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [address, setAddress] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [meetups, setMeetups] = useState([]);
    const [meetupCreated, setMeetupCreated] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [isUsingFallbackLocation, setIsUsingFallbackLocation] = useState(false);
    const mapRef = useRef(null);
    const fileInputRef = useRef(null);
    const fileRef = useRef(null);
    const mapInitialized = useRef(false);
    const geocodingRequestRef = useRef(null);
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
    const fallbackLocations = [
        { city: 'New York', coords: [40.7128, -74.006] },
        { city: 'Los Angeles', coords: [34.0522, -118.2437] },
        { city: 'Chicago', coords: [41.8781, -87.6298] },
        { city: 'London', coords: [51.5074, -0.1278] },
        { city: 'Tokyo', coords: [35.6762, 139.6503] },
    ];
    const getRandomFallbackLocation = () => {
        if (fallbackLocations.length === 0) {
            return { city: 'New York', coords: [40.7128, -74.006] };
        }
        const randomIndex = Math.floor(Math.random() * fallbackLocations.length);
        return fallbackLocations[randomIndex];
    };
    const [selectedMeetup, setSelectedMeetup] = useState(null);
    const [clickedLocation, setClickedLocation] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [directionsState, directionsActions] = useDirections({
        showAlternatives: true,
        autoRefresh: true,
    });
    const fetchNearbyMeetups = useCallback(async (customLocation) => {
        const location = customLocation || (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null);
        if (!location) {
            console.log('No location available to fetch meetups');
            return;
        }
        try {
            setIsLoading(true);
            console.log(`Fetching nearby meetups at (${location.lat}, ${location.lng})`);
            const result = await getNearbyMeetups(location.lat, location.lng, 5000);
            if (result.success && result.meetups) {
                console.log(`Found ${result.meetups.length} nearby meetups`);
                const formattedMeetups = result.meetups.map(convertToIMeetup);
                const handleMeetupUpdate = (updatedMeetup, index) => {
                    setMeetups(currentMeetups => {
                        if (!currentMeetups || index >= currentMeetups.length)
                            return currentMeetups;
                        const newMeetups = [...currentMeetups];
                        newMeetups[index] = updatedMeetup;
                        return newMeetups;
                    });
                };
                const meetupsWithVisibleSignedUrls = await refreshMeetupImageUrls(formattedMeetups, 86400, 5, handleMeetupUpdate);
                setMeetups(meetupsWithVisibleSignedUrls);
            }
            else {
                throw new Error(result.error || 'Failed to fetch meetups');
            }
        }
        catch (err) {
            console.error('Error fetching nearby meetups:', err);
            setError('Failed to fetch nearby meetups. Please try again later.');
        }
        finally {
            setIsLoading(false);
        }
    }, [userLocation]);
    useEffect(() => {
        fetchNearbyMeetups();
    }, [userLocation, fetchNearbyMeetups]);
    useEffect(() => {
        if (meetupCreated) {
            fetchNearbyMeetups();
        }
    }, [meetupCreated, fetchNearbyMeetups]);
    const handleTransportModeChange = useCallback((mode) => {
        directionsActions.setTransportMode(mode);
    }, [directionsActions]);
    const handleRouteSelect = useCallback((index) => {
        directionsActions.setSelectedRouteIndex(index);
    }, [directionsActions]);
    const handleGetDirections = useCallback((location) => {
        if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
            const start = directionsState.firstSelectedPoint;
            const destination = [location.lat, location.lon];
            directionsActions.showDirections(start, destination);
            return;
        }
        if (!userLocation) {
            setError("Can't get directions: Your location is unknown");
            return;
        }
        if (directionsState.isDirectionsActive) {
            const firstPoint = [location.lat, location.lon];
            directionsActions.prepareMultiPointRoute(firstPoint);
            return;
        }
        const destination = [location.lat, location.lon];
        directionsActions.showDirections(userLocation, destination);
    }, [userLocation, directionsActions, directionsState]);
    const handleMeetupDirections = useCallback(() => {
        if (!selectedMeetup || !selectedMeetup.position) {
            setError("Can't get directions: The meetup location is unknown");
            return;
        }
        let position;
        if (Array.isArray(selectedMeetup.position)) {
            position = selectedMeetup.position;
        }
        else if (typeof selectedMeetup.position === 'object' &&
            'lat' in selectedMeetup.position &&
            'lng' in selectedMeetup.position) {
            position = [selectedMeetup.position.lat, selectedMeetup.position.lng];
        }
        else {
            console.error('Invalid position format in meetup:', selectedMeetup.position);
            setError("Can't get directions: Invalid meetup location format");
            return;
        }
        console.log('Extracted position from meetup:', position);
        if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
            directionsActions.showDirections(directionsState.firstSelectedPoint, position);
            return;
        }
        if (directionsState.isDirectionsActive && directionsState.startPoint) {
            const isUserLocationStart = userLocation &&
                Math.abs(directionsState.startPoint[0] - userLocation[0]) < 0.0001 &&
                Math.abs(directionsState.startPoint[1] - userLocation[1]) < 0.0001;
            if (!isUserLocationStart) {
                console.log('Creating route from previous location to this meetup:', directionsState.startPoint, position);
                directionsActions.showDirections(directionsState.startPoint, position);
                return;
            }
        }
        if (!userLocation) {
            setError("Can't get directions: Your location is unknown");
            return;
        }
        if (directionsState.isDirectionsActive) {
            directionsActions.prepareMultiPointRoute(position);
            return;
        }
        directionsActions.showDirections(userLocation, position);
    }, [selectedMeetup, userLocation, directionsActions, directionsState]);
    const handleUserLocationFound = useCallback((location, accuracy) => {
        setUserLocation(location);
        setUserAccuracy(accuracy);
        setIsLocationLoading(false);
        setIsUsingFallbackLocation(false);
        setError(null);
        console.log('User location found', location);
    }, []);
    const handleUserLocationError = useCallback(() => {
        const fallback = { city: 'San Francisco', coords: [37.7749, -122.4194] };
        console.log(`Using fallback location: ${fallback.city}`);
        setUserLocation(fallback.coords);
        setUserAccuracy(1000);
        setIsLocationLoading(false);
        setIsUsingFallbackLocation(true);
        setError(`We couldn't determine your exact location, so we're showing you meetups in ${fallback.city} instead.`);
    }, []);
    useEffect(() => {
        if (isLocationLoading) {
            const timeoutId = setTimeout(() => {
                if (isLocationLoading) {
                    handleUserLocationError();
                }
            }, 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [isLocationLoading, handleUserLocationError]);
    const handleMapReady = useCallback((map) => {
        if (mapInitialized.current) {
            console.log('Map already initialized, skipping redundant initialization');
            return;
        }
        console.log('Map is ready now');
        mapRef.current = map;
        mapInitialized.current = true;
    }, []);
    const handleImageUploaded = useCallback((imagePath, signedViewUrl) => {
        fileRef.current = imagePath;
        setImagePreview(signedViewUrl);
    }, []);
    const handleMapClick = useCallback((e) => {
        if (geocodingRequestRef.current) {
            geocodingRequestRef.current.abort();
            geocodingRequestRef.current = null;
        }
        const position = [e.latlng.lat, e.latlng.lng];
        setSelectedMeetupId(null);
        setSelectedPinId(null);
        setSelectedMeetup(null);
        const newTempPin = {
            id: 'temp-pin',
            position: position,
            title: 'Selected Location',
            color: 'red',
            isTemporary: true,
            address: `Lat: ${position[0].toFixed(6)}, Lng: ${position[1].toFixed(6)}`,
        };
        setTempPin(newTempPin);
        setIsReverseGeocoding(true);
        if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
            console.log('Map clicked while awaiting second point. Creating route from:', directionsState.firstSelectedPoint, 'to:', position);
            directionsActions.showDirections(directionsState.firstSelectedPoint, position);
        }
        else if (directionsState.isDirectionsActive &&
            userLocation &&
            !directionsState.awaitingSecondPoint) {
            console.log('Map clicked with active directions. Updating route from user location:', userLocation, 'to:', position);
            directionsActions.showDirections(userLocation, position);
        }
        const encodedLat = encodeURIComponent(position[0].toString());
        const encodedLng = encodeURIComponent(position[1].toString());
        const abortController = new AbortController();
        geocodingRequestRef.current = abortController;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodedLat}&lon=${encodedLng}&zoom=18&addressdetails=1`, {
            signal: abortController.signal,
        })
            .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error: ${res.status}`);
            }
            return res.json();
        })
            .then(data => {
            if (data) {
                const locationName = transformAddressToLocationName(data);
                const fullAddress = data.display_name || locationName;
                setSearchLocation(fullAddress);
                setTempPin(prev => prev && prev.id === 'temp-pin'
                    ? {
                        ...prev,
                        title: locationName,
                        address: fullAddress,
                    }
                    : prev);
                const locationData = {
                    display_name: fullAddress,
                    lat: position[0],
                    lon: position[1],
                    address: data.address,
                    _source: 'map',
                };
                setClickedLocation(locationData);
                if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
                    directionsActions.showDirections(directionsState.firstSelectedPoint, position);
                }
            }
        })
            .catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Error fetching address:', err);
            }
        })
            .finally(() => {
            if (geocodingRequestRef.current === abortController) {
                setIsReverseGeocoding(false);
                geocodingRequestRef.current = null;
            }
        });
    }, [directionsState, directionsActions, userLocation, transformAddressToLocationName]);
    const handleCreateMeetupFromCard = useCallback(async (data) => {
        try {
            setIsLoading(true);
            setError(null);
            const position = [data.location.lat, data.location.lon];
            const meetupData = {
                title: data.title,
                description: data.description,
                location: {
                    lat: position[0],
                    lng: position[1],
                },
                address: data.location.display_name,
            };
            if (data.image_url) {
                meetupData.image = data.image_url;
            }
            else if (data.image) {
                try {
                    const timestamp = Date.now();
                    const extension = data.image.name.split('.').pop()?.toLowerCase() || 'file';
                    const path = `meetups/meetup_${timestamp}.${extension}`;
                    const wasabiStorage = await import('../utils/wasabi-storage');
                    const uploadUrlResult = await wasabiStorage.getUploadPresignedUrl(data.image.type, path);
                    if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
                        throw new Error(uploadUrlResult.error || 'Failed to generate upload URL');
                    }
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
                    if (uploadUrlResult.path) {
                        meetupData.image = uploadUrlResult.path;
                    }
                }
                catch (uploadError) {
                    console.error('Error during image upload:', uploadError);
                }
            }
            const result = await createNewMeetup(meetupData);
            if (result.success && result.meetup) {
                setMeetupCreated(true);
                setTitle('');
                setDescription('');
                setImagePreview(null);
                fileRef.current = null;
                setTempPin(null);
                setClickedLocation(null);
                fetchNearbyMeetups();
                setTimeout(() => {
                    setMeetupCreated(false);
                }, 3000);
            }
            else if (!result.success) {
                throw new Error(result.error);
            }
        }
        catch (err) {
            console.error('Error creating meetup:', err);
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An error occurred while creating the meetup');
            }
        }
        finally {
            setIsLoading(false);
        }
    }, [createNewMeetup, fetchNearbyMeetups]);
    const handleMeetupClick = useCallback((meetupId) => {
        const meetup = meetups.find(m => m.id === meetupId);
        if (!meetup)
            return;
        setTempPin(null);
        setSelectedMeetupId(meetupId);
        setSelectedPinId(null);
        setClickedLocation(null);
        setSelectedMeetup(meetup);
        let position;
        if (Array.isArray(meetup.position)) {
            position = meetup.position;
        }
        else if (typeof meetup.position === 'object' &&
            'lat' in meetup.position &&
            'lng' in meetup.position) {
            position = [meetup.position.lat, meetup.position.lng];
        }
        else {
            console.error('Invalid position format in meetup:', meetup.position);
            setError("Can't use meetup: Invalid location format");
            return;
        }
        if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
            console.log('Meetup clicked while awaiting second point. Creating route from:', directionsState.firstSelectedPoint, 'to meetup:', position);
            directionsActions.showDirections(directionsState.firstSelectedPoint, position);
            return;
        }
        if (directionsState.isDirectionsActive && selectedMeetup && selectedMeetup.position) {
            let prevPosition;
            if (Array.isArray(selectedMeetup.position)) {
                prevPosition = selectedMeetup.position;
            }
            else if (typeof selectedMeetup.position === 'object' &&
                'lat' in selectedMeetup.position &&
                'lng' in selectedMeetup.position) {
                prevPosition = [selectedMeetup.position.lat, selectedMeetup.position.lng];
            }
            else {
                console.error('Invalid position format in previous meetup:', selectedMeetup.position);
                setError("Can't get directions: Invalid meetup location format");
                return;
            }
            console.log('Creating route from previous meetup to current meetup:', prevPosition, position);
            directionsActions.showDirections(prevPosition, position);
            return;
        }
        if (directionsState.isDirectionsActive && userLocation) {
            if (directionsState.isDirectionsActive && !directionsState.awaitingSecondPoint) {
                console.log('Meetup clicked with active directions. Preparing for multi-point route with first point:', position);
                directionsActions.prepareMultiPointRoute(position);
            }
            else {
                directionsActions.showDirections(userLocation, position);
            }
        }
        if (mapRef.current && meetup.position) {
            if (position && position.length === 2) {
                const currentZoom = mapRef.current.getZoom();
                mapRef.current.flyTo(position, currentZoom, {
                    animate: true,
                    duration: 1.5,
                    easeLinearity: 0.15,
                });
            }
        }
    }, [meetups, userLocation, directionsState, directionsActions, setError, selectedMeetup]);
    const handleMapMarkerClick = useCallback((meetupId) => {
        const meetup = meetups.find(m => m.id === meetupId);
        if (!meetup)
            return;
        setTempPin(null);
        setSelectedMeetupId(meetupId);
        setSelectedPinId(null);
        setClickedLocation(null);
        setSelectedMeetup(meetup);
        let position;
        if (Array.isArray(meetup.position)) {
            position = meetup.position;
        }
        else if (typeof meetup.position === 'object' &&
            'lat' in meetup.position &&
            'lng' in meetup.position) {
            position = [meetup.position.lat, meetup.position.lng];
        }
        else {
            console.error('Invalid position format in meetup:', meetup.position);
            setError("Can't use meetup: Invalid location format");
            return;
        }
        if (directionsState.awaitingSecondPoint && directionsState.firstSelectedPoint) {
            console.log('Meetup marker clicked while awaiting second point. Creating route from:', directionsState.firstSelectedPoint, 'to meetup:', position);
            directionsActions.showDirections(directionsState.firstSelectedPoint, position);
            return;
        }
        if (directionsState.isDirectionsActive && selectedMeetup && selectedMeetup.position) {
            let prevPosition;
            if (Array.isArray(selectedMeetup.position)) {
                prevPosition = selectedMeetup.position;
            }
            else if (typeof selectedMeetup.position === 'object' &&
                'lat' in selectedMeetup.position &&
                'lng' in selectedMeetup.position) {
                prevPosition = [selectedMeetup.position.lat, selectedMeetup.position.lng];
            }
            else {
                console.error('Invalid position format in previous meetup:', selectedMeetup.position);
                setError("Can't get directions: Invalid meetup location format");
                return;
            }
            console.log('Creating route from previous meetup to current meetup:', prevPosition, position);
            directionsActions.showDirections(prevPosition, position);
            return;
        }
        if (directionsState.isDirectionsActive && userLocation) {
            if (directionsState.isDirectionsActive && !directionsState.awaitingSecondPoint) {
                console.log('Meetup marker clicked with active directions. Preparing for multi-point route with first point:', position);
                directionsActions.prepareMultiPointRoute(position);
            }
            else {
                directionsActions.showDirections(userLocation, position);
            }
        }
    }, [meetups, userLocation, directionsState, directionsActions, setError, selectedMeetup]);
    const handleCloseMultiModeCard = useCallback(() => {
        setClickedLocation(null);
        setTempPin(null);
    }, []);
    const handleCloseSelectedMeetup = useCallback(() => {
        setSelectedMeetup(null);
        setSelectedMeetupId(null);
    }, []);
    return (_jsxs("div", { className: "relative w-screen h-screen overflow-hidden bg-gray-100", children: [_jsx(GlobeIcon, { onClick: () => setIsMenuOpen(prev => !prev), className: "animate-fade-in" }), _jsxs("div", { className: "relative w-full h-screen", children: [_jsxs(MapContainer, { center: userLocation || DEFAULT_CENTER, zoom: DEFAULT_ZOOM, style: { height: '100%', width: '100%' }, zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.25, children: [_jsx(ZoomControl, { position: "bottomright" }), _jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(LocationDetector, { onLocationFound: handleUserLocationFound, onLocationError: handleUserLocationError }), _jsx(MapInitializer, { onMapReady: handleMapReady, onMapClick: handleMapClick }), userLocation && (_jsx(AnimatedUserLocationMarker, { position: userLocation, accuracy: userAccuracy, showPopup: false })), directionsState.isDirectionsActive &&
                                directionsState.startPoint &&
                                directionsState.endPoint && (_jsx(DirectionsControl, { start: directionsState.startPoint, end: directionsState.endPoint, isVisible: directionsState.isDirectionsActive, isLoading: directionsState.isLoading, error: directionsState.error, routeData: directionsState.routeData, transportMode: directionsState.transportMode, selectedRouteIndex: directionsState.selectedRouteIndex, showAlternatives: true, awaitingSecondPoint: directionsState.awaitingSecondPoint, onRouteFound: directionsActions.setRouteData, onClose: directionsActions.hideDirections, onTransportModeChange: handleTransportModeChange, onRouteSelect: handleRouteSelect, onCancelMultiPointRoute: directionsActions.cancelMultiPointRoute })), meetups.map(meetup => {
                                const imageUrl = meetup.signed_image_url || meetup.image_url;
                                return (_jsx(MemoizedMeetupMarker, { id: meetup.id, position: meetup.position, title: meetup.title || 'Meetup', description: meetup.description || '', address: meetup.address || '', distance: meetup.distance || 0, expiresAt: meetup.expiresAt || '', createdAt: meetup.createdAt || '', status: meetup.status || 'active', onClick: id => handleMapMarkerClick(id), selected: selectedMeetupId === meetup.id, showPopup: false, imageUrl: imageUrl }, `meetup-marker-${meetup.id}`));
                            }), tempPin && (_jsx(PinMarker, { id: tempPin.id, position: tempPin.position, title: tempPin.title || 'Pin', address: tempPin.address || '', color: tempPin.color || 'red', isTemporary: tempPin.isTemporary || false, icon: pinIcon, onClick: () => { }, selected: true, showPopup: true }, `pin-marker-${tempPin.id}`))] }), isLocationLoading && (_jsx(LocationLoadingIndicator, { isLoading: isLocationLoading, isFallback: isUsingFallbackLocation })), !isLocationLoading && userLocation && (_jsx("div", { className: "absolute bottom-4 right-4 z-40 w-96 transition-all duration-300", children: _jsx(NearbyMeetups, { meetups: meetups.map(m => ({
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
                            })), currentLocation: {
                                lat: userLocation[0],
                                lng: userLocation[1],
                            }, currentMeetupId: selectedMeetupId || undefined, className: "shadow-xl rounded-lg overflow-hidden", onMeetupSelect: id => handleMeetupClick(id) }) })), clickedLocation && (_jsx(CardWrapper, { position: "top", children: _jsx(UnifiedMeetupCard, { locationData: clickedLocation, mode: CardMode.LOCATION_DISPLAY, onClose: handleCloseMultiModeCard, onDirections: () => {
                                handleGetDirections(clickedLocation);
                            }, onCreateMeetup: async (formData) => {
                                await handleCreateMeetupFromCard(formData);
                            }, isLoading: isLoading, isDirectionsActive: directionsState.isDirectionsActive, awaitingSecondPoint: directionsState.awaitingSecondPoint }) })), selectedMeetup && (_jsx(CardWrapper, { position: "top", children: _jsx(UnifiedMeetupCard, { meetup: selectedMeetup, mode: CardMode.MEETUP_DISPLAY, onClose: handleCloseSelectedMeetup, onDirections: () => {
                                handleMeetupDirections();
                            }, isLoading: isLoading, isDirectionsActive: directionsState.isDirectionsActive, awaitingSecondPoint: directionsState.awaitingSecondPoint }) })), error && (_jsx("div", { className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg shadow-lg px-6 py-4 max-w-md flex items-start space-x-4", children: [_jsx("div", { className: "text-red-500 flex-shrink-0 mt-0.5", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: error }), isUsingFallbackLocation && (_jsx("p", { className: "mt-1 text-xs text-red-700", children: "We're showing you a general area instead of your exact location." }))] }), _jsx("button", { className: "text-red-500 hover:text-red-700", onClick: () => setError(null), "aria-label": "Dismiss", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }) })), isUsingFallbackLocation && !error && (_jsx("div", { className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up", children: _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg shadow-lg px-6 py-4 max-w-md flex items-start space-x-4", children: [_jsx("div", { className: "text-blue-500 flex-shrink-0 mt-0.5", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-blue-800", children: "Using approximate location" }), _jsx("p", { className: "mt-1 text-xs text-blue-700", children: "We couldn't determine your exact location, so we're showing you a general area instead." })] }), _jsx("button", { className: "text-blue-500 hover:text-blue-700", onClick: () => setIsUsingFallbackLocation(false), "aria-label": "Dismiss", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }) }))] }), _jsx(CacheMonitor, {})] }));
};
export default MeetNowApp;
//# sourceMappingURL=MeetNowApp.js.map