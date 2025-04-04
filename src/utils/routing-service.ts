/**
 * OpenRouteService API Integration
 * Provides functionality for calculating routes between locations
 */

import { LatLng } from 'leaflet';
import { useState, useCallback } from 'react';

// Types for routing data
export type TransportMode = 'driving-car' | 'cycling-regular' | 'foot-walking';

export interface RouteOptions {
  mode?: TransportMode;
  alternatives?: boolean;
  avoid?: string[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  type: number;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface Route {
  distance: number; // meters
  duration: number; // seconds
  geometry: string | [number, number][]; // encoded polyline or array of coordinates
  segments: RouteSegment[];
}

export interface RouteResponse {
  routes: Route[];
  metadata: any;
}

// Cache interface
interface RequestCache<T> {
  timestamp: number;
  data: T;
}

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

// Cache for API responses
const routeCache: Map<string, RequestCache<RouteResponse>> = new Map();

// Default API key placeholder - should be replaced with your actual key
const ORS_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || '';

/**
 * Create a cache key for route requests
 */
function createCacheKey(
  start: [number, number],
  end: [number, number],
  options: RouteOptions = {}
): string {
  const { mode = 'foot-walking', alternatives = false } = options;
  return `${start[0]},${start[1]}_${end[0]},${end[1]}_${mode}_${alternatives}`;
}

/**
 * Get directions between two points using OpenRouteService API
 *
 * @param start Starting location coordinates
 * @param end Destination location coordinates
 * @param options Routing options (mode, alternatives, etc)
 * @returns Promise with route data
 */
export async function getDirections(
  start: [number, number],
  end: [number, number],
  transportMode: TransportMode = 'foot-walking'
): Promise<RouteResponse> {
  console.log(`Getting directions from ${start} to ${end} using ${transportMode}`);

  try {
    const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY || ORS_API_KEY;
    if (!apiKey) {
      console.error('OpenRouteService API key is missing');
      return getFallbackRoute(start, end, transportMode);
    }

    // Check if coordinates are valid arrays
    if (
      !Array.isArray(start) ||
      !Array.isArray(end) ||
      start.length !== 2 ||
      end.length !== 2 ||
      typeof start[0] !== 'number' ||
      typeof start[1] !== 'number' ||
      typeof end[0] !== 'number' ||
      typeof end[1] !== 'number'
    ) {
      console.error('Invalid coordinates format:', { start, end });
      return getFallbackRoute(start, end, transportMode);
    }

    // OpenRouteService expects coordinates in format [[lon, lat], [lon, lat]]
    // API input needs longitude first, then latitude (opposite of leaflet)
    const coordinates = [
      start, // Use same exact start coordinates for all transport modes
      end, // Use same exact end coordinates for all transport modes
    ];

    console.log('Using consistent coordinates for all modes:', coordinates);

    const requestBody = {
      coordinates,
      format: 'geojson', // Use geojson format
      instructions: true,
      preference: 'shortest', // Always optimize for shortest distance route
    };

    console.log('Request body:', JSON.stringify(requestBody));

    // Use the correct URL format - not /geojson at the end
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${transportMode}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json, application/geo+json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return getFallbackRoute(start, end, transportMode);
    }

    const data = await response.json();
    console.log('Response received:', JSON.stringify(data).substring(0, 100) + '...');

    // Process the response
    return processRouteResponse(data, transportMode);
  } catch (error) {
    console.error('Error fetching directions:', error);
    return getFallbackRoute(start, end, transportMode);
  }
}

/**
 * Get isochrone (area reachable within a time/distance) for a location
 * @param center Center point for the isochrone
 * @param rangeType Whether the range is in time (minutes) or distance (meters)
 * @param rangeValue Value for the range
 * @param mode Transportation mode
 * @returns Promise with isochrone polygon data
 */
export async function getIsochrone(
  center: LatLng,
  rangeType: 'time' | 'distance' = 'time',
  rangeValue: number = 10, // minutes or meters
  mode: TransportMode = 'foot-walking'
): Promise<any> {
  try {
    // Validate inputs
    if (!center) {
      throw new Error('Center point is required');
    }

    // Check if API key is configured
    if (!ORS_API_KEY) {
      console.warn('OpenRouteService API key not configured, isochrone unavailable');
      throw new Error('API key required for isochrones');
    }

    // Convert range value to appropriate units
    // For time, API expects seconds
    // For distance, API expects meters
    const range = rangeType === 'time' ? rangeValue * 60 : rangeValue;

    // Make API request
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
  } catch (error) {
    console.error('Error fetching isochrone:', error);
    throw error;
  }
}

/**
 * Process and transform the raw API response into our application format
 */
function processRouteResponse(rawResponse: any, mode: TransportMode): RouteResponse {
  // Validate input
  if (!rawResponse) {
    console.error('processRouteResponse - No response data provided');
    return { routes: [], metadata: { error: 'No response data' } };
  }

  // If we have a GeoJSON response, convert it to our expected format
  if (rawResponse.features) {
    console.log('processRouteResponse - Processing GeoJSON response');
    console.log('processRouteResponse - Number of features:', rawResponse.features.length);

    const routes = rawResponse.features
      .filter((feature: any) => {
        // Validate feature has required properties
        return (
          feature &&
          feature.properties &&
          feature.properties.summary &&
          feature.geometry &&
          feature.geometry.coordinates &&
          Array.isArray(feature.geometry.coordinates)
        );
      })
      .map((feature: any) => {
        const properties = feature.properties;
        console.log('processRouteResponse - Feature geometry type:', feature.geometry.type);
        console.log(
          'processRouteResponse - Feature geometry coordinates length:',
          feature.geometry.coordinates?.length
        );

        // Filter out any invalid coordinate points
        const validCoordinates = feature.geometry.coordinates.filter(
          (coord: any) =>
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === 'number' &&
            !isNaN(coord[0]) &&
            typeof coord[1] === 'number' &&
            !isNaN(coord[1])
        );

        return {
          distance: properties.summary.distance,
          duration: properties.summary.duration,
          geometry: validCoordinates,
          segments: (properties.segments || []).map((segment: any) => ({
            distance: segment.distance,
            duration: segment.duration,
            steps: (segment.steps || []).map((step: any) => ({
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
  // Handle response format where routes are directly in the response
  else if (rawResponse.routes) {
    console.log('processRouteResponse - Processing standard response with routes array');

    const routes = rawResponse.routes
      .filter((route: any) => route) // Filter out any null/undefined routes
      .map((route: any) => {
        console.log('processRouteResponse - Route geometry type:', typeof route.geometry);

        // If the geometry is a string (encoded polyline), decode it to coordinates
        let geometry;
        if (typeof route.geometry === 'string' && route.geometry.length > 0) {
          geometry = decodePolyline(route.geometry);
          console.log('processRouteResponse - Decoded polyline to', geometry.length, 'points');
        } else if (Array.isArray(route.geometry)) {
          // Filter out invalid coordinates
          geometry = route.geometry.filter(
            (coord: any) =>
              Array.isArray(coord) &&
              coord.length >= 2 &&
              typeof coord[0] === 'number' &&
              !isNaN(coord[0]) &&
              typeof coord[1] === 'number' &&
              !isNaN(coord[1])
          );
        } else {
          geometry = []; // Empty array if geometry is invalid
        }

        // Log warning if no valid geometry
        if (!geometry || geometry.length === 0) {
          console.warn('processRouteResponse - No valid geometry points found');
        }

        console.log(
          'processRouteResponse - Processed geometry:',
          Array.isArray(geometry) ? `Array with ${geometry.length} points` : 'Not an array'
        );

        return {
          distance: route.summary?.distance || 0,
          duration: route.summary?.duration || 0,
          geometry: geometry,
          segments: (route.segments || []).map((segment: any) => ({
            distance: segment.distance || 0,
            duration: segment.duration || 0,
            steps: (segment.steps || []).map((step: any) => ({
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

  // Otherwise return a safe fallback response
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

/**
 * Generate a fallback route when the API fails or is unavailable
 * Creates a zigzag path between start and end points
 */
function getFallbackRoute(
  start: [number, number],
  end: [number, number],
  mode: TransportMode
): RouteResponse {
  console.log('Using fallback route generator - zigzag path from', start, 'to', end);
  
  // Calculate distance between points using haversine formula
  const distance = calculateDistance(start, end);
  
  // Estimate duration based on mode and distance
  let speed: number; // meters per second
  switch (mode) {
    case 'driving-car':
      speed = 13.9; // ~50 km/h = 13.9 m/s
      break;
    case 'cycling-regular':
      speed = 4.2; // ~15 km/h = 4.2 m/s
      break;
    case 'foot-walking':
    default:
      speed = 1.4; // ~5 km/h = 1.4 m/s
      break;
  }
  
  const duration = distance / speed;
  
  // Generate a more natural zigzag route with intermediate points
  const geometry: [number, number][] = [];
  
  // Add start point
  geometry.push(start);
  
  // Calculate number of intermediate points based on distance
  const numPoints = Math.min(20, Math.max(5, Math.floor(distance / 200)));
  
  // Create more interesting zigzag pattern with varying offsets
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    
    // Add random zigzag offsets - smaller near start/end, larger in middle
    const maxOffset = 0.0015; // about 100-150 meters max deviation
    const offsetMultiplier = Math.sin(ratio * Math.PI); // peaks in the middle
    const offsetLat = (Math.random() - 0.5) * maxOffset * offsetMultiplier;
    const offsetLng = (Math.random() - 0.5) * maxOffset * offsetMultiplier;
    
    // More deviation for longer routes
    const distanceMultiplier = Math.min(1, distance / 5000);
    
    // Add the point with zigzag pattern
    geometry.push([
      lat + offsetLat * distanceMultiplier,
      lng + offsetLng * distanceMultiplier
    ]);
  }
  
  // Add end point
  geometry.push(end);
  
  // Create a mock route response
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
                instruction: `Head toward destination (fallback route - ${
                  mode === 'foot-walking' ? 'walking' : 
                  mode === 'cycling-regular' ? 'cycling' : 'driving'
                })`,
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

/**
 * Calculate straight-line distance between two points
 * Uses the Haversine formula
 */
function calculateDistance(start: [number, number], end: [number, number]): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (start[1] * Math.PI) / 180;
  const φ2 = (end[1] * Math.PI) / 180;
  const Δφ = ((end[1] - start[1]) * Math.PI) / 180;
  const Δλ = ((end[0] - start[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Generate mock route data for testing without API key
 */
function getMockRouteResponse(start: [number, number], end: [number, number]): RouteResponse {
  // Calculate straight-line distance
  const distance = calculateDistance(start, end);
  // Estimate duration (assuming average walking speed of 5 km/h)
  const duration = (distance / 5000) * 3600;

  // Generate some intermediate points for a more realistic path
  const numPoints = Math.max(5, Math.floor(distance / 200)); // More points (one every 200m)
  const intermediatePoints: [number, number][] = [[start[0], start[1]]];

  // Generate a more complex zigzag path
  for (let i = 1; i < numPoints - 1; i++) {
    const ratio = i / (numPoints - 1);
    // Add significant zigzag to make it obviously not a straight line
    const jitterMultiplier = 0.01; // Make jitter more significant
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

/**
 * Decodes a polyline string into an array of coordinates
 * Useful for converting the geometry string from the API to a format Leaflet can use
 */
export function decodePolyline(encodedPolyline: string): [number, number][] {
  // Polyline decoding logic - implementation based on Leaflet.encoded
  let index = 0;
  const len = encodedPolyline.length;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

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

/**
 * Improved decode polyline function with better error handling and logging
 */
export function decodePolyline2(encodedPolyline: string): [number, number][] {
  console.log(
    'decodePolyline - Starting decoding of polyline with length:',
    encodedPolyline?.length
  );

  // Validate input
  if (!encodedPolyline || typeof encodedPolyline !== 'string') {
    console.error('decodePolyline - Invalid input:', encodedPolyline);
    return [];
  }

  try {
    // Polyline decoding logic - implementation based on Leaflet.encoded
    let index = 0;
    const len = encodedPolyline.length;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];

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
  } catch (error) {
    console.error('decodePolyline - Error decoding polyline:', error);
    return [];
  }
}

/**
 * Format time duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
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

/**
 * Format distance in meters to human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Clear the route cache
 */
export function clearRouteCache(): void {
  routeCache.clear();
}

/**
 * Specialized decoder for OpenRouteService polyline format
 * They use an encoded format that may need special handling
 */
export function decodeORSPolyline(encodedPolyline: string): [number, number][] {
  console.log('decodeORSPolyline - Starting with polyline length:', encodedPolyline?.length);

  if (!encodedPolyline || typeof encodedPolyline !== 'string') {
    console.error('decodeORSPolyline - Invalid input:', encodedPolyline);
    return [];
  }

  try {
    // ORS polylines often have a specific prefix/format; capture coordinates in specific pattern
    const coordinates: [number, number][] = [];

    // Modified polyline decoder specifically tuned for ORS format
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

      // Store as [lat, lng] for consistency with Leaflet
      coordinates.push([lat * 1e-5, lng * 1e-5]);
    }

    console.log(`decodeORSPolyline - Successfully decoded ${coordinates.length} points`);

    // Log some sample points for debugging
    if (coordinates.length > 0) {
      console.log('decodeORSPolyline - First few points:', coordinates.slice(0, 3));
      console.log('decodeORSPolyline - Last few points:', coordinates.slice(-3));
    }

    return coordinates;
  } catch (error) {
    console.error('decodeORSPolyline - Error decoding:', error);
    return [];
  }
}

export function getDirectionsFromLatLng(
  start: LatLng,
  end: LatLng,
  transportMode: TransportMode = 'foot-walking'
): Promise<RouteResponse> {
  console.log(
    'getDirectionsFromLatLng called with:',
    { startLat: start.lat, startLng: start.lng },
    { endLat: end.lat, endLng: end.lng }
  );

  // Ensure both coordinates are valid
  if (
    start === undefined ||
    end === undefined ||
    start.lat === undefined ||
    start.lng === undefined ||
    end.lat === undefined ||
    end.lng === undefined ||
    isNaN(start.lat) ||
    isNaN(start.lng) ||
    isNaN(end.lat) ||
    isNaN(end.lng)
  ) {
    console.error('Invalid LatLng objects provided to getDirectionsFromLatLng');

    // Return a rejected promise or a fallback route
    return Promise.resolve(getFallbackRoute([0, 0], [0, 0], transportMode));
  }

  // Convert LatLng objects to [number, number] format with longitude first
  // OpenRouteService expects [longitude, latitude] format
  return getDirections([start.lng, start.lat], [end.lng, end.lat], transportMode);
}

// In hooks/useDirections.ts or wherever getDirections is called, update the call sites
// This is just an example of what might need to be updated elsewhere
export function useRouting(options?: RouteOptions) {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(
    async (
      start: [number, number],
      end: [number, number],
      transportMode: TransportMode = 'foot-walking'
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const routeData = await getDirections(start, end, transportMode);
        setRoute(routeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch route');
        console.error('Error fetching route:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    route,
    isLoading,
    error,
    fetchRoute,
  };
}
