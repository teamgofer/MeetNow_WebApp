import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getDirectionsFromLatLng, formatDistance, formatDuration, } from '../../utils/routing-service';
import RouteOverlay from './RouteOverlay';
const DirectionsControl = ({ start, end, onRouteFound, onClose, isVisible = true, showAlternatives = false, isLoading: externalLoading, error: externalError, transportMode: externalMode, onTransportModeChange, routeData: externalRouteData, selectedRouteIndex = 0, onRouteSelect, awaitingSecondPoint = false, onCancelMultiPointRoute, }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMode, setSelectedMode] = useState(externalMode || 'foot-walking');
    const [routeData, setRouteData] = useState(null);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const map = useMap();
    const isControlled = externalMode !== undefined;
    const effectiveRouteData = externalRouteData || routeData;
    const effectiveLoading = externalLoading !== undefined ? externalLoading : loading;
    const effectiveError = externalError !== undefined ? externalError : error;
    const effectiveRouteIndex = onRouteSelect ? selectedRouteIndex : activeRouteIndex;
    const handleModeChange = (mode) => {
        console.log(`Changing transport mode to ${mode} - preserving current start/end points`);
        if (onTransportModeChange) {
            onTransportModeChange(mode);
        }
        else {
            setSelectedMode(mode);
            if (start && end) {
                console.log('Fetching route with same start/end points but new mode:', {
                    start,
                    end,
                    mode,
                });
                fetchRoute(mode);
            }
        }
    };
    const handleRouteSelect = (index) => {
        if (onRouteSelect) {
            onRouteSelect(index);
        }
        else {
            setActiveRouteIndex(index);
        }
    };
    const fetchRoute = async (mode = selectedMode) => {
        if (!start || !end)
            return;
        if (!isControlled) {
            try {
                setLoading(true);
                setError(null);
                console.log('DirectionsControl - Start point:', start);
                console.log('DirectionsControl - End point:', end);
                if (!Array.isArray(start) ||
                    !Array.isArray(end) ||
                    start.length !== 2 ||
                    end.length !== 2) {
                    setError('Invalid coordinates format');
                    setLoading(false);
                    return;
                }
                const startPoint = L.latLng(start[0], start[1]);
                const endPoint = L.latLng(end[0], end[1]);
                console.log('DirectionsControl - Fetching route:', {
                    start: { lat: startPoint.lat, lng: startPoint.lng },
                    end: { lat: endPoint.lat, lng: endPoint.lng },
                    mode,
                    alternatives: showAlternatives,
                });
                const result = await getDirectionsFromLatLng(startPoint, endPoint, mode);
                console.log('DirectionsControl - Route result:', result);
                console.log('DirectionsControl - Route geometry type:', typeof result.routes[0]?.geometry);
                console.log('DirectionsControl - Has points:', Array.isArray(result.routes[0]?.geometry)
                    ? result.routes[0]?.geometry.length
                    : 'Encoded string');
                setRouteData(result);
                if (onRouteFound) {
                    onRouteFound(result);
                }
            }
            catch (err) {
                console.error('Error fetching directions:', err);
                setError(err instanceof Error ? err.message : 'Failed to get directions');
            }
            finally {
                setLoading(false);
            }
        }
    };
    useEffect(() => {
        if (!isControlled) {
            setRouteData(null);
            setError(null);
        }
        if (!isControlled || externalLoading === undefined) {
            fetchRoute();
        }
    }, [start, end, isVisible, showAlternatives]);
    if (!isVisible || !start || !end) {
        return null;
    }
    const routes = effectiveRouteData?.routes || [];
    const activeRoute = routes.length > effectiveRouteIndex ? routes[effectiveRouteIndex] : undefined;
    const validRoutes = routes.filter(route => {
        if (!route?.geometry)
            return false;
        if (Array.isArray(route.geometry)) {
            return (route.geometry.length > 0 &&
                route.geometry.some(point => Array.isArray(point) &&
                    point.length >= 2 &&
                    typeof point[0] === 'number' &&
                    !isNaN(point[0]) &&
                    typeof point[1] === 'number' &&
                    !isNaN(point[1])));
        }
        if (typeof route.geometry === 'string') {
            return route.geometry.length > 0;
        }
        return false;
    });
    const renderCancelButton = () => {
        if (!awaitingSecondPoint || !onCancelMultiPointRoute)
            return null;
        return (_jsx("div", { className: "absolute top-4 right-4 z-50", children: _jsxs("button", { className: "px-3 py-2 text-xs bg-white/80 backdrop-blur-md rounded-lg border border-white/40 shadow-[3px_3px_8px_rgba(0,0,0,0.1),-3px_-3px_8px_rgba(255,255,255,0.7)] text-gray-700 hover:bg-white/90 transition-all duration-200 flex items-center", onClick: e => {
                    e.stopPropagation();
                    onCancelMultiPointRoute();
                }, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3 mr-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }), "Cancel Selection"] }) }));
    };
    return (_jsxs("div", { className: `directions-control ${isVisible ? 'visible' : 'hidden'}`, children: [validRoutes.map((route, index) => {
                console.log(`DirectionsControl - Rendering route overlay ${index}:`, {
                    hasGeometry: !!route.geometry,
                    geometryType: typeof route.geometry,
                    isArray: Array.isArray(route.geometry),
                    pointCount: Array.isArray(route.geometry) ? route.geometry.length : 'N/A',
                });
                return (_jsx(RouteOverlay, { route: route, transportMode: externalMode || selectedMode, showMarkers: index === effectiveRouteIndex, fitRoute: false, animated: index === effectiveRouteIndex, opacity: index === effectiveRouteIndex ? 0.8 : 0.4, weight: index === effectiveRouteIndex ? 5 : 3 }, `route-${index}`));
            }), _jsxs("div", { className: "absolute bottom-20 left-4 bg-white/80 backdrop-blur-md rounded-xl shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.7)] p-3 max-w-[250px] z-[1000] border border-white/40", onClick: e => {
                    e.stopPropagation();
                }, children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "font-medium text-sm text-gray-700", children: "Directions" }), _jsx("button", { onClick: e => {
                                    e.stopPropagation();
                                    onClose && onClose();
                                }, className: "text-gray-500 hover:text-gray-700 h-6 w-6 flex items-center justify-center rounded-full bg-white/40 shadow-inner", "aria-label": "Close directions", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }), _jsxs("div", { className: "transport-btn-group mb-3 flex space-x-1", children: [_jsx("button", { className: `flex-1 py-1 px-2 text-xs rounded-lg transition-all duration-200 ${(externalMode || selectedMode) === 'foot-walking'
                                    ? 'bg-indigo-100 text-indigo-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                                    : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'}`, onClick: e => {
                                    e.stopPropagation();
                                    handleModeChange('foot-walking');
                                }, children: _jsxs("span", { className: "flex items-center justify-center", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3 mr-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" }) }), "Walk"] }) }), _jsx("button", { className: `flex-1 py-1 px-2 text-xs rounded-lg transition-all duration-200 ${(externalMode || selectedMode) === 'cycling-regular'
                                    ? 'bg-emerald-100 text-emerald-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                                    : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'}`, onClick: e => {
                                    e.stopPropagation();
                                    handleModeChange('cycling-regular');
                                }, children: _jsxs("span", { className: "flex items-center justify-center", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3 mr-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" }) }), "Bike"] }) })] }), effectiveLoading && (_jsxs("div", { className: "flex items-center justify-center text-xs text-gray-600 my-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4 mr-2 text-blue-500", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Getting directions..."] })), !effectiveLoading && effectiveError && (_jsx("div", { className: "bg-red-50 p-2 rounded-lg text-xs text-red-700 mb-2", children: _jsxs("p", { className: "font-medium", children: ["Error: ", effectiveError] }) })), !effectiveLoading && !effectiveError && activeRoute && (_jsxs("div", { className: "route-info border-t border-gray-100 pt-2", children: [_jsxs("div", { className: "flex justify-between items-center text-xs mb-1", children: [_jsx("span", { className: "font-medium text-gray-700", children: "Distance:" }), _jsx("span", { className: "text-gray-600", children: formatDistance(activeRoute.distance) })] }), _jsxs("div", { className: "flex justify-between items-center text-xs mb-2", children: [_jsx("span", { className: "font-medium text-gray-700", children: "Time:" }), _jsx("span", { className: "text-gray-600", children: formatDuration(activeRoute.duration) })] }), validRoutes.length > 1 && (_jsxs("div", { className: "alternative-routes mb-1", children: [_jsx("div", { className: "text-xs text-gray-700 font-medium mb-1", children: "Routes:" }), _jsx("div", { className: "flex space-x-2", children: validRoutes.map((route, index) => (_jsx("button", { className: `flex-1 text-xs py-1 px-2 rounded-lg transition-all duration-200 ${index === effectiveRouteIndex
                                                ? 'bg-blue-100 text-blue-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                                                : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'}`, onClick: e => {
                                                e.stopPropagation();
                                                handleRouteSelect(index);
                                            }, children: index === 0 ? 'Best' : `Alt ${index}` }, `route-btn-${index}`))) })] }))] })), !effectiveLoading && !effectiveError && !activeRoute && (_jsx("div", { className: "text-xs text-gray-600 text-center my-2", children: "No route found. Please try another destination." }))] }), renderCancelButton()] }));
};
export default DirectionsControl;
//# sourceMappingURL=DirectionsControl.js.map