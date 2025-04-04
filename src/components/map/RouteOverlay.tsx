/**
 * RouteOverlay Component
 * Displays a route on the map between two points
 */

import { useEffect, useState } from 'react';
import { Polyline, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

import { Route, TransportMode, formatDistance, formatDuration } from '../../utils/routing-service';

interface RouteOverlayProps {
  route?: Route;
  transportMode?: TransportMode;
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
  showMarkers?: boolean;
  showTooltips?: boolean;
  fitRoute?: boolean;
  animated?: boolean;
}

// Default styles for different transportation modes
const transportStyles: Record<
  TransportMode,
  {
    color: string;
    weight: number;
    dashArray?: string;
    lineCap?: string;
    shadowColor?: string;
  }
> = {
  'foot-walking': {
    color: '#4F46E5', // Indigo
    weight: 4,
    dashArray: '1, 8',
    lineCap: 'round',
    shadowColor: '#818CF8', // Lighter indigo for glow
  },
  'cycling-regular': {
    color: '#059669', // Emerald
    weight: 4,
    dashArray: '8, 4',
    lineCap: 'round',
    shadowColor: '#34D399', // Lighter emerald for glow
  },
  'driving-car': {
    color: '#D97706', // Amber
    weight: 4,
    lineCap: 'round',
    shadowColor: '#FBBF24', // Lighter amber for glow
  },
};

/**
 * Component to display a route overlay on the Leaflet map
 */
const RouteOverlay: React.FC<RouteOverlayProps> = ({
  route,
  transportMode = 'foot-walking',
  color,
  weight,
  opacity = 0.85,
  dashArray,
  showMarkers = true,
  showTooltips = true,
  fitRoute = false,
  animated = true,
}) => {
  const [points, setPoints] = useState<L.LatLngExpression[]>([]);
  const map = useMap();

  // Apply the selected transportation mode's style, unless overridden
  const style = transportStyles[transportMode];
  const lineColor = color || style.color;
  const lineWeight = weight || style.weight;
  const lineDashArray = dashArray || style.dashArray || '';
  const shadowColor = style.shadowColor || '#ffffff';

  // Convert route geometry to a format Leaflet can use
  useEffect(() => {
    if (!route || !route.geometry) {
      console.log('RouteOverlay - No route or geometry provided, not rendering');
      setPoints([]);
      return;
    }

    console.log('=== RouteOverlay RENDER START ===');
    console.log('RouteOverlay - Route segments:', route.segments?.length);
    console.log('RouteOverlay - First segment steps:', route.segments?.[0]?.steps?.length || 0);

    // Check if this is likely a straight line fallback route
    const isFallbackRoute =
      route.segments?.[0]?.steps?.length === 1 &&
      route.segments?.[0]?.steps?.[0]?.name === 'Direct path';

    if (isFallbackRoute) {
      console.warn('RouteOverlay - DETECTED FALLBACK ROUTE - Will render as straight line');
    } else {
      console.log('RouteOverlay - Rendering actual route data with turn-by-turn directions');
    }

    console.log('RouteOverlay - Route received:', route);
    console.log(
      'RouteOverlay - Geometry type:',
      typeof route.geometry,
      Array.isArray(route.geometry)
    );

    let newPoints: L.LatLngExpression[] = [];

    // Capture route in local variable to avoid closure issues
    const currentRoute = route;

    // If geometry is already an array of coordinates (from GeoJSON format)
    if (Array.isArray(route.geometry)) {
      console.log('RouteOverlay - Processing array geometry:', route.geometry.slice(0, 3), '...');

      // Detect the format of coordinates - could be [lng, lat] or [lat, lng]
      let pointsArray: L.LatLngExpression[] = [];

      // If the first coordinate looks like longitude (likely in the range of -180 to 180)
      // Format is [lng, lat], which is GeoJSON standard
      const firstPoint = route.geometry[0];
      if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
        const isLngLatFormat =
          Math.abs(firstPoint[0]) > 90 || Math.abs(firstPoint[0]) > Math.abs(firstPoint[1]);

        if (isLngLatFormat) {
          console.log(
            'RouteOverlay - Detected [lng, lat] format, flipping to [lat, lng] for Leaflet'
          );
          pointsArray = route.geometry.map(point => [point[1], point[0]] as L.LatLngExpression);
        } else {
          console.log('RouteOverlay - Detected [lat, lng] format, using as is for Leaflet');
          pointsArray = route.geometry as L.LatLngExpression[];
        }
      } else {
        console.warn('RouteOverlay - Array geometry has unexpected format:', firstPoint);
        // Try a best-effort approach
        try {
          // Try to extract coordinates from nested objects or unexpected formats
          pointsArray = route.geometry.flatMap((item: any) => {
            if (Array.isArray(item) && item.length >= 2) {
              // Make our best guess at format
              if (Math.abs(item[0]) > 90 || Math.abs(item[0]) > Math.abs(item[1])) {
                return [[item[1], item[0]] as L.LatLngExpression];
              }
              return [item as L.LatLngExpression];
            }
            return [];
          });
        } catch (err) {
          console.error('RouteOverlay - Failed to process geometry array:', err);
        }
      }

      // Log sample of processed points
      console.log(
        'RouteOverlay - Processed points sample:',
        pointsArray.length > 0 ? pointsArray.slice(0, 3) : 'No points'
      );

      newPoints = pointsArray;
      setPoints(pointsArray);
    }
    // If geometry is an encoded polyline string, decode it
    else if (typeof route.geometry === 'string') {
      console.log(
        'RouteOverlay - Processing encoded polyline geometry, length:',
        route.geometry.length
      );

      // Use a standalone implementation for better control and to avoid module loading issues
      const decodedPoints = decodePolylineLocally(route.geometry);
      console.log('RouteOverlay - Locally decoded points:', decodedPoints.length);

      if (decodedPoints.length > 0) {
        // In Leaflet, coordinates are [lat, lng] which matches our decoder output
        newPoints = decodedPoints as L.LatLngExpression[];
        setPoints(decodedPoints as L.LatLngExpression[]);
      }
    }

    // Fit map bounds to the route only if explicitly requested
    if (fitRoute && newPoints.length > 0) {
      try {
        // Create a filtered array of valid points to prevent undefined values
        const validPoints = newPoints.filter(point => {
          if (!point) return false;

          // For arrays, check if both values are numbers
          if (Array.isArray(point)) {
            return (
              point.length >= 2 &&
              typeof point[0] === 'number' &&
              !isNaN(point[0]) &&
              typeof point[1] === 'number' &&
              !isNaN(point[1])
            );
          }

          // For LatLng objects
          if (typeof point === 'object') {
            const lat = (point as any).lat;
            const lng = (point as any).lng;
            return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
          }

          return false;
        });

        if (validPoints.length > 1) {
          const bounds = L.latLngBounds(validPoints as L.LatLngExpression[]);
          
          console.log('RouteOverlay - fitRoute is true, fitting map to route bounds');
          map.fitBounds(bounds, {
            padding: [50, 50],
            animate: true,
            maxZoom: 18,
          });
        } else {
          console.warn('RouteOverlay - Not enough valid points to fit bounds');
        }
      } catch (fitErr) {
        console.error('RouteOverlay - Error fitting bounds:', fitErr);
      }
    } else {
      console.log('RouteOverlay - fitRoute is false, maintaining current map view');
    }
  }, [route, fitRoute, map]);

  if (!route || points.length === 0) {
    return null;
  }

  // Extract start and end points
  const startPoint = points.length > 0 ? points[0] : null;
  const endPoint = points.length > 0 ? points[points.length - 1] : null;

  // Validate points before using them
  const isValidPoint = (point: any): boolean => {
    if (!point) return false;
    if (Array.isArray(point)) {
      return (
        point.length >= 2 &&
        typeof point[0] === 'number' &&
        !isNaN(point[0]) &&
        typeof point[1] === 'number' &&
        !isNaN(point[1])
      );
    }
    if (typeof point === 'object') {
      const lat = (point as any).lat;
      const lng = (point as any).lng;
      return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
    }
    return false;
  };

  console.log('RouteOverlay - Rendering with points:', points.length);
  console.log('RouteOverlay - Start point:', startPoint);
  console.log('RouteOverlay - End point:', endPoint);

  return (
    <>
      {/* Add subtle glow effect with a wider, semi-transparent line underneath */}
      <Polyline
        positions={points}
        pathOptions={{
          color: shadowColor,
          weight: lineWeight + 4,
          opacity: 0.3,
          lineCap: (style.lineCap as L.LineCapShape) || 'round',
          dashArray: lineDashArray || undefined,
        }}
      />

      {/* Main route line */}
      <Polyline
        positions={points}
        pathOptions={{
          color: lineColor,
          weight: lineWeight,
          opacity: opacity,
          lineCap: (style.lineCap as L.LineCapShape) || 'round',
          dashArray: lineDashArray || undefined,
        }}
      />

      {/* Animated dash overlay for effect if animation enabled */}
      {animated && (
        <Polyline
          positions={points}
          pathOptions={{
            color: 'white',
            weight: lineWeight - 2,
            opacity: 0.3,
            lineCap: 'round',
            dashArray: '5, 10',
            dashOffset: '0',
            className: 'animated-dash',
          }}
        />
      )}

      {/* Start marker */}
      {showMarkers && startPoint && isValidPoint(startPoint) && (
        <CircleMarker
          center={startPoint as L.LatLngExpression}
          radius={6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: lineColor,
            fillOpacity: 1,
          }}
        >
          {showTooltips && (
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="font-medium text-gray-800">Start</div>
              {route.segments && route.segments[0] && (
                <div className="text-sm text-gray-500">
                  {route.segments[0].steps &&
                    route.segments[0].steps[0] &&
                    route.segments[0].steps[0].name}
                </div>
              )}
            </Tooltip>
          )}
        </CircleMarker>
      )}

      {/* End marker */}
      {showMarkers && endPoint && isValidPoint(endPoint) && (
        <CircleMarker
          center={endPoint as L.LatLngExpression}
          radius={6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: lineColor,
            fillOpacity: 1,
          }}
        >
          {showTooltips && (
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="font-medium text-gray-800">Destination</div>
              {route.segments && route.segments[route.segments.length - 1] && (
                <div className="text-sm text-gray-500">
                  {formatDistance(route.distance)} · {formatDuration(route.duration)}
                </div>
              )}
            </Tooltip>
          )}
        </CircleMarker>
      )}
    </>
  );
};

// Helper function to decode polylines without dynamic imports
function decodePolylineLocally(encoded: string): L.LatLngExpression[] {
  if (!encoded || typeof encoded !== 'string') {
    console.error('Invalid polyline input', encoded);
    return [];
  }

  try {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates: L.LatLngExpression[] = [];

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

      // Store as [lat, lng] for Leaflet
      coordinates.push([lat * 1e-5, lng * 1e-5] as L.LatLngExpression);
    }

    console.log(
      'Decoded polyline - sample points:',
      coordinates.length > 0
        ? [
            coordinates[0],
            coordinates[Math.floor(coordinates.length / 2)],
            coordinates[coordinates.length - 1],
          ]
        : []
    );

    return coordinates;
  } catch (error) {
    console.error('Error decoding polyline:', error);
    return [];
  }
}

export default RouteOverlay;
