import PropTypes from 'prop-types';
import React, { useEffect, useState, useRef } from 'react';

import Logger from '../utils/Logger';

import NavigationController from './NavigationController';

/**
 * NavigationSystem serves as the main component for integrating
 * the navigation functionality into the application
 */
const NavigationSystem = ({
  mapRef,
  defaultMode,
  defaultZoom = 15,
  minZoom = 5,
  maxZoom = 18,
  debug = false,
  onModeChange,
  onLocationChange,
  onSelectedLocationChange,
  onZoomChange,
  onReady,
}) => {
  const [controller, setController] = useState(null);
  const [leafletMap, setLeafletMap] = useState(null);
  const controllerRef = useRef(null);
  const logger = Logger.forComponent('NavigationSystem');

  // Initialize the navigation controller
  useEffect(() => {
    logger.info('Initializing Navigation System');

    // Create new controller
    const navController = new NavigationController({
      mapRef,
      defaultMode,
      defaultZoom,
      minZoom,
      maxZoom,
      debug,
      onModeChange,
      onLocationChange,
      onSelectedLocationChange,
      onZoomChange,
      onReady: controller => {
        logger.info('Navigation controller ready');
        if (typeof onReady === 'function') {
          onReady(controller);
        }
      },
    });

    // Store reference for cleanup
    controllerRef.current = navController;
    setController(navController);

    // Extract Leaflet map instance from ref
    if (mapRef) {
      try {
        // Try to get map instance from different ref types
        let mapInstance = null;

        if (mapRef._leaflet_id) {
          // Direct Leaflet map
          mapInstance = mapRef;
        } else if (mapRef.current) {
          if (mapRef.current._leaflet_id) {
            // React ref with direct map
            mapInstance = mapRef.current;
          } else if (mapRef.current._map?._leaflet_id) {
            // Ref to component with _map property
            mapInstance = mapRef.current._map;
          } else if (typeof mapRef.current.getInstance === 'function') {
            // Component with getInstance method
            mapInstance = mapRef.current.getInstance();
          }
        }

        if (mapInstance?._leaflet_id) {
          setLeafletMap(mapInstance);
          logger.debug('Leaflet map instance extracted successfully');
        } else {
          logger.warn('Could not extract Leaflet map from ref');
        }
      } catch (error) {
        logger.error('Error extracting map instance', error);
      }
    }

    // Clean up controller on unmount
    return () => {
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
    };
  }, [mapRef]); // Only re-initialize if map reference changes

  // Update map reference if it changes after initialization
  useEffect(() => {
    if (controller && mapRef) {
      controller.updateMapReference(mapRef);
    }
  }, [mapRef, controller]);

  // No UI rendering - this is now just a wrapper for the controller
  return null;
};

NavigationSystem.propTypes = {
  mapRef: PropTypes.oneOfType([PropTypes.object, PropTypes.shape({ current: PropTypes.object })])
    .isRequired,
  defaultMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultZoom: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  debug: PropTypes.bool,
  onModeChange: PropTypes.func,
  onLocationChange: PropTypes.func,
  onSelectedLocationChange: PropTypes.func,
  onZoomChange: PropTypes.func,
  onReady: PropTypes.func,
};

export default NavigationSystem;
