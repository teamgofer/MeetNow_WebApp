import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useComponentRegistry } from '../ui/ComponentRegistry';
import { ErrorNotification, Spinner, NearbyMeetups } from '../ui';
import { MapWrapper, FloatingWindowWrapper } from '../wrappers';
import CreateMeetup from '../CreateMeetup';
const MapContainer = ({ location: externalLocation, selectedLocation: externalSelectedLocation, meetups = [], onLocationSelect, onCreateMeetup, onMapReady, onClose, isMapReady: externalIsMapReady, className = '', children, }) => {
    const [mapCenter, setMapCenter] = useState([0, 0]);
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedLocation, setSelectedLocation] = useState(externalSelectedLocation || null);
    const [isMapReady, setIsMapReady] = useState(externalIsMapReady || false);
    const [error, setError] = useState(null);
    const [showCreateMeetupForm, setShowCreateMeetupForm] = useState(false);
    const { location: internalLocation, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation, } = useGeolocation({
        timeout: 15000,
        retryCount: 1,
        useCaching: true,
        maximumAge: 30000,
    });
    const location = externalLocation || internalLocation;
    const { online } = useOnlineStatus();
    const { registerFloatingWindow } = useComponentRegistry();
    useEffect(() => {
        if (location) {
            setMapCenter([location.latitude, location.longitude]);
            setMapZoom(13);
        }
    }, [location]);
    useEffect(() => {
        if (externalSelectedLocation !== undefined) {
            setSelectedLocation(externalSelectedLocation);
        }
    }, [externalSelectedLocation]);
    useEffect(() => {
        if (locationError) {
            setError(typeof locationError === 'string'
                ? locationError
                : locationError instanceof Error
                    ? locationError.message
                    : 'Unknown location error');
        }
    }, [locationError]);
    const handleMapClick = useCallback((e) => {
        if (!online) {
            setError('You are currently offline. Please check your internet connection.');
            return;
        }
        const { lat, lng } = e.latlng;
        const newLocation = {
            latitude: lat,
            longitude: lng,
            address: 'Selected location',
        };
        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);
    }, [online, onLocationSelect]);
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
    const handleCreateMeetupClick = useCallback(() => {
        setShowCreateMeetupForm(true);
    }, []);
    const handleCreateMeetupClose = useCallback((meetup) => {
        setShowCreateMeetupForm(false);
        if (meetup && onClose) {
            onClose();
        }
    }, [onClose]);
    const handleMeetupClick = useCallback((meetup) => {
        if (meetup.location) {
            const meetupLocation = {
                latitude: typeof meetup.location === 'object'
                    ? meetup.location.latitude || meetup.location.lat || 0
                    : 0,
                longitude: typeof meetup.location === 'object'
                    ? meetup.location.longitude || meetup.location.lng || 0
                    : 0,
                address: typeof meetup.location === 'object'
                    ? meetup.location.address || meetup.address || 'Meetup location'
                    : 'Meetup location',
            };
            setSelectedLocation(meetupLocation);
            onLocationSelect(meetupLocation);
        }
    }, [onLocationSelect]);
    if (!externalLocation && isLocationLoading) {
        return _jsx(Spinner, {});
    }
    if (!externalLocation && locationError) {
        return (_jsxs("div", { className: "map-error p-4 bg-red-50 rounded-lg border border-red-200", children: [_jsx("h3", { className: "text-lg font-semibold text-red-800", children: "Location Error" }), _jsx("p", { className: "mt-2 text-red-700", children: error || 'Unable to get your location' }), _jsx("button", { onClick: handleRefreshLocation, className: "mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700", children: "Refresh Location" })] }));
    }
    return (_jsxs("div", { className: `relative h-screen ${className}`, children: [_jsxs(MapWrapper, { center: mapCenter, zoom: mapZoom, onMapClick: handleMapClick, onMapMove: handleMapMove, onMapReady: handleMapReady, children: [children, location && (_jsx("div", { className: "user-location-marker" })), selectedLocation && (_jsx("div", { className: "selected-location-marker" })), meetups &&
                        meetups.map(meetup => (_jsx("div", { className: "meetup-marker" }, meetup.id)))] }), _jsx(FloatingWindowWrapper, { id: "nearby-meetups", position: "bottom-left", isVisible: isMapReady && !!location, className: "bg-white shadow-lg rounded-lg p-4 max-w-xs", children: location && (_jsx(NearbyMeetups, { meetups: meetups, currentLocation: location, onMeetupClick: handleMeetupClick })) }), _jsx(FloatingWindowWrapper, { id: "location-info", position: "top-right", isVisible: !!selectedLocation, className: "bg-white shadow-lg rounded-lg p-4", children: selectedLocation && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Selected Location" }), _jsxs("p", { children: ["Latitude: ", selectedLocation.latitude.toFixed(6)] }), _jsxs("p", { children: ["Longitude: ", selectedLocation.longitude.toFixed(6)] }), _jsxs("p", { children: ["Address: ", selectedLocation.address] }), onCreateMeetup && (_jsx("button", { onClick: handleCreateMeetupClick, className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Create Meetup Here" })), onClose && (_jsx("button", { onClick: onClose, className: "mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300", children: "Close" }))] })) }), showCreateMeetupForm && selectedLocation && (_jsx(FloatingWindowWrapper, { id: "create-meetup-form", position: "center", isVisible: true, className: "bg-white shadow-lg rounded-lg overflow-auto", style: { maxHeight: '80vh', width: '90%', maxWidth: '500px' }, children: _jsx(CreateMeetup, { onClose: handleCreateMeetupClose, initialLocation: {
                        lat: selectedLocation.latitude,
                        lng: selectedLocation.longitude,
                        display_name: selectedLocation.address,
                    } }) })), error && _jsx(ErrorNotification, { message: error, onClose: () => setError(null) })] }));
};
export default MapContainer;
//# sourceMappingURL=MapContainer.js.map