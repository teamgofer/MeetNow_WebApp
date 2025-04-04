import { useState, useCallback } from 'react';
const CACHE_DURATION = 30 * 60 * 1000;
const routeCache = new Map();
const ORS_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || '';
function createCacheKey(start, end, options = {}) {
    const { mode = 'foot-walking', alternatives = false } = options;
    return `${start[0]},${start[1]}_${end[0]},${end[1]}_${mode}_${alternatives}`;
}
export async function getDirections(start, end, transportMode = 'foot-walking') {
    console.log(`Getting directions from ${start} to ${end} using ${transportMode}`);
    try {
        const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY || ORS_API_KEY;
        if (!apiKey) {
            console.error('OpenRouteService API key is missing');
            return getFallbackRoute(start, end, transportMode);
        }
        if (!Array.isArray(start) ||
            !Array.isArray(end) ||
            start.length !== 2 ||
            end.length !== 2 ||
            typeof start[0] !== 'number' ||
            typeof start[1] !== 'number' ||
            typeof end[0] !== 'number' ||
            typeof end[1] !== 'number') {
            console.error('Invalid coordinates format:', { start, end });
            return getFallbackRoute(start, end, transportMode);
        }
        const coordinates = [
            start,
            end,
        ];
        console.log('Using consistent coordinates for all modes:', coordinates);
        const requestBody = {
            coordinates,
            format: 'geojson',
            instructions: true,
            preference: 'shortest',
        };
        console.log('Request body:', JSON.stringify(requestBody));
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/${transportMode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json, application/geo+json',
            },
            body: JSON.stringify(requestBody),
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', errorText);
            return getFallbackRoute(start, end, transportMode);
        }
        const data = await response.json();
        console.log('Response received:', JSON.stringify(data).substring(0, 100) + '...');
        return processRouteResponse(data, transportMode);
    }
    catch (error) {
        console.error('Error fetching directions:', error);
        return getFallbackRoute(start, end, transportMode);
    }
}
export async function getIsochrone(center, rangeType = 'time', rangeValue = 10, mode = 'foot-walking') {
    try {
        if (!center) {
            throw new Error('Center point is required');
        }
        if (!ORS_API_KEY) {
            console.warn('OpenRouteService API key not configured, isochrone unavailable');
            throw new Error('API key required for isochrones');
        }
        const range = rangeType === 'time' ? rangeValue * 60 : rangeValue;
        const response = await fetch('https://api.openrouteservice.org/v2/isochrones/' + mode, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ORS_API_KEY}`,
            },
            body: JSON.stringify({
                locations: [[center.lng, center.lat]],
                range: [range],
                range_type: rangeType,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouteService API error: ${errorData.error || response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error fetching isochrone:', error);
        throw error;
    }
}
function processRouteResponse(rawResponse, mode) {
    if (!rawResponse) {
        console.error('processRouteResponse - No response data provided');
        return { routes: [], metadata: { error: 'No response data' } };
    }
    if (rawResponse.features) {
        console.log('processRouteResponse - Processing GeoJSON response');
        console.log('processRouteResponse - Number of features:', rawResponse.features.length);
        const routes = rawResponse.features
            .filter((feature) => {
            return (feature &&
                feature.properties &&
                feature.properties.summary &&
                feature.geometry &&
                feature.geometry.coordinates &&
                Array.isArray(feature.geometry.coordinates));
        })
            .map((feature) => {
            const properties = feature.properties;
            console.log('processRouteResponse - Feature geometry type:', feature.geometry.type);
            console.log('processRouteResponse - Feature geometry coordinates length:', feature.geometry.coordinates?.length);
            const validCoordinates = feature.geometry.coordinates.filter((coord) => Array.isArray(coord) &&
                coord.length >= 2 &&
                typeof coord[0] === 'number' &&
                !isNaN(coord[0]) &&
                typeof coord[1] === 'number' &&
                !isNaN(coord[1]));
            return {
                distance: properties.summary.distance,
                duration: properties.summary.duration,
                geometry: validCoordinates,
                segments: (properties.segments || []).map((segment) => ({
                    distance: segment.distance,
                    duration: segment.duration,
                    steps: (segment.steps || []).map((step) => ({
                        distance: step.distance,
                        duration: step.duration,
                        instruction: step.instruction || 'Continue',
                        name: step.name || '',
                        type: step.type || 0,
                    })),
                })),
            };
        });
        return {
            routes,
            metadata: rawResponse.metadata || {},
        };
    }
    else if (rawResponse.routes) {
        console.log('processRouteResponse - Processing standard response with routes array');
        const routes = rawResponse.routes
            .filter((route) => route)
            .map((route) => {
            console.log('processRouteResponse - Route geometry type:', typeof route.geometry);
            let geometry;
            if (typeof route.geometry === 'string' && route.geometry.length > 0) {
                geometry = decodePolyline(route.geometry);
                console.log('processRouteResponse - Decoded polyline to', geometry.length, 'points');
            }
            else if (Array.isArray(route.geometry)) {
                geometry = route.geometry.filter((coord) => Array.isArray(coord) &&
                    coord.length >= 2 &&
                    typeof coord[0] === 'number' &&
                    !isNaN(coord[0]) &&
                    typeof coord[1] === 'number' &&
                    !isNaN(coord[1]));
            }
            else {
                geometry = [];
            }
            if (!geometry || geometry.length === 0) {
                console.warn('processRouteResponse - No valid geometry points found');
            }
            console.log('processRouteResponse - Processed geometry:', Array.isArray(geometry) ? `Array with ${geometry.length} points` : 'Not an array');
            return {
                distance: route.summary?.distance || 0,
                duration: route.summary?.duration || 0,
                geometry: geometry,
                segments: (route.segments || []).map((segment) => ({
                    distance: segment.distance || 0,
                    duration: segment.duration || 0,
                    steps: (segment.steps || []).map((step) => ({
                        distance: step.distance || 0,
                        duration: step.duration || 0,
                        instruction: step.instruction || 'Continue',
                        name: step.name || '',
                        type: step.type || 0,
                    })),
                })),
            };
        });
        return {
            routes,
            metadata: rawResponse.metadata || {},
        };
    }
    console.log('processRouteResponse - Response format not recognized, returning empty routes');
    console.log('processRouteResponse - Response keys:', Object.keys(rawResponse));
    return {
        routes: [],
        metadata: {
            error: 'Unrecognized response format',
            originalKeys: Object.keys(rawResponse),
        },
    };
}
function getFallbackRoute(start, end, mode) {
    console.log('Using fallback route generator - zigzag path from', start, 'to', end);
    const distance = calculateDistance(start, end);
    let speed;
    switch (mode) {
        case 'driving-car':
            speed = 13.9;
            break;
        case 'cycling-regular':
            speed = 4.2;
            break;
        case 'foot-walking':
        default:
            speed = 1.4;
            break;
    }
    const duration = distance / speed;
    const geometry = [];
    geometry.push(start);
    const numPoints = Math.min(20, Math.max(5, Math.floor(distance / 200)));
    for (let i = 1; i < numPoints; i++) {
        const ratio = i / numPoints;
        const lat = start[0] + (end[0] - start[0]) * ratio;
        const lng = start[1] + (end[1] - start[1]) * ratio;
        const maxOffset = 0.0015;
        const offsetMultiplier = Math.sin(ratio * Math.PI);
        const offsetLat = (Math.random() - 0.5) * maxOffset * offsetMultiplier;
        const offsetLng = (Math.random() - 0.5) * maxOffset * offsetMultiplier;
        const distanceMultiplier = Math.min(1, distance / 5000);
        geometry.push([
            lat + offsetLat * distanceMultiplier,
            lng + offsetLng * distanceMultiplier
        ]);
    }
    geometry.push(end);
    return {
        routes: [
            {
                distance: distance,
                duration: duration,
                geometry: geometry,
                segments: [
                    {
                        distance: distance,
                        duration: duration,
                        steps: [
                            {
                                distance: distance,
                                duration: duration,
                                instruction: `Head toward destination (fallback route - ${mode === 'foot-walking' ? 'walking' :
                                    mode === 'cycling-regular' ? 'cycling' : 'driving'})`,
                                name: 'Direct route (API unavailable)',
                                type: 1,
                            },
                        ],
                    },
                ],
            },
        ],
        metadata: {
            attribution: 'Fallback route - API unavailable',
            service: 'fallback_routing',
            timestamp: Date.now(),
            query: {
                coordinates: [start, end],
                profile: mode,
                format: 'json',
            },
            engine: {
                version: '1.0.0',
                build_date: new Date().toISOString(),
                graph_date: new Date().toISOString(),
            },
        },
    };
}
function calculateDistance(start, end) {
    const R = 6371e3;
    const φ1 = (start[1] * Math.PI) / 180;
    const φ2 = (end[1] * Math.PI) / 180;
    const Δφ = ((end[1] - start[1]) * Math.PI) / 180;
    const Δλ = ((end[0] - start[0]) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function getMockRouteResponse(start, end) {
    const distance = calculateDistance(start, end);
    const duration = (distance / 5000) * 3600;
    const numPoints = Math.max(5, Math.floor(distance / 200));
    const intermediatePoints = [[start[0], start[1]]];
    for (let i = 1; i < numPoints - 1; i++) {
        const ratio = i / (numPoints - 1);
        const jitterMultiplier = 0.01;
        const jitterX = jitterMultiplier * Math.sin((i * Math.PI) / 2);
        const jitterY = jitterMultiplier * Math.cos((i * Math.PI) / 2);
        intermediatePoints.push([
            start[0] + (end[0] - start[0]) * ratio + jitterX,
            start[1] + (end[1] - start[1]) * ratio + jitterY,
        ]);
    }
    intermediatePoints.push([end[0], end[1]]);
    console.log('Created mock route with', intermediatePoints.length, 'points');
    console.log('Mock route points:', intermediatePoints);
    return {
        routes: [
            {
                distance,
                duration,
                geometry: intermediatePoints,
                segments: [
                    {
                        distance,
                        duration,
                        steps: [
                            {
                                distance,
                                duration,
                                instruction: 'Head toward destination',
                                name: 'Mock route',
                                type: 1,
                            },
                        ],
                    },
                ],
            },
        ],
        metadata: {
            attribution: 'Mock route data (no API key)',
            service: 'directions',
            timestamp: Date.now(),
            query: {
                coordinates: [
                    [start[0], start[1]],
                    [end[0], end[1]],
                ],
                format: 'json',
                profile: 'foot-walking',
            },
        },
    };
}
export function decodePolyline(encodedPolyline) {
    let index = 0;
    const len = encodedPolyline.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encodedPolyline.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
            b = encodedPolyline.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;
        coordinates.push([lat * 1e-5, lng * 1e-5]);
    }
    return coordinates;
}
export function decodePolyline2(encodedPolyline) {
    console.log('decodePolyline - Starting decoding of polyline with length:', encodedPolyline?.length);
    if (!encodedPolyline || typeof encodedPolyline !== 'string') {
        console.error('decodePolyline - Invalid input:', encodedPolyline);
        return [];
    }
    try {
        let index = 0;
        const len = encodedPolyline.length;
        let lat = 0;
        let lng = 0;
        const coordinates = [];
        while (index < len) {
            let b;
            let shift = 0;
            let result = 0;
            do {
                b = encodedPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += deltaLat;
            shift = 0;
            result = 0;
            do {
                b = encodedPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += deltaLng;
            coordinates.push([lat * 1e-5, lng * 1e-5]);
        }
        console.log(`decodePolyline - Successfully decoded ${coordinates.length} points`);
        if (coordinates.length > 0) {
            console.log('decodePolyline - First point:', coordinates[0]);
            console.log('decodePolyline - Last point:', coordinates[coordinates.length - 1]);
        }
        return coordinates;
    }
    catch (error) {
        console.error('decodePolyline - Error decoding polyline:', error);
        return [];
    }
}
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)} sec`;
    }
    if (seconds < 3600) {
        return `${Math.round(seconds / 60)} min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
}
export function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}
export function clearRouteCache() {
    routeCache.clear();
}
export function decodeORSPolyline(encodedPolyline) {
    console.log('decodeORSPolyline - Starting with polyline length:', encodedPolyline?.length);
    if (!encodedPolyline || typeof encodedPolyline !== 'string') {
        console.error('decodeORSPolyline - Invalid input:', encodedPolyline);
        return [];
    }
    try {
        const coordinates = [];
        let index = 0;
        const len = encodedPolyline.length;
        let lat = 0;
        let lng = 0;
        while (index < len) {
            let b;
            let shift = 0;
            let result = 0;
            do {
                b = encodedPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += deltaLat;
            shift = 0;
            result = 0;
            do {
                b = encodedPolyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += deltaLng;
            coordinates.push([lat * 1e-5, lng * 1e-5]);
        }
        console.log(`decodeORSPolyline - Successfully decoded ${coordinates.length} points`);
        if (coordinates.length > 0) {
            console.log('decodeORSPolyline - First few points:', coordinates.slice(0, 3));
            console.log('decodeORSPolyline - Last few points:', coordinates.slice(-3));
        }
        return coordinates;
    }
    catch (error) {
        console.error('decodeORSPolyline - Error decoding:', error);
        return [];
    }
}
export function getDirectionsFromLatLng(start, end, transportMode = 'foot-walking') {
    console.log('getDirectionsFromLatLng called with:', { startLat: start.lat, startLng: start.lng }, { endLat: end.lat, endLng: end.lng });
    if (start === undefined ||
        end === undefined ||
        start.lat === undefined ||
        start.lng === undefined ||
        end.lat === undefined ||
        end.lng === undefined ||
        isNaN(start.lat) ||
        isNaN(start.lng) ||
        isNaN(end.lat) ||
        isNaN(end.lng)) {
        console.error('Invalid LatLng objects provided to getDirectionsFromLatLng');
        return Promise.resolve(getFallbackRoute([0, 0], [0, 0], transportMode));
    }
    return getDirections([start.lng, start.lat], [end.lng, end.lat], transportMode);
}
export function useRouting(options) {
    const [route, setRoute] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchRoute = useCallback(async (start, end, transportMode = 'foot-walking') => {
        setIsLoading(true);
        setError(null);
        try {
            const routeData = await getDirections(start, end, transportMode);
            setRoute(routeData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch route');
            console.error('Error fetching route:', err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    return {
        route,
        isLoading,
        error,
        fetchRoute,
    };
}
//# sourceMappingURL=routing-service.js.map