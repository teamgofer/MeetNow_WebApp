import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Polyline, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatDistance, formatDuration } from '../../utils/routing-service';
const transportStyles = {
    'foot-walking': {
        color: '#4F46E5',
        weight: 4,
        dashArray: '1, 8',
        lineCap: 'round',
        shadowColor: '#818CF8',
    },
    'cycling-regular': {
        color: '#059669',
        weight: 4,
        dashArray: '8, 4',
        lineCap: 'round',
        shadowColor: '#34D399',
    },
    'driving-car': {
        color: '#D97706',
        weight: 4,
        lineCap: 'round',
        shadowColor: '#FBBF24',
    },
};
const RouteOverlay = ({ route, transportMode = 'foot-walking', color, weight, opacity = 0.85, dashArray, showMarkers = true, showTooltips = true, fitRoute = false, animated = true, }) => {
    const [points, setPoints] = useState([]);
    const map = useMap();
    const style = transportStyles[transportMode];
    const lineColor = color || style.color;
    const lineWeight = weight || style.weight;
    const lineDashArray = dashArray || style.dashArray || '';
    const shadowColor = style.shadowColor || '#ffffff';
    useEffect(() => {
        if (!route || !route.geometry) {
            console.log('RouteOverlay - No route or geometry provided, not rendering');
            setPoints([]);
            return;
        }
        console.log('=== RouteOverlay RENDER START ===');
        console.log('RouteOverlay - Route segments:', route.segments?.length);
        console.log('RouteOverlay - First segment steps:', route.segments?.[0]?.steps?.length || 0);
        const isFallbackRoute = route.segments?.[0]?.steps?.length === 1 &&
            route.segments?.[0]?.steps?.[0]?.name === 'Direct path';
        if (isFallbackRoute) {
            console.warn('RouteOverlay - DETECTED FALLBACK ROUTE - Will render as straight line');
        }
        else {
            console.log('RouteOverlay - Rendering actual route data with turn-by-turn directions');
        }
        console.log('RouteOverlay - Route received:', route);
        console.log('RouteOverlay - Geometry type:', typeof route.geometry, Array.isArray(route.geometry));
        let newPoints = [];
        const currentRoute = route;
        if (Array.isArray(route.geometry)) {
            console.log('RouteOverlay - Processing array geometry:', route.geometry.slice(0, 3), '...');
            let pointsArray = [];
            const firstPoint = route.geometry[0];
            if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
                const isLngLatFormat = Math.abs(firstPoint[0]) > 90 || Math.abs(firstPoint[0]) > Math.abs(firstPoint[1]);
                if (isLngLatFormat) {
                    console.log('RouteOverlay - Detected [lng, lat] format, flipping to [lat, lng] for Leaflet');
                    pointsArray = route.geometry.map(point => [point[1], point[0]]);
                }
                else {
                    console.log('RouteOverlay - Detected [lat, lng] format, using as is for Leaflet');
                    pointsArray = route.geometry;
                }
            }
            else {
                console.warn('RouteOverlay - Array geometry has unexpected format:', firstPoint);
                try {
                    pointsArray = route.geometry.flatMap((item) => {
                        if (Array.isArray(item) && item.length >= 2) {
                            if (Math.abs(item[0]) > 90 || Math.abs(item[0]) > Math.abs(item[1])) {
                                return [[item[1], item[0]]];
                            }
                            return [item];
                        }
                        return [];
                    });
                }
                catch (err) {
                    console.error('RouteOverlay - Failed to process geometry array:', err);
                }
            }
            console.log('RouteOverlay - Processed points sample:', pointsArray.length > 0 ? pointsArray.slice(0, 3) : 'No points');
            newPoints = pointsArray;
            setPoints(pointsArray);
        }
        else if (typeof route.geometry === 'string') {
            console.log('RouteOverlay - Processing encoded polyline geometry, length:', route.geometry.length);
            const decodedPoints = decodePolylineLocally(route.geometry);
            console.log('RouteOverlay - Locally decoded points:', decodedPoints.length);
            if (decodedPoints.length > 0) {
                newPoints = decodedPoints;
                setPoints(decodedPoints);
            }
        }
        if (fitRoute && newPoints.length > 0) {
            try {
                const validPoints = newPoints.filter(point => {
                    if (!point)
                        return false;
                    if (Array.isArray(point)) {
                        return (point.length >= 2 &&
                            typeof point[0] === 'number' &&
                            !isNaN(point[0]) &&
                            typeof point[1] === 'number' &&
                            !isNaN(point[1]));
                    }
                    if (typeof point === 'object') {
                        const lat = point.lat;
                        const lng = point.lng;
                        return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
                    }
                    return false;
                });
                if (validPoints.length > 1) {
                    const bounds = L.latLngBounds(validPoints);
                    console.log('RouteOverlay - fitRoute is true, fitting map to route bounds');
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        animate: true,
                        maxZoom: 18,
                    });
                }
                else {
                    console.warn('RouteOverlay - Not enough valid points to fit bounds');
                }
            }
            catch (fitErr) {
                console.error('RouteOverlay - Error fitting bounds:', fitErr);
            }
        }
        else {
            console.log('RouteOverlay - fitRoute is false, maintaining current map view');
        }
    }, [route, fitRoute, map]);
    if (!route || points.length === 0) {
        return null;
    }
    const startPoint = points.length > 0 ? points[0] : null;
    const endPoint = points.length > 0 ? points[points.length - 1] : null;
    const isValidPoint = (point) => {
        if (!point)
            return false;
        if (Array.isArray(point)) {
            return (point.length >= 2 &&
                typeof point[0] === 'number' &&
                !isNaN(point[0]) &&
                typeof point[1] === 'number' &&
                !isNaN(point[1]));
        }
        if (typeof point === 'object') {
            const lat = point.lat;
            const lng = point.lng;
            return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
        }
        return false;
    };
    console.log('RouteOverlay - Rendering with points:', points.length);
    console.log('RouteOverlay - Start point:', startPoint);
    console.log('RouteOverlay - End point:', endPoint);
    return (_jsxs(_Fragment, { children: [_jsx(Polyline, { positions: points, pathOptions: {
                    color: shadowColor,
                    weight: lineWeight + 4,
                    opacity: 0.3,
                    lineCap: style.lineCap || 'round',
                    dashArray: lineDashArray || undefined,
                } }), _jsx(Polyline, { positions: points, pathOptions: {
                    color: lineColor,
                    weight: lineWeight,
                    opacity: opacity,
                    lineCap: style.lineCap || 'round',
                    dashArray: lineDashArray || undefined,
                } }), animated && (_jsx(Polyline, { positions: points, pathOptions: {
                    color: 'white',
                    weight: lineWeight - 2,
                    opacity: 0.3,
                    lineCap: 'round',
                    dashArray: '5, 10',
                    dashOffset: '0',
                    className: 'animated-dash',
                } })), showMarkers && startPoint && isValidPoint(startPoint) && (_jsx(CircleMarker, { center: startPoint, radius: 6, pathOptions: {
                    color: '#ffffff',
                    weight: 2,
                    fillColor: lineColor,
                    fillOpacity: 1,
                }, children: showTooltips && (_jsxs(Tooltip, { direction: "top", offset: [0, -10], opacity: 0.9, children: [_jsx("div", { className: "font-medium text-gray-800", children: "Start" }), route.segments && route.segments[0] && (_jsx("div", { className: "text-sm text-gray-500", children: route.segments[0].steps &&
                                route.segments[0].steps[0] &&
                                route.segments[0].steps[0].name }))] })) })), showMarkers && endPoint && isValidPoint(endPoint) && (_jsx(CircleMarker, { center: endPoint, radius: 6, pathOptions: {
                    color: '#ffffff',
                    weight: 2,
                    fillColor: lineColor,
                    fillOpacity: 1,
                }, children: showTooltips && (_jsxs(Tooltip, { direction: "top", offset: [0, -10], opacity: 0.9, children: [_jsx("div", { className: "font-medium text-gray-800", children: "Destination" }), route.segments && route.segments[route.segments.length - 1] && (_jsxs("div", { className: "text-sm text-gray-500", children: [formatDistance(route.distance), " \u00B7 ", formatDuration(route.duration)] }))] })) }))] }));
};
function decodePolylineLocally(encoded) {
    if (!encoded || typeof encoded !== 'string') {
        console.error('Invalid polyline input', encoded);
        return [];
    }
    try {
        let index = 0;
        const len = encoded.length;
        let lat = 0;
        let lng = 0;
        const coordinates = [];
        while (index < len) {
            let b;
            let shift = 0;
            let result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += deltaLat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += deltaLng;
            coordinates.push([lat * 1e-5, lng * 1e-5]);
        }
        console.log('Decoded polyline - sample points:', coordinates.length > 0
            ? [
                coordinates[0],
                coordinates[Math.floor(coordinates.length / 2)],
                coordinates[coordinates.length - 1],
            ]
            : []);
        return coordinates;
    }
    catch (error) {
        console.error('Error decoding polyline:', error);
        return [];
    }
}
export default RouteOverlay;
//# sourceMappingURL=RouteOverlay.js.map