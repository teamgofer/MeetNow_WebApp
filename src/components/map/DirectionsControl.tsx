/**
 * DirectionsControl Component
 * A UI control for getting and displaying directions between two points
 */

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';

import {
  getDirectionsFromLatLng,
  TransportMode,
  formatDistance,
  formatDuration,
  type RouteResponse,
  type Route,
} from '../../utils/routing-service';

import RouteOverlay from './RouteOverlay';

interface DirectionsControlProps {
  start?: LatLngTuple;
  end?: LatLngTuple;
  onRouteFound?: (route: RouteResponse) => void;
  onClose?: () => void;
  isVisible?: boolean;
  showAlternatives?: boolean;
  isLoading?: boolean;
  error?: string | null;
  transportMode?: TransportMode;
  onTransportModeChange?: (mode: TransportMode) => void;
  routeData?: RouteResponse | null;
  selectedRouteIndex?: number;
  onRouteSelect?: (index: number) => void;
  awaitingSecondPoint?: boolean;
  onCancelMultiPointRoute?: () => void;
}

const DirectionsControl: React.FC<DirectionsControlProps> = ({
  start,
  end,
  onRouteFound,
  onClose,
  isVisible = true,
  showAlternatives = false,
  isLoading: externalLoading,
  error: externalError,
  transportMode: externalMode,
  onTransportModeChange,
  routeData: externalRouteData,
  selectedRouteIndex = 0,
  onRouteSelect,
  awaitingSecondPoint = false,
  onCancelMultiPointRoute,
}) => {
  // Internal state if not controlled externally
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportMode>(externalMode || 'foot-walking');
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const map = useMap();

  // Determine if the component is controlled or uncontrolled
  const isControlled = externalMode !== undefined;
  const effectiveRouteData = externalRouteData || routeData;
  const effectiveLoading = externalLoading !== undefined ? externalLoading : loading;
  const effectiveError = externalError !== undefined ? externalError : error;
  const effectiveRouteIndex = onRouteSelect ? selectedRouteIndex : activeRouteIndex;

  // Handle transport mode change
  const handleModeChange = (mode: TransportMode) => {
    console.log(`Changing transport mode to ${mode} - preserving current start/end points`);

    if (onTransportModeChange) {
      onTransportModeChange(mode);
    } else {
      setSelectedMode(mode);
      // When calling fetchRoute, ensure we're using the same start/end points
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

  // Handle route selection
  const handleRouteSelect = (index: number) => {
    if (onRouteSelect) {
      onRouteSelect(index);
    } else {
      setActiveRouteIndex(index);
    }
  };

  // Fetch route data
  const fetchRoute = async (mode = selectedMode) => {
    // Return if no valid start/end points
    if (!start || !end) return;

    if (!isControlled) {
      try {
        setLoading(true);
        setError(null);

        // Convert from Leaflet LatLngTuple to LatLng object
        // Make sure we create proper Leaflet LatLng objects with proper lat/lng values
        console.log('DirectionsControl - Start point:', start);
        console.log('DirectionsControl - End point:', end);

        // Check if start and end are valid arrays with two numbers
        if (
          !Array.isArray(start) ||
          !Array.isArray(end) ||
          start.length !== 2 ||
          end.length !== 2
        ) {
          setError('Invalid coordinates format');
          setLoading(false);
          return;
        }

        // Create proper Leaflet LatLng objects
        const startPoint = L.latLng(start[0], start[1]);
        const endPoint = L.latLng(end[0], end[1]);

        console.log('DirectionsControl - Fetching route:', {
          start: { lat: startPoint.lat, lng: startPoint.lng },
          end: { lat: endPoint.lat, lng: endPoint.lng },
          mode,
          alternatives: showAlternatives,
        });

        // Get route based on selected mode
        const result = await getDirectionsFromLatLng(startPoint, endPoint, mode);

        console.log('DirectionsControl - Route result:', result);
        console.log('DirectionsControl - Route geometry type:', typeof result.routes[0]?.geometry);
        console.log(
          'DirectionsControl - Has points:',
          Array.isArray(result.routes[0]?.geometry)
            ? result.routes[0]?.geometry.length
            : 'Encoded string'
        );

        setRouteData(result);

        // Call the onRouteFound callback if provided
        if (onRouteFound) {
          onRouteFound(result);
        }
      } catch (err) {
        console.error('Error fetching directions:', err);
        setError(err instanceof Error ? err.message : 'Failed to get directions');
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch directions when start/end points or transport mode changes
  useEffect(() => {
    // Reset when inputs change
    if (!isControlled) {
      setRouteData(null);
      setError(null);
    }

    // Only fetch if this is an uncontrolled component or we're not loading externally
    if (!isControlled || externalLoading === undefined) {
      fetchRoute();
    }
  }, [start, end, isVisible, showAlternatives]);

  // Don't render if not visible or no start/end points
  if (!isVisible || !start || !end) {
    return null;
  }

  // Get the active route if available
  const routes = effectiveRouteData?.routes || [];
  const activeRoute = routes.length > effectiveRouteIndex ? routes[effectiveRouteIndex] : undefined;

  // Check if routes have valid geometry before rendering
  const validRoutes = routes.filter(route => {
    // Skip routes with no geometry
    if (!route?.geometry) return false;

    // Check if array geometry has valid elements
    if (Array.isArray(route.geometry)) {
      return (
        route.geometry.length > 0 &&
        route.geometry.some(
          point =>
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === 'number' &&
            !isNaN(point[0]) &&
            typeof point[1] === 'number' &&
            !isNaN(point[1])
        )
      );
    }

    // For string geometry, ensure it's not empty
    if (typeof route.geometry === 'string') {
      return route.geometry.length > 0;
    }

    return false;
  });

  // Render a cancel button when awaiting second point
  const renderCancelButton = () => {
    if (!awaitingSecondPoint || !onCancelMultiPointRoute) return null;

    return (
      <div className="absolute top-4 right-4 z-50">
        <button
          className="px-3 py-2 text-xs bg-white/80 backdrop-blur-md rounded-lg border border-white/40 shadow-[3px_3px_8px_rgba(0,0,0,0.1),-3px_-3px_8px_rgba(255,255,255,0.7)] text-gray-700 hover:bg-white/90 transition-all duration-200 flex items-center"
          onClick={e => {
            e.stopPropagation();
            onCancelMultiPointRoute();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cancel Selection
        </button>
      </div>
    );
  };

  return (
    <div className={`directions-control ${isVisible ? 'visible' : 'hidden'}`}>
      {/* Route visualization on the map */}
      {validRoutes.map((route, index) => {
        console.log(`DirectionsControl - Rendering route overlay ${index}:`, {
          hasGeometry: !!route.geometry,
          geometryType: typeof route.geometry,
          isArray: Array.isArray(route.geometry),
          pointCount: Array.isArray(route.geometry) ? route.geometry.length : 'N/A',
        });

        return (
          <RouteOverlay
            key={`route-${index}`}
            route={route}
            transportMode={externalMode || selectedMode}
            showMarkers={index === effectiveRouteIndex}
            fitRoute={false}
            animated={index === effectiveRouteIndex}
            opacity={index === effectiveRouteIndex ? 0.8 : 0.4}
            weight={index === effectiveRouteIndex ? 5 : 3}
          />
        );
      })}

      {/* Control panel for directions - added onClick to stop propagation to map */}
      <div
        className="absolute bottom-20 left-4 bg-white/80 backdrop-blur-md rounded-xl shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.7)] p-3 max-w-[250px] z-[1000] border border-white/40"
        onClick={e => {
          // Stop propagation to prevent map click handler from being triggered
          e.stopPropagation();
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm text-gray-700">Directions</h3>
          <button
            onClick={e => {
              e.stopPropagation();
              onClose && onClose();
            }}
            className="text-gray-500 hover:text-gray-700 h-6 w-6 flex items-center justify-center rounded-full bg-white/40 shadow-inner"
            aria-label="Close directions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Transportation mode selector */}
        <div className="transport-btn-group mb-3 flex space-x-1">
          <button
            className={`flex-1 py-1 px-2 text-xs rounded-lg transition-all duration-200 ${
              (externalMode || selectedMode) === 'foot-walking'
                ? 'bg-indigo-100 text-indigo-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'
            }`}
            onClick={e => {
              // Stop propagation to prevent map click handler from being triggered
              e.stopPropagation();
              handleModeChange('foot-walking');
            }}
          >
            <span className="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                />
              </svg>
              Walk
            </span>
          </button>

          <button
            className={`flex-1 py-1 px-2 text-xs rounded-lg transition-all duration-200 ${
              (externalMode || selectedMode) === 'cycling-regular'
                ? 'bg-emerald-100 text-emerald-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'
            }`}
            onClick={e => {
              // Stop propagation to prevent map click handler from being triggered
              e.stopPropagation();
              handleModeChange('cycling-regular');
            }}
          >
            <span className="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Bike
            </span>
          </button>
        </div>

        {/* Loading state and error messages */}
        {effectiveLoading && (
          <div className="flex items-center justify-center text-xs text-gray-600 my-2">
            <svg
              className="animate-spin h-4 w-4 mr-2 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Getting directions...
          </div>
        )}

        {!effectiveLoading && effectiveError && (
          <div className="bg-red-50 p-2 rounded-lg text-xs text-red-700 mb-2">
            <p className="font-medium">Error: {effectiveError}</p>
          </div>
        )}

        {/* Route information if available */}
        {!effectiveLoading && !effectiveError && activeRoute && (
          <div className="route-info border-t border-gray-100 pt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium text-gray-700">Distance:</span>
              <span className="text-gray-600">{formatDistance(activeRoute.distance)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-medium text-gray-700">Time:</span>
              <span className="text-gray-600">{formatDuration(activeRoute.duration)}</span>
            </div>

            {/* Alternative routes if available */}
            {validRoutes.length > 1 && (
              <div className="alternative-routes mb-1">
                <div className="text-xs text-gray-700 font-medium mb-1">Routes:</div>
                <div className="flex space-x-2">
                  {validRoutes.map((route, index) => (
                    <button
                      key={`route-btn-${index}`}
                      className={`flex-1 text-xs py-1 px-2 rounded-lg transition-all duration-200 ${
                        index === effectiveRouteIndex
                          ? 'bg-blue-100 text-blue-700 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]'
                          : 'bg-white/70 hover:bg-gray-50 text-gray-600 shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.5)]'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        handleRouteSelect(index);
                      }}
                    >
                      {index === 0 ? 'Best' : `Alt ${index}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* If no route is available, show a message */}
        {!effectiveLoading && !effectiveError && !activeRoute && (
          <div className="text-xs text-gray-600 text-center my-2">
            No route found. Please try another destination.
          </div>
        )}
      </div>

      {/* Add the cancel button */}
      {renderCancelButton()}
    </div>
  );
};

export default DirectionsControl;
