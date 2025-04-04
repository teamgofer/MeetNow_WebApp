import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, lazy, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaUser, } from 'react-icons/fa';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/ui/loading';
import { isDevelopmentEnvironment } from './config';
import useLogger from './hooks/useLogger';
const AdminPage = lazy(() => import('./components/admin/AdminPage'));
const MapInitializer = ({ onMapReady }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            onMapReady(map);
        }
    }, [map, onMapReady]);
    return null;
};
const MeetNowApp = () => {
    const log = useLogger('MeetNowApp');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState(null);
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
    const [centerLocation, setCenterLocation] = useState(null);
    const locationBoxRef = useRef(null);
    const meetupsIntervalRef = useRef(null);
    const navigationController = useRef(null);
    const mapRef = useRef(null);
    const geolocationRequested = useRef(false);
    const locationSourceRef = useRef('initial');
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
    const updateAppLocation = useCallback((newLocation, source) => {
        if (!newLocation ||
            typeof newLocation.lat !== 'number' ||
            typeof newLocation.lng !== 'number') {
            console.warn('Invalid location provided to updateAppLocation:', newLocation);
            return false;
        }
        console.log(`Updating app location from source: ${source}`, newLocation);
        locationSourceRef.current = source;
        const normalizedLocation = {
            ...newLocation,
            lat: newLocation.lat,
            lng: newLocation.lng,
            display_name: newLocation.display_name || 'Selected Location',
        };
        setLocation(normalizedLocation);
        return true;
    }, []);
    const useMockLocation = () => {
        console.log('Using mock location for development environment');
        const mockLocation = {
            lat: 34.052235,
            lng: -118.243683,
            display_name: 'Los Angeles, CA (Dev Mode)',
        };
        updateAppLocation(mockLocation, 'mock_location');
        setSelectedLocation(mockLocation);
        setIsLocationLoading(false);
        if (isDevelopmentEnvironment) {
            setError('Using mock location for development. Real geolocation is often blocked in localhost/development environments.');
        }
    };
    useEffect(() => {
        if (isDevelopmentEnvironment) {
            useMockLocation();
        }
        else {
            useMockLocation();
        }
    }, []);
    const handleMapReady = useCallback((map) => {
        console.log('Map is ready');
        mapRef.current = map;
        setIsMapReady(true);
        if (navigationController.current) {
            navigationController.current.updateMapReference(map);
        }
    }, []);
    return (_jsx("div", { className: "app bg-gray-50 min-h-screen", children: _jsx(ErrorBoundary, { children: isLocationLoading ? (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx(Loading, {}), _jsx("p", { className: "mt-4 text-gray-600", children: "Getting your location..." })] }) })) : (_jsx(_Fragment, { children: location && (_jsxs("div", { className: "relative h-screen", children: [_jsx("div", { className: "absolute inset-0", children: _jsxs(MapContainer, { center: [location.lat, location.lng], zoom: currentZoom, style: { height: '100%', width: '100%' }, zoomControl: false, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), _jsx(ZoomControl, { position: "bottomleft" }), _jsx(MapInitializer, { onMapReady: handleMapReady }), location && _jsx(Marker, { position: [location.lat, location.lng], icon: userIcon }), selectedLocation && (_jsx(Marker, { position: [selectedLocation.lat, selectedLocation.lng], icon: pinIcon }))] }) }), _jsx("div", { className: "absolute top-4 right-4 z-10", children: _jsx("button", { className: "bg-white p-3 rounded-full shadow-lg", onClick: () => setShowProfile(!showProfile), children: _jsx(FaUser, { className: "text-blue-500" }) }) }), error && (_jsxs("div", { className: "absolute top-4 left-4 right-4 z-10 bg-red-50 p-4 rounded-lg shadow", children: [_jsx("p", { className: "text-red-700", children: error }), _jsx("button", { className: "mt-2 text-blue-500", onClick: () => setError(''), children: "Dismiss" })] }))] })) })) }) }));
};
export default MeetNowApp;
//# sourceMappingURL=MeetNowApp.js.map