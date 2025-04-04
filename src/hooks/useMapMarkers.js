import { useState, useCallback, useMemo } from 'react';
import Logger from '../utils/Logger';
const useMapMarkers = () => {
    const [markers, setMarkers] = useState(new Map());
    const add = useCallback((marker) => {
        setMarkers(prev => {
            const newMarkers = new Map(prev);
            newMarkers.set(marker.id, marker);
            Logger.debug('MapMarkers', `Added marker: ${marker.id}`);
            return newMarkers;
        });
    }, []);
    const remove = useCallback((markerId) => {
        setMarkers(prev => {
            const newMarkers = new Map(prev);
            const success = newMarkers.delete(markerId);
            if (success) {
                Logger.debug('MapMarkers', `Removed marker: ${markerId}`);
            }
            else {
                Logger.warn('MapMarkers', `Failed to remove marker: ${markerId} - not found`);
            }
            return newMarkers;
        });
    }, []);
    const update = useCallback((markerId, updates) => {
        setMarkers(prev => {
            const newMarkers = new Map(prev);
            const existingMarker = newMarkers.get(markerId);
            if (!existingMarker) {
                Logger.warn('MapMarkers', `Cannot update marker: ${markerId} - not found`);
                return prev;
            }
            newMarkers.set(markerId, { ...existingMarker, ...updates });
            Logger.debug('MapMarkers', `Updated marker: ${markerId}`);
            return newMarkers;
        });
    }, []);
    const updatePosition = useCallback((markerId, position) => {
        setMarkers(prev => {
            const newMarkers = new Map(prev);
            const existingMarker = newMarkers.get(markerId);
            if (!existingMarker) {
                Logger.warn('MapMarkers', `Cannot update position: ${markerId} - not found`);
                return prev;
            }
            newMarkers.set(markerId, { ...existingMarker, position });
            return newMarkers;
        });
    }, []);
    const updateOptions = useCallback((markerId, options) => {
        setMarkers(prev => {
            const newMarkers = new Map(prev);
            const existingMarker = newMarkers.get(markerId);
            if (!existingMarker) {
                Logger.warn('MapMarkers', `Cannot update options: ${markerId} - not found`);
                return prev;
            }
            newMarkers.set(markerId, {
                ...existingMarker,
                options: { ...existingMarker.options, ...options },
            });
            return newMarkers;
        });
    }, []);
    const clear = useCallback(() => {
        setMarkers(new Map());
        Logger.debug('MapMarkers', 'Cleared all markers');
    }, []);
    const getById = useCallback((markerId) => {
        return markers.get(markerId);
    }, [markers]);
    const getAll = useCallback(() => {
        return Array.from(markers.values());
    }, [markers]);
    const getVisible = useCallback(() => {
        return Array.from(markers.values()).filter(marker => marker.options?.visible !== false);
    }, [markers]);
    const markerCollection = useMemo(() => ({
        markers,
        add,
        remove,
        update,
        updatePosition,
        updateOptions,
        clear,
        getById,
        getAll,
        getVisible,
    }), [
        markers,
        add,
        remove,
        update,
        updatePosition,
        updateOptions,
        clear,
        getById,
        getAll,
        getVisible,
    ]);
    return markerCollection;
};
export default useMapMarkers;
//# sourceMappingURL=useMapMarkers.js.map