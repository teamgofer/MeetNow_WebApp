import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';
const MapClickHandlerWithController = ({ navigationController }) => {
    const map = useMap();
    const renderStartTimeRef = useRef(Date.now());
    useEffect(() => {
        const startTime = Date.now();
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
        console.log('🔍 Updating controller with map instance');
        console.log('🔍 Map type:', typeof map);
        console.log('🔍 Map has on():', !!map.on);
        console.log('🔍 Map has getContainer():', !!map.getContainer);
        const success = navigationController.updateMapReference(map);
        console.log('🔍 Controller update result:', success ? 'SUCCESS ✅' : 'FAILED ❌');
        if (!success) {
            console.error('❌ Failed to update map reference in controller');
            console.log('🔍 Controller methods:', Object.keys(navigationController)
                .filter(key => typeof navigationController[key] === 'function')
                .join(', '));
            PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerInit', 0, {
                success: false,
                reason: 'controllerUpdateFailed',
                availableMethods: Object.keys(navigationController)
                    .filter(key => typeof navigationController[key] === 'function')
                    .join(', '),
            });
        }
        else {
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
        return () => {
            console.log('🔍 [MapClickHandlerWithController] Cleaning up');
        };
    }, [map, navigationController]);
    return null;
};
export default MapClickHandlerWithController;
//# sourceMappingURL=MapClickHandlerWithController.js.map