import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLogger } from '../hooks/useLogger';
import { useMeetups } from '../hooks/useMeetups';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { MapContainer } from './map/MapContainer';
import { useComponentRegistry } from './ui/ComponentRegistry';
import { ErrorNotification } from './ui/ErrorNotification';
import { LoadingSpinner } from './ui/LoadingSpinner';
const MeetNowApp = () => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation, } = useGeolocation({
        timeout: 15000,
        retryCount: 2,
        useCaching: true,
        maximumAge: 60000,
    });
    const isOnline = useOnlineStatus();
    const { meetups, isLoading: isMeetupsLoading, error: meetupsError } = useMeetups(location);
    const { registerFloatingWindow, unregisterFloatingWindow } = useComponentRegistry();
    const logger = useLogger();
    useEffect(() => {
        if (locationError) {
            setError(locationError);
        }
    }, [locationError]);
    useEffect(() => {
        if (meetupsError) {
            setError(meetupsError);
        }
    }, [meetupsError]);
    const handleLocationSelect = useCallback((newLocation) => {
        setSelectedLocation(newLocation);
    }, []);
    const handleCreateMeetup = useCallback((meetup) => {
        logger.info('Creating meetup:', meetup);
    }, [logger]);
    const handleClose = useCallback(() => {
        setSelectedLocation(null);
    }, []);
    if (error) {
        return _jsx(ErrorNotification, { error: error, onRetry: () => setError(null) });
    }
    if (isLocationLoading || isMeetupsLoading) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsx("div", { className: "meetnow-app", children: _jsx(MapContainer, { location: location, selectedLocation: selectedLocation, meetups: meetups, onLocationSelect: handleLocationSelect, onCreateMeetup: handleCreateMeetup, onClose: handleClose, isMapReady: isMapReady, onMapReady: () => setIsMapReady(true) }) }));
};
export default MeetNowApp;
//# sourceMappingURL=MeetNowApp.js.map