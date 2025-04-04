import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

/**
 * Component that connects the React-Leaflet map to the navigation controller
 * This component doesn't render anything but ensures the map click handler
 * is properly set up in the controller
 */
const MapClickHandlerWithController = ({ navigationController }) => {
  // Get the Leaflet map instance from React-Leaflet context
  const map = useMap();
  const renderStartTimeRef = useRef(Date.now());

  useEffect(() => {
    const startTime = Date.now();

    // Debug information
    console.log('🔍 [MapClickHandlerWithController] Initializing...');
    console.log('🔍 Map available:', !!map);
    console.log('🔍 Controller available:', !!navigationController);

    if (!map) {
      console.error('❌ Map instance not available from React-Leaflet context');
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerInit', 0, {
        success: false,
        reason: 'noMapInstance',
      });
      return;
    }

    if (!navigationController) {
      console.error('❌ Navigation controller not provided');
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerInit', 0, {
        success: false,
        reason: 'noController',
      });
      return;
    }

    // Ensure the controller has the raw Leaflet map instance
    console.log('🔍 Updating controller with map instance');
    console.log('🔍 Map type:', typeof map);
    console.log('🔍 Map has on():', !!map.on);
    console.log('🔍 Map has getContainer():', !!map.getContainer);

    // Pass the raw Leaflet map instance to the controller
    const success = navigationController.updateMapReference(map);

    console.log('🔍 Controller update result:', success ? 'SUCCESS ✅' : 'FAILED ❌');

    if (!success) {
      console.error('❌ Failed to update map reference in controller');
      // Additional debugging
      console.log(
        '🔍 Controller methods:',
        Object.keys(navigationController)
          .filter(key => typeof navigationController[key] === 'function')
          .join(', ')
      );

      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerInit', 0, {
        success: false,
        reason: 'controllerUpdateFailed',
        availableMethods: Object.keys(navigationController)
          .filter(key => typeof navigationController[key] === 'function')
          .join(', '),
      });
    } else {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerInit', duration, {
        success: true,
        hasMapInstance: !!map,
        hasController: !!navigationController,
        mapType: typeof map,
        hasOnMethod: !!map.on,
        hasGetContainer: !!map.getContainer,
      });
    }

    // Cleanup function
    return () => {
      console.log('🔍 [MapClickHandlerWithController] Cleaning up');
      // Don't dispose the controller here, as it's managed by the parent component
    };
  }, [map, navigationController]);

  // This component doesn't render anything
  return null;
};

export default MapClickHandlerWithController;
