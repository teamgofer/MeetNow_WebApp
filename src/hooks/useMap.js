import { useState, useCallback, useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import { LatLng } from 'leaflet';
import Logger from '../utils/Logger';
import MapNavigationController from '../utils/MapNavigationController';
const useMap = () => {
    const leafletMap = useLeafletMap();
    const [navigationController, setNavigationController] = useState(null);
    const [bounds, setBounds] = useState(null);
    const [zoom, setZoom] = useState(leafletMap.getZoom() || 13);
    const [center, setCenter] = useState(leafletMap.getCenter()
        ? [leafletMap.getCenter().lat, leafletMap.getCenter().lng]
        : [37.7749, -122.4194]);
    useEffect(() => {
        if (leafletMap && !navigationController) {
            try {
                const controller = new MapNavigationController(leafletMap);
                setNavigationController(controller);
                Logger.info('MapHook', 'Map navigation controller initialized');
            }
            catch (error) {
                Logger.error('MapHook', 'Failed to initialize map navigation controller', error);
            }
        }
        return () => {
            if (navigationController) {
                navigationController.dispose();
                setNavigationController(null);
                Logger.debug('MapHook', 'Map navigation controller destroyed');
            }
        };
    }, [leafletMap, navigationController]);
    useEffect(() => {
        if (!leafletMap)
            return;
        const handleMoveEnd = () => {
            const newBounds = leafletMap.getBounds();
            const newZoom = leafletMap.getZoom();
            const newCenter = leafletMap.getCenter();
            setBounds(newBounds);
            setZoom(newZoom);
            setCenter([newCenter.lat, newCenter.lng]);
            Logger.debug('MapHook', 'Map view updated', {
                bounds: newBounds,
                zoom: newZoom,
                center: [newCenter.lat, newCenter.lng],
            });
        };
        leafletMap.on('moveend', handleMoveEnd);
        handleMoveEnd();
        return () => {
            leafletMap.off('moveend', handleMoveEnd);
        };
    }, [leafletMap]);
    const flyTo = useCallback((target, options = {}) => {
        if (!leafletMap || !navigationController)
            return;
        const defaultOptions = {
            method: 'flyTo',
            duration: 1000,
            zoom: 15,
            animate: true,
            forceCenter: false,
        };
        const mergedOptions = { ...defaultOptions };
        if (options.zoom !== undefined)
            mergedOptions.zoom = options.zoom;
        if (options.duration !== undefined)
            mergedOptions.duration = options.duration;
        Object.keys(options).forEach(key => {
            if (key !== 'zoom' && key !== 'duration') {
                mergedOptions[key] = options[key];
            }
        });
        let location;
        if (target instanceof LatLng) {
            location = { lat: target.lat, lng: target.lng };
        }
        else if (typeof target === 'object' && 'lat' in target && 'lng' in target) {
            location = target;
        }
        else {
            location = { lat: target[0], lng: target[1] };
        }
        if ('navigateTo' in navigationController &&
            typeof navigationController.navigateTo === 'function') {
            navigationController
                .navigateTo(location, mergedOptions)
                .catch((error) => Logger.error('MapHook', 'Error flying to location', error));
        }
        else {
            leafletMap.flyTo([location.lat, location.lng], mergedOptions.zoom || 15, {
                duration: mergedOptions.duration ? mergedOptions.duration / 1000 : 1,
            });
        }
        Logger.debug('MapHook', 'Map flying to location', { target, options: mergedOptions });
    }, [leafletMap, navigationController]);
    const fitBounds = useCallback((targetBounds, options = {}) => {
        if (!leafletMap)
            return;
        try {
            leafletMap.fitBounds(targetBounds, options);
            Logger.debug('MapHook', 'Map fitting bounds', { targetBounds, options });
        }
        catch (error) {
            Logger.error('MapHook', 'Error fitting bounds', error);
        }
    }, [leafletMap]);
    const resetView = useCallback(() => {
        if (!navigationController || !leafletMap)
            return;
        try {
            leafletMap.flyTo([37.7749, -122.4194], 13, {
                duration: 1,
            });
            Logger.debug('MapHook', 'Map view reset');
        }
        catch (error) {
            Logger.error('MapHook', 'Error resetting view', error);
        }
    }, [navigationController, leafletMap]);
    const centerOnUser = useCallback((coordinates) => {
        if (!navigationController || !leafletMap)
            return;
        try {
            if (coordinates) {
                leafletMap.flyTo([coordinates.lat, coordinates.lng], 15);
            }
            else if ('centerOnUser' in navigationController &&
                typeof navigationController.centerOnUser === 'function') {
                navigationController.centerOnUser({ animate: true });
            }
            Logger.debug('MapHook', 'Map centered on user', { coordinates });
        }
        catch (error) {
            Logger.error('MapHook', 'Error centering on user', error);
        }
    }, [navigationController, leafletMap]);
    return {
        map: leafletMap,
        bounds,
        zoom,
        center,
        flyTo,
        fitBounds,
        resetView,
        centerOnUser,
    };
};
export default useMap;
//# sourceMappingURL=useMap.js.map