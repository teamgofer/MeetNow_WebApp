import { useState, useCallback, useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import MapNavigationController from '../utils/MapNavigationController';
import logger from '../utils/Logger';

const useMap = () => {
  const leafletMap = useLeafletMap();
  const [navigationController, setNavigationController] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(leafletMap?.getZoom() || 13);
  const [center, setCenter] = useState(leafletMap?.getCenter() || [37.7749, -122.4194]);

  useEffect(() => {
    if (leafletMap && !navigationController) {
      const controller = new MapNavigationController(leafletMap);
      setNavigationController(controller);
      logger.info('Map navigation controller initialized');
    }

    return () => {
      if (navigationController) {
        navigationController.destroy();
        setNavigationController(null);
        logger.debug('Map navigation controller destroyed');
      }
    };
  }, [leafletMap, navigationController]);

  useEffect(() => {
    if (!leafletMap) return;

    const handleMoveEnd = () => {
      const newBounds = leafletMap.getBounds();
      const newZoom = leafletMap.getZoom();
      const newCenter = leafletMap.getCenter();
      
      setBounds(newBounds);
      setZoom(newZoom);
      setCenter([newCenter.lat, newCenter.lng]);
      
      logger.debug('Map view updated', {
        bounds: newBounds,
        zoom: newZoom,
        center: newCenter
      });
    };

    leafletMap.on('moveend', handleMoveEnd);
    return () => {
      leafletMap.off('moveend', handleMoveEnd);
    };
  }, [leafletMap]);

  const flyTo = useCallback((target, options = {}) => {
    if (!leafletMap || !navigationController) return;

    const defaultOptions = {
      duration: 1000,
      zoom: 15
    };

    navigationController.animateTo(target, options.zoom || defaultOptions.zoom, options.duration || defaultOptions.duration);
    logger.debug('Map flying to location', { target, options });
  }, [leafletMap, navigationController]);

  const fitBounds = useCallback((targetBounds, options = {}) => {
    if (!leafletMap || !navigationController) return;

    navigationController.fitBounds(targetBounds, options);
    logger.debug('Map fitting bounds', { targetBounds, options });
  }, [leafletMap, navigationController]);

  const resetView = useCallback(() => {
    if (!navigationController) return;

    navigationController.resetView();
    logger.debug('Map view reset');
  }, [navigationController]);

  const centerOnUser = useCallback((coordinates) => {
    if (!navigationController) return;

    navigationController.centerOnUser(coordinates);
    logger.debug('Map centered on user', { coordinates });
  }, [navigationController]);

  return {
    map: leafletMap,
    bounds,
    zoom,
    center,
    flyTo,
    fitBounds,
    resetView,
    centerOnUser
  };
};

export default useMap; 
 
 
 
 
 