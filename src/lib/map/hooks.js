import L from 'leaflet';
import { useState, useEffect, useCallback } from 'react';
import { MAP_CONSTANTS, calculateSearchRadius } from './config';
export const useMapZoom = (mapRef, onZoomChange, onSearchRadiusChange, initialZoom = MAP_CONSTANTS.DEFAULT_ZOOM) => {
    const [currentZoom, setCurrentZoom] = useState(initialZoom);
    useEffect(() => {
        if (!mapRef.current)
            return;
        const map = mapRef.current;
        const zoomTimeoutRef = { current: null };
        const handleZoomEnd = () => {
            if (zoomTimeoutRef.current) {
                clearTimeout(zoomTimeoutRef.current);
            }
            zoomTimeoutRef.current = setTimeout(() => {
                const newZoom = Math.min(Math.max(map.getZoom(), MAP_CONSTANTS.MIN_ZOOM), MAP_CONSTANTS.MAX_ZOOM);
                if (newZoom !== currentZoom) {
                    setCurrentZoom(newZoom);
                    const searchRadius = calculateSearchRadius(newZoom);
                    onSearchRadiusChange?.(searchRadius);
                    onZoomChange?.(newZoom);
                }
            }, 100);
        };
        map.on('zoomend', handleZoomEnd);
        return () => {
            if (zoomTimeoutRef.current) {
                clearTimeout(zoomTimeoutRef.current);
            }
            map.off('zoomend', handleZoomEnd);
        };
    }, [mapRef, onZoomChange, currentZoom, onSearchRadiusChange]);
    return [currentZoom, setCurrentZoom];
};
export const useMeetupBounds = (mapRef, location, activeMeetups) => {
    const updateBounds = useCallback(() => {
        if (!mapRef.current || !location || activeMeetups.length === 0)
            return;
        const map = mapRef.current;
        const bounds = L.latLngBounds([[location.lat, location.lng]]);
        const includedMeetups = activeMeetups.filter(meetup => {
            if (!meetup.location?.lat || !meetup.location?.lng)
                return false;
            const distance = map.distance([location.lat, location.lng], [meetup.location.lat, meetup.location.lng]);
            return distance <= MAP_CONSTANTS.MAX_MEETUP_DISTANCE;
        });
        if (includedMeetups.length === 0)
            return;
        includedMeetups.forEach(meetup => {
            if (meetup.location?.lat && meetup.location?.lng) {
                bounds.extend([meetup.location.lat, meetup.location.lng]);
            }
        });
        return bounds;
    }, [mapRef, location, activeMeetups]);
    return updateBounds;
};
export const useMapResize = (mapRef) => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    useEffect(() => {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
                mapRef.current?.invalidateSize();
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, [mapRef]);
    return windowSize;
};
//# sourceMappingURL=hooks.js.map