import { useState, useCallback, useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import { Map, LatLngBounds, LatLngExpression, FitBoundsOptions, LatLng } from 'leaflet';

import Logger from '../utils/Logger';
import MapNavigationController from '../utils/MapNavigationController';

/**
 * Interface for location coordinates
 */
interface IMapLocation {
  lat: number;
  lng: number;
  [key: string]: any;
}

/**
 * Interface for navigation options
 */
interface IMapNavigationOptions {
  method?: 'flyTo' | 'setView' | undefined;
  duration?: number | undefined;
  zoom?: number | undefined;
  animate?: boolean | undefined;
  forceCenter?: boolean | undefined;
  [key: string]: any;
}

/**
 * Interface for the returned value from the useMap hook
 */
interface IUseMapReturn {
  map: Map | null;
  bounds: LatLngBounds | null;
  zoom: number;
  center: [number, number];
  flyTo: (target: LatLngExpression | IMapLocation, options?: IFlyToOptions) => void;
  fitBounds: (targetBounds: LatLngBounds, options?: FitBoundsOptions) => void;
  resetView: () => void;
  centerOnUser: (coordinates?: IMapLocation) => void;
}

/**
 * Interface for flyTo options
 */
interface IFlyToOptions {
  duration?: number | undefined;
  zoom?: number | undefined;
  [key: string]: any;
}

/**
 * Custom hook for managing Leaflet map functionality
 * Provides map state and navigation methods
 *
 * @returns Map instance, state, and navigation methods
 */
const useMap = (): IUseMapReturn => {
  const leafletMap = useLeafletMap();
  const [navigationController, setNavigationController] = useState<MapNavigationController | null>(
    null
  );
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState<number>(leafletMap.getZoom() || 13);
  const [center, setCenter] = useState<[number, number]>(
    leafletMap.getCenter()
      ? [leafletMap.getCenter().lat, leafletMap.getCenter().lng]
      : [37.7749, -122.4194]
  );

  // Initialize the navigation controller
  useEffect(() => {
    if (leafletMap && !navigationController) {
      try {
        const controller = new MapNavigationController(leafletMap);
        setNavigationController(controller);
        Logger.info('MapHook', 'Map navigation controller initialized');
      } catch (error) {
        Logger.error('MapHook', 'Failed to initialize map navigation controller', error);
      }
    }

    // Clean up the controller when component unmounts
    return () => {
      if (navigationController) {
        navigationController.dispose();
        setNavigationController(null);
        Logger.debug('MapHook', 'Map navigation controller destroyed');
      }
    };
  }, [leafletMap, navigationController]);

  // Set up map event listeners
  useEffect(() => {
    if (!leafletMap) return;

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

    // Initial state setup
    handleMoveEnd();

    // Clean up event listener
    return () => {
      leafletMap.off('moveend', handleMoveEnd);
    };
  }, [leafletMap]);

  /**
   * Fly to a location with animation
   */
  const flyTo = useCallback(
    (target: LatLngExpression | IMapLocation, options: IFlyToOptions = {}): void => {
      if (!leafletMap || !navigationController) return;

      // Create defaultOptions with explicit undefined handling for type safety
      const defaultOptions: IMapNavigationOptions = {
        method: 'flyTo',
        duration: 1000,
        zoom: 15,
        animate: true,
        forceCenter: false,
      };

      // Merge options with defaults
      const mergedOptions: IMapNavigationOptions = { ...defaultOptions };

      // Handle each property individually to maintain type safety
      if (options.zoom !== undefined) mergedOptions.zoom = options.zoom;
      if (options.duration !== undefined) mergedOptions.duration = options.duration;

      // Add any additional options
      Object.keys(options).forEach(key => {
        if (key !== 'zoom' && key !== 'duration') {
          mergedOptions[key] = options[key];
        }
      });

      // Convert target to location format if needed
      let location: IMapLocation;
      if (target instanceof LatLng) {
        location = { lat: target.lat, lng: target.lng };
      } else if (typeof target === 'object' && 'lat' in target && 'lng' in target) {
        location = target as IMapLocation;
      } else {
        location = { lat: (target as [number, number])[0], lng: (target as [number, number])[1] };
      }

      if (
        'navigateTo' in navigationController &&
        typeof navigationController.navigateTo === 'function'
      ) {
        // @ts-ignore: We're handling the type mismatches manually
        navigationController
          .navigateTo(location, mergedOptions)
          .catch((error: Error) => Logger.error('MapHook', 'Error flying to location', error));
      } else {
        // Fallback if navigateTo is not available
        leafletMap.flyTo([location.lat, location.lng], mergedOptions.zoom || 15, {
          duration: mergedOptions.duration ? mergedOptions.duration / 1000 : 1,
        });
      }

      Logger.debug('MapHook', 'Map flying to location', { target, options: mergedOptions });
    },
    [leafletMap, navigationController]
  );

  /**
   * Fit map view to bounds
   */
  const fitBounds = useCallback(
    (targetBounds: LatLngBounds, options: FitBoundsOptions = {}): void => {
      if (!leafletMap) return;

      try {
        leafletMap.fitBounds(targetBounds, options);
        Logger.debug('MapHook', 'Map fitting bounds', { targetBounds, options });
      } catch (error) {
        Logger.error('MapHook', 'Error fitting bounds', error);
      }
    },
    [leafletMap]
  );

  /**
   * Reset the map view to default
   */
  const resetView = useCallback((): void => {
    if (!navigationController || !leafletMap) return;

    try {
      // Use direct leaflet method as fallback
      leafletMap.flyTo([37.7749, -122.4194], 13, {
        duration: 1,
      });
      Logger.debug('MapHook', 'Map view reset');
    } catch (error) {
      Logger.error('MapHook', 'Error resetting view', error);
    }
  }, [navigationController, leafletMap]);

  /**
   * Center the map on user's location
   */
  const centerOnUser = useCallback(
    (coordinates?: IMapLocation): void => {
      if (!navigationController || !leafletMap) return;

      try {
        if (coordinates) {
          leafletMap.flyTo([coordinates.lat, coordinates.lng], 15);
        } else if (
          'centerOnUser' in navigationController &&
          typeof navigationController.centerOnUser === 'function'
        ) {
          // @ts-ignore: We're handling the type mismatch manually
          navigationController.centerOnUser({ animate: true });
        }
        Logger.debug('MapHook', 'Map centered on user', { coordinates });
      } catch (error) {
        Logger.error('MapHook', 'Error centering on user', error);
      }
    },
    [navigationController, leafletMap]
  );

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
