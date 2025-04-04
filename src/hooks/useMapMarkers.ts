import { useState, useEffect, useCallback, useMemo } from 'react';
import Logger from '../utils/Logger';

/**
 * Interface for map marker options
 */
interface IMarkerOptions {
  icon?: string;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
  title?: string;
  animation?: 'DROP' | 'BOUNCE' | null;
  [key: string]: any;
}

/**
 * Interface for a map marker
 */
interface IMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  options?: IMarkerOptions;
  onClick?: () => void;
  onDrag?: (position: { lat: number; lng: number }) => void;
}

/**
 * Interface for marker collection with helper methods
 */
interface IMarkerCollection {
  markers: Map<string, IMarker>;
  add: (marker: IMarker) => void;
  remove: (markerId: string) => void;
  update: (markerId: string, updates: Partial<IMarker>) => void;
  updatePosition: (markerId: string, position: { lat: number; lng: number }) => void;
  updateOptions: (markerId: string, options: IMarkerOptions) => void;
  clear: () => void;
  getById: (markerId: string) => IMarker | undefined;
  getAll: () => IMarker[];
  getVisible: () => IMarker[];
}

/**
 * Custom hook for managing map markers
 *
 * @returns Marker collection and management functions
 */
const useMapMarkers = (): IMarkerCollection => {
  const [markers, setMarkers] = useState<Map<string, IMarker>>(new Map());

  // Add a new marker
  const add = useCallback((marker: IMarker) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      newMarkers.set(marker.id, marker);
      Logger.debug('MapMarkers', `Added marker: ${marker.id}`);
      return newMarkers;
    });
  }, []);

  // Remove a marker by id
  const remove = useCallback((markerId: string) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      const success = newMarkers.delete(markerId);
      if (success) {
        Logger.debug('MapMarkers', `Removed marker: ${markerId}`);
      } else {
        Logger.warn('MapMarkers', `Failed to remove marker: ${markerId} - not found`);
      }
      return newMarkers;
    });
  }, []);

  // Update a marker
  const update = useCallback((markerId: string, updates: Partial<IMarker>) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      const existingMarker = newMarkers.get(markerId);

      if (!existingMarker) {
        Logger.warn('MapMarkers', `Cannot update marker: ${markerId} - not found`);
        return prev;
      }

      newMarkers.set(markerId, { ...existingMarker, ...updates });
      Logger.debug('MapMarkers', `Updated marker: ${markerId}`);
      return newMarkers;
    });
  }, []);

  // Update marker position
  const updatePosition = useCallback((markerId: string, position: { lat: number; lng: number }) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      const existingMarker = newMarkers.get(markerId);

      if (!existingMarker) {
        Logger.warn('MapMarkers', `Cannot update position: ${markerId} - not found`);
        return prev;
      }

      newMarkers.set(markerId, { ...existingMarker, position });
      return newMarkers;
    });
  }, []);

  // Update marker options
  const updateOptions = useCallback((markerId: string, options: IMarkerOptions) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      const existingMarker = newMarkers.get(markerId);

      if (!existingMarker) {
        Logger.warn('MapMarkers', `Cannot update options: ${markerId} - not found`);
        return prev;
      }

      newMarkers.set(markerId, {
        ...existingMarker,
        options: { ...existingMarker.options, ...options },
      });
      return newMarkers;
    });
  }, []);

  // Clear all markers
  const clear = useCallback(() => {
    setMarkers(new Map());
    Logger.debug('MapMarkers', 'Cleared all markers');
  }, []);

  // Get marker by id
  const getById = useCallback(
    (markerId: string) => {
      return markers.get(markerId);
    },
    [markers]
  );

  // Get all markers as array
  const getAll = useCallback(() => {
    return Array.from(markers.values());
  }, [markers]);

  // Get only visible markers
  const getVisible = useCallback(() => {
    return Array.from(markers.values()).filter(marker => marker.options?.visible !== false);
  }, [markers]);

  // Create the marker collection object with all methods
  const markerCollection = useMemo<IMarkerCollection>(
    () => ({
      markers,
      add,
      remove,
      update,
      updatePosition,
      updateOptions,
      clear,
      getById,
      getAll,
      getVisible,
    }),
    [
      markers,
      add,
      remove,
      update,
      updatePosition,
      updateOptions,
      clear,
      getById,
      getAll,
      getVisible,
    ]
  );

  return markerCollection;
};

export default useMapMarkers;
