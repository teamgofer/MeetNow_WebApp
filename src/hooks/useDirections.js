import { useState, useCallback, useEffect } from 'react';
import { getDirections, clearRouteCache, } from '../utils/routing-service';
export default function useDirections(options = {}) {
    const { showAlternatives = false, autoRefresh = true } = options;
    const [isDirectionsActive, setIsDirectionsActive] = useState(false);
    const [startPoint, setStartPoint] = useState(undefined);
    const [endPoint, setEndPoint] = useState(undefined);
    const [routeData, setRouteData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [transportMode, setTransportMode] = useState('foot-walking');
    const [awaitingSecondPoint, setAwaitingSecondPoint] = useState(false);
    const [firstSelectedPoint, setFirstSelectedPoint] = useState(undefined);
    useEffect(() => {
        if (routeData) {
            setSelectedRouteIndex(0);
        }
    }, [routeData]);
    const showDirections = useCallback((start, end) => {
        console.log('showDirections called with:', { start, end });
        setStartPoint(start);
        setEndPoint(end);
        setIsDirectionsActive(true);
        setAwaitingSecondPoint(false);
        setFirstSelectedPoint(undefined);
        setError(null);
    }, []);
    const hideDirections = useCallback(() => {
        setIsDirectionsActive(false);
        setRouteData(null);
        setError(null);
        setAwaitingSecondPoint(false);
        setFirstSelectedPoint(undefined);
    }, []);
    const handleRouteData = useCallback((data) => {
        setRouteData(data);
        setIsLoading(false);
    }, []);
    const prepareMultiPointRoute = useCallback((firstPoint) => {
        console.log('Preparing multi-point route with first point:', firstPoint);
        if (!Array.isArray(firstPoint) ||
            firstPoint.length !== 2 ||
            typeof firstPoint[0] !== 'number' ||
            typeof firstPoint[1] !== 'number') {
            console.error('Invalid first point for multi-point routing:', firstPoint);
            setError('Invalid starting point for route');
            return;
        }
        setFirstSelectedPoint(firstPoint);
        setAwaitingSecondPoint(true);
        console.log('Now awaiting second point selection. First point set to:', firstPoint);
    }, []);
    const cancelMultiPointRoute = useCallback(() => {
        setAwaitingSecondPoint(false);
        setFirstSelectedPoint(undefined);
    }, []);
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
            const startCoords = [startPoint[1], startPoint[0]];
            const endCoords = [endPoint[1], endPoint[0]];
            const data = await getDirections(startCoords, endCoords, transportMode);
            console.log('useDirections - Route data received:', data);
            console.log('useDirections - Route geometry type:', typeof data.routes[0]?.geometry);
            console.log('useDirections - Route points sample:', Array.isArray(data.routes[0]?.geometry)
                ? data.routes[0].geometry.slice(0, 3) + '...'
                : 'Encoded string');
            setRouteData(data);
        }
        catch (err) {
            console.error('useDirections - Error refreshing route:', err);
            setError(err instanceof Error ? err.message : 'Failed to get directions');
        }
        finally {
            setIsLoading(false);
        }
    }, [startPoint, endPoint, transportMode, showAlternatives]);
    const clearCache = useCallback(() => {
        clearRouteCache();
    }, []);
    useEffect(() => {
        if (autoRefresh && isDirectionsActive && startPoint && endPoint) {
            refreshRoute();
        }
    }, [isDirectionsActive, startPoint, endPoint, transportMode, autoRefresh, refreshRoute]);
    const updateTransportMode = useCallback((mode) => {
        console.log('Changing transport mode to:', mode);
        console.log('Current points will be preserved:', { startPoint, endPoint });
        setTransportMode(mode);
    }, [startPoint, endPoint]);
    const state = {
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
    const actions = {
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
//# sourceMappingURL=useDirections.js.map