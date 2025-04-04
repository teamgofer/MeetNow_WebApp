import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback, forwardRef, } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, ZoomControl, } from 'react-leaflet';
import L from 'leaflet';
import useBreakpoint from '../hooks/useBreakpoint';
import { MAP_CONSTANTS } from '../lib/map/config';
import { initializeLeaflet, isValidLocation } from '../lib/map/utils';
import Logger from '../utils/Logger';
import { createMapIcons } from '../utils/map-icons';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { getSystemInfo, getAdaptiveConfig } from '../utils/system-detection';
import ErrorBoundary from './ErrorBoundary';
import LeafletGeolocation from './LeafletGeolocation';
import LocationMarker from './map/LocationMarker';
import MapMarkers from './map/MapMarkers';
import MapUpdater from './map/MapUpdater';
import styles from './MapComponent.module.css';
initializeLeaflet();
const createIcons = () => {
    const icons = createMapIcons();
    return {
        userIcon: icons.userIcon,
        meetupIcon: icons.meetupIcon,
    };
};
if (!L.Icon.Default.imagePath) {
    L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
}
const TILE_SERVERS_LIST = [
    {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous',
    },
    {
        url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous',
    },
    {
        url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous',
    },
];
const MapComponent = forwardRef(({ location, matchedMeetups = [], onLocationSelect, children, onZoomChange, initialZoom = MAP_CONSTANTS.DEFAULT_ZOOM, onMapClick, onSearchRadiusChange, selectedLocation = null, navigationController = null, }, ref) => {
    const mapRef = useRef(null);
    const renderStartTimeRef = useRef(Date.now());
    const locationUpdateIntervalRef = useRef(null);
    const userSetZoomRef = useRef(null);
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [hasInitialCentered, setHasInitialCentered] = useState(false);
    const [currentCenter, setCurrentCenter] = useState(() => isValidLocation(location) && location
        ? {
            lat: location.lat,
            lng: location.lng,
        }
        : null);
    const [currentZoom, setCurrentZoom] = useState(15);
    const [localSelectedLocation, setLocalSelectedLocation] = useState(selectedLocation);
    const [isWaitingForLocation, setIsWaitingForLocation] = useState(!location);
    const { isMobile } = useBreakpoint();
    const [icons] = useState(createIcons);
    const [systemInfo] = useState(getSystemInfo());
    const [adaptiveConfig] = useState(getAdaptiveConfig());
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [shouldUseAdaptiveLayout, setShouldUseAdaptiveLayout] = useState(false);
    const [shouldUseCompactLayout, setShouldUseCompactLayout] = useState(false);
    const [localMeetups, setLocalMeetups] = useState(matchedMeetups);
    const [currentTileServer, setCurrentTileServer] = useState(0);
    const [tileLoadErrors, setTileLoadErrors] = useState(0);
    const isInitialMount = useRef(true);
    const [flightPathKey, setFlightPathKey] = useState(Date.now());
    useEffect(() => {
        const duration = Date.now() - renderStartTimeRef.current;
        PerformanceMonitor.trackOperationTiming('map_component_init', duration, {
            hasLocation: !!location,
            hasMeetups: matchedMeetups.length > 0,
            hasNavigationController: !!navigationController,
            systemInfo: systemInfo,
        });
    }, []);
    useEffect(() => {
        if (mapRef.current && navigationController) {
            Logger.debug('MapComponent', 'Registering map with navigation controller');
            const registrationSuccess = navigationController.updateMapReference(mapRef);
            if (!registrationSuccess) {
                const retryTimeout = setTimeout(() => {
                    Logger.debug('MapComponent', 'Retrying map registration with navigation controller');
                    navigationController.updateMapReference(mapRef);
                }, 500);
                return () => clearTimeout(retryTimeout);
            }
        }
    }, [mapRef.current, navigationController]);
    useEffect(() => {
        if (navigationController && locationUpdateIntervalRef.current === null) {
            const handleLocationChange = (updatedLocation) => {
                Logger.debug('MapComponent', 'Location change from controller', updatedLocation);
                if (mapRef.current && updatedLocation) {
                    if (!userSetZoomRef.current) {
                        Logger.debug('MapComponent', 'Updating map view with new location');
                        const zoomToUse = mapRef.current.getZoom() || 17;
                        mapRef.current.setView([updatedLocation.lat, updatedLocation.lng], zoomToUse, {
                            animate: true,
                        });
                    }
                }
            };
            const originalLocationCallback = navigationController.onLocationChange;
            navigationController.onLocationChange = (updatedLocation) => {
                handleLocationChange(updatedLocation);
                if (typeof originalLocationCallback === 'function') {
                    originalLocationCallback(updatedLocation);
                }
            };
            return () => {
                if (navigationController) {
                    navigationController.onLocationChange = originalLocationCallback;
                }
                if (locationUpdateIntervalRef.current) {
                    clearInterval(locationUpdateIntervalRef.current);
                    locationUpdateIntervalRef.current = null;
                }
            };
        }
    }, [navigationController]);
    const handleLocationSelect = useCallback((newLocation, preserveBirdsEyeView = false) => {
        Logger.debug('MapComponent', 'Location selected', newLocation);
        if (!newLocation ?? !isValidLocation(newLocation)) {
            Logger.warn('MapComponent', 'Invalid location selected', newLocation);
            return;
        }
        if (onLocationSelect) {
            onLocationSelect(newLocation);
        }
        setLocalSelectedLocation(newLocation);
        if (navigationController) {
            navigationController.navigateTo(newLocation, {
                animate: true,
                method: 'flyTo',
            });
        }
    }, [onLocationSelect, navigationController]);
    const handleMapClick = useCallback((event) => {
        if (navigationController) {
            return;
        }
        if (onMapClick) {
            onMapClick(event);
        }
    }, [onMapClick, navigationController]);
    useEffect(() => {
        if (!location ?? (!isValidLocation(location) || !mapRef.current)) {
            return;
        }
        if (!hasInitialCentered) {
            Logger.debug('MapComponent', `Setting initial center to user location, lat: ${location.lat}, lng: ${location.lng}`);
            setHasInitialCentered(true);
            mapRef.current.flyTo([location.lat, location.lng], initialZoom ?? 15, {
                animate: true,
                duration: 1,
            });
        }
    }, [location, hasInitialCentered]);
    useEffect(() => {
        if (selectedLocation !== localSelectedLocation) {
            setLocalSelectedLocation(selectedLocation);
        }
    }, [selectedLocation]);
    useEffect(() => {
        if (!location ?? !isValidLocation(location)) {
            return;
        }
        if (location._source === 'map') {
            Logger.debug('MapComponent', `Preventing ALL map updates for map click: ${location.display_name ?? 'unknown location'}`);
            return;
        }
        setCurrentCenter({
            lat: location.lat,
            lng: location.lng,
        });
        if (isWaitingForLocation) {
            setIsWaitingForLocation(false);
        }
        const shouldCenterMap = (!hasInitialCentered && mapRef.current) ||
            location._source === 'dropdown' ||
            location._source === 'search';
        if (shouldCenterMap && mapRef.current) {
            Logger.debug('MapComponent', `Centering map on location (source: ${location._source ?? 'initial'}), lat: ${location.lat}, lng: ${location.lng}`);
            if (!hasInitialCentered) {
                setHasInitialCentered(true);
            }
            mapRef.current.flyTo([location.lat, location.lng], userSetZoomRef.current !== null ? userSetZoomRef.current : (initialZoom ?? 15), { animate: true, duration: 1 });
        }
        else {
            Logger.debug('MapComponent', `Skipping map centering for location update (source: ${location._source ?? 'unknown'})`);
        }
    }, [location, hasInitialCentered, currentZoom, navigationController]);
    const handleMapLoad = useCallback(() => {
        setIsMapLoading(false);
        const loadTime = Date.now() - renderStartTimeRef.current;
        PerformanceMonitor.trackOperationTiming('map_load', loadTime, {
            success: true,
            hasLocation: !!location,
            hasMeetups: matchedMeetups.length > 0,
        });
        Logger.info('MapComponent', `Map loaded successfully in ${loadTime}ms`);
    }, [location, matchedMeetups]);
    const handleZoomEnd = useCallback((newZoom) => {
        if (!mapRef.current)
            return;
        const zoom = newZoom ?? mapRef.current.getZoom();
        Logger.debug('MapComponent', `Zoom changed to ${zoom}`);
        userSetZoomRef.current = zoom;
        setCurrentZoom(zoom);
        if (onZoomChange) {
            onZoomChange(zoom);
        }
        if (navigationController) {
            navigationController.setZoom(zoom);
        }
        if (onSearchRadiusChange) {
            const radius = Math.max(1000, 20000 / Math.pow(1.2, zoom - 10));
            onSearchRadiusChange(radius);
        }
    }, [onZoomChange, onSearchRadiusChange, navigationController]);
    const MapEvents = () => {
        const map = useMapEvents({
            load: () => {
                handleMapLoad();
            },
            zoomend: () => {
                handleZoomEnd();
            },
            moveend: () => {
                const center = map.getCenter();
                setCurrentCenter({
                    lat: center.lat,
                    lng: center.lng,
                    _userInteraction: true,
                });
            },
            click: e => {
                handleMapClick(e);
            },
            locationfound: e => {
                Logger.debug('MapComponent', 'Browser location found', e.latlng);
            },
            locationerror: e => {
                Logger.warn('MapComponent', 'Browser location error', e.message);
            },
            error: (e) => {
                Logger.error('MapComponent', 'Map error', e);
                setMapError(e.message ?? 'An error occurred with the map');
            },
        });
        useEffect(() => {
            mapRef.current = map;
            if (ref) {
                if (typeof ref === 'function') {
                    ref(map);
                }
                else {
                    ref.current = map;
                }
            }
            return () => {
                if (ref && typeof ref === 'object') {
                    ref.current = null;
                }
            };
        }, [map]);
        return null;
    };
    useEffect(() => {
        const registerNavControl = window.__registerModeControl;
        if (registerNavControl && navigationController) {
            registerNavControl((navRequest) => {
                if (typeof navRequest === 'object') {
                    navigationController.navigateTo(navRequest.location, navRequest.options);
                }
                else if (typeof navRequest === 'string' || typeof navRequest === 'number') {
                    navigationController.setNavigationMode(navRequest);
                }
            });
        }
    }, [navigationController]);
    useEffect(() => {
        if (tileLoadErrors > 3) {
            setCurrentTileServer(prev => (prev + 1) % TILE_SERVERS_LIST.length);
            setTileLoadErrors(0);
        }
    }, [tileLoadErrors]);
    const tileServer = TILE_SERVERS_LIST[currentTileServer];
    const handleTileError = useCallback(() => {
        setTileLoadErrors(prev => prev + 1);
    }, []);
    return (_jsx(ErrorBoundary, { fallback: _jsx("div", { className: styles.mapError, children: "Map could not be loaded. Please try refreshing." }), children: _jsxs("div", { className: styles.mapContainer, children: [isMapLoading && (_jsxs("div", { className: styles.mapLoading, children: [_jsx("div", { className: styles.loadingSpinner }), _jsx("p", { children: "Loading map..." })] })), mapError && (_jsxs("div", { className: styles.mapError, children: [_jsxs("p", { children: ["Error: ", mapError] }), _jsx("button", { onClick: () => window.location.reload(), children: "Reload" })] })), _jsxs(MapContainer, { center: currentCenter ? [currentCenter.lat, currentCenter.lng] : [0, 0], zoom: currentZoom, zoomControl: false, className: styles.map, style: { height: '100%', width: '100%' }, attributionControl: true, maxBounds: [
                        [-90, -180],
                        [90, 180],
                    ], maxBoundsViscosity: 0.5, minZoom: 2, maxZoom: 20, zoomSnap: 0.5, wheelDebounceTime: 50, wheelPxPerZoomLevel: 100, wheelZoom: true, doubleClickZoom: true, bounceAtZoomLimits: true, worldCopyJump: true, children: [_jsx(MapEvents, {}), _jsx(ZoomControl, { position: "bottomright" }), _jsx(TileLayer, { attribution: tileServer.attribution, url: tileServer.url, crossOrigin: tileServer.crossOrigin, eventHandlers: {
                                tileerror: handleTileError,
                            }, maxZoom: 20, minZoom: 2, tileSize: 256, zoomOffset: 0, updateWhenIdle: true, updateWhenZooming: false, updateInterval: 150, zIndex: 1, bounds: [
                                [-90, -180],
                                [90, 180],
                            ], noWrap: false, keepBuffer: 2, maxNativeZoom: 20, minNativeZoom: 2, zoomSnap: 0.5, zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true, detectRetina: true, renderer: L.canvas(), className: "map-tiles" }), currentCenter && (_jsx(MapUpdater, { center: currentCenter, zoom: currentZoom, selectedLocation: localSelectedLocation, onUpdate: update => {
                            } })), !isMapLoading && (_jsxs(_Fragment, { children: [location && (_jsx(LocationMarker, { onLocationSelect: handleLocationSelect, position: {
                                        lat: location.lat,
                                        lng: location.lng,
                                    }, icon: icons.userIcon })), _jsx(MapMarkers, { currentCenter: currentCenter ?? undefined, activeMeetups: localMeetups, icons: icons, getPopupConfig: () => ({}), onMarkerClick: handleLocationSelect }), children] })), _jsx(LeafletGeolocation, {})] })] }) }));
});
export default MapComponent;
//# sourceMappingURL=MapComponent.js.map