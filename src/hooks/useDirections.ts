/**
 * Custom hook for managing directions and route display
 */
import { useState, useCallback, useEffect } from 'react';
import type { LatLngTuple } from 'leaflet';
import {
  RouteResponse,
  TransportMode,
  getDirections,
  clearRouteCache,
} from '../utils/routing-service';

interface DirectionsState {
  isDirectionsActive: boolean;
  startPoint: LatLngTuple | undefined;
  endPoint: LatLngTuple | undefined;
  routeData: RouteResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedRouteIndex: number;
  transportMode: TransportMode;
  // New states for multi-plot routing
  awaitingSecondPoint: boolean;
  firstSelectedPoint: LatLngTuple | undefined;
}

interface DirectionsActions {
  showDirections: (start: LatLngTuple, end: LatLngTuple) => void;
  hideDirections: () => void;
  setRouteData: (data: RouteResponse) => void;
  setSelectedRouteIndex: (index: number) => void;
  setTransportMode: (mode: TransportMode) => void;
  refreshRoute: () => Promise<void>;
  clearCache: () => void;
  // New actions for multi-plot routing
  prepareMultiPointRoute: (firstPoint: LatLngTuple) => void;
  cancelMultiPointRoute: () => void;
}

/**
 * Hook for managing directions between two points
 * @param options.showAlternatives Whether to fetch alternative routes
 * @param options.autoRefresh Whether to automatically refresh routes when points change
 */
export default function useDirections(
  options: {
    showAlternatives?: boolean;
    autoRefresh?: boolean;
  } = {}
): [DirectionsState, DirectionsActions] {
  // Default options
  const { showAlternatives = false, autoRefresh = true } = options;

  // State for directions
  const [isDirectionsActive, setIsDirectionsActive] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<LatLngTuple | undefined>(undefined);
  const [endPoint, setEndPoint] = useState<LatLngTuple | undefined>(undefined);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [transportMode, setTransportMode] = useState<TransportMode>('foot-walking');

  // New states for multi-point routing
  const [awaitingSecondPoint, setAwaitingSecondPoint] = useState<boolean>(false);
  const [firstSelectedPoint, setFirstSelectedPoint] = useState<LatLngTuple | undefined>(undefined);

  // Clear selected route index when route data changes
  useEffect(() => {
    if (routeData) {
      setSelectedRouteIndex(0);
    }
  }, [routeData]);

  // Show directions between two points
  const showDirections = useCallback((start: LatLngTuple, end: LatLngTuple) => {
    console.log('showDirections called with:', { start, end });
    setStartPoint(start);
    setEndPoint(end);
    setIsDirectionsActive(true);

    // Reset multi-point routing state
    setAwaitingSecondPoint(false);
    setFirstSelectedPoint(undefined);

    // Reset error
    setError(null);
  }, []);

  // Hide directions and clear route
  const hideDirections = useCallback(() => {
    setIsDirectionsActive(false);
    setRouteData(null);
    setError(null);

    // Reset multi-point routing state
    setAwaitingSecondPoint(false);
    setFirstSelectedPoint(undefined);
  }, []);

  // Handle route data from the directions API
  const handleRouteData = useCallback((data: RouteResponse) => {
    setRouteData(data);
    setIsLoading(false);
  }, []);

  // New function to prepare for multi-point routing
  const prepareMultiPointRoute = useCallback((firstPoint: LatLngTuple) => {
    console.log('Preparing multi-point route with first point:', firstPoint);

    // Validate the first point is a proper LatLngTuple
    if (
      !Array.isArray(firstPoint) ||
      firstPoint.length !== 2 ||
      typeof firstPoint[0] !== 'number' ||
      typeof firstPoint[1] !== 'number'
    ) {
      console.error('Invalid first point for multi-point routing:', firstPoint);
      setError('Invalid starting point for route');
      return;
    }

    // Store the first selected point for the multi-point route
    setFirstSelectedPoint(firstPoint);
    setAwaitingSecondPoint(true);

    console.log('Now awaiting second point selection. First point set to:', firstPoint);
  }, []);

  // Cancel multi-point routing
  const cancelMultiPointRoute = useCallback(() => {
    setAwaitingSecondPoint(false);
    setFirstSelectedPoint(undefined);
  }, []);

  // Refresh the route (e.g., when transport mode changes)
  const refreshRoute = useCallback(async () => {
    if (!startPoint || !endPoint) {
      setError('Start and end points are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('useDirections - Refreshing route:', {
      start: { lat: startPoint[0], lng: startPoint[1] },
      end: { lat: endPoint[0], lng: endPoint[1] },
      mode: transportMode,
      alternatives: showAlternatives,
    });

    try {
      // Create coordinates as [longitude, latitude] arrays - ORS API format
      const startCoords: [number, number] = [startPoint[1], startPoint[0]];
      const endCoords: [number, number] = [endPoint[1], endPoint[0]];

      const data = await getDirections(startCoords, endCoords, transportMode);

      console.log('useDirections - Route data received:', data);
      console.log('useDirections - Route geometry type:', typeof data.routes[0]?.geometry);
      console.log(
        'useDirections - Route points sample:',
        Array.isArray(data.routes[0]?.geometry)
          ? data.routes[0].geometry.slice(0, 3) + '...'
          : 'Encoded string'
      );

      setRouteData(data);
    } catch (err) {
      console.error('useDirections - Error refreshing route:', err);
      setError(err instanceof Error ? err.message : 'Failed to get directions');
    } finally {
      setIsLoading(false);
    }
  }, [startPoint, endPoint, transportMode, showAlternatives]);

  // Clear the route cache
  const clearCache = useCallback(() => {
    clearRouteCache();
  }, []);

  // Auto-refresh route when points change
  useEffect(() => {
    if (autoRefresh && isDirectionsActive && startPoint && endPoint) {
      refreshRoute();
    }
  }, [isDirectionsActive, startPoint, endPoint, transportMode, autoRefresh, refreshRoute]);

  // Update transport mode (renamed from setTransportMode to updateTransportMode)
  const updateTransportMode = useCallback(
    (mode: TransportMode) => {
      console.log('Changing transport mode to:', mode);
      console.log('Current points will be preserved:', { startPoint, endPoint });
      setTransportMode(mode);
    },
    [startPoint, endPoint]
  );

  // Pack the state and actions
  const state: DirectionsState = {
    isDirectionsActive,
    startPoint,
    endPoint,
    routeData,
    isLoading,
    error,
    selectedRouteIndex,
    transportMode,
    awaitingSecondPoint,
    firstSelectedPoint,
  };

  const actions: DirectionsActions = {
    showDirections,
    hideDirections,
    setRouteData: handleRouteData,
    setSelectedRouteIndex,
    setTransportMode: updateTransportMode,
    refreshRoute,
    clearCache,
    prepareMultiPointRoute,
    cancelMultiPointRoute,
  };

  return [state, actions];
}
