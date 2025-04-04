import errorHandlingService from './ErrorHandlingService';
import { searchLocations } from './location-services';
import Logger from './Logger';
import { PerformanceMonitor } from './PerformanceMonitor';
class MapNavigationController {
    constructor(options = {}) {
        this.TAG = 'MapNavigationController';
        this._mapRef = null;
        this._mapInstance = null;
        this._isReady = false;
        this._userLocation = null;
        this._selectedLocation = null;
        this._isReverseGeocoding = false;
        this.defaultZoom = options.defaultZoom ?? 15;
        this.animateTransitions = options.animateTransitions !== false;
        this._isMobile = window.innerWidth < 768;
        this._touchStartTime = 0;
        this._touchStartLocation = null;
        this._lastTouchEnd = 0;
        this._touchDebounceTime = 300;
        this.onReady = options.onReady;
        this.onLocationChange = options.onLocationChange;
        this.onError = options.onError;
        this.onMapClick = options.onMapClick;
        this.onLocationSelect = options.onLocationSelect;
        this.onReverseGeocodingStart = options.onReverseGeocodingStart;
        this.onReverseGeocodingEnd = options.onReverseGeocodingEnd;
        this.onSearchAddressUpdate = options.onSearchAddressUpdate;
        this._cachedSetView = null;
        this._cachedFlyTo = null;
        this._cachedPanTo = null;
        this._cachedGetZoom = null;
        this._mapClickHandler = null;
        this._clickHandlerInitialized = false;
        this._operationQueue = [];
        this._isProcessingQueue = false;
        this._currentOperation = null;
        this._lastNavigationTime = 0;
        this._navigationDebounceTime = 300;
        this._errorHandler = errorHandlingService;
        this.isAnimating = false;
        this._handleResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._handleResize);
        this._errorHandler.registerRecoveryStrategy('navigation', async (error) => {
            this._clearQueue();
            if (this._currentOperation) {
                return this._processOperation(this._currentOperation);
            }
            return false;
        });
        Logger.info(this.TAG, 'Initialized with options:', options);
    }
    _handleResize() {
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== this._isMobile) {
            this._isMobile = newIsMobile;
            Logger.debug(this.TAG, `Device type changed to ${newIsMobile ? 'mobile' : 'desktop'}`);
            if (this._mapInstance) {
                this._updateMapSettingsForDevice();
            }
        }
    }
    _updateMapSettingsForDevice() {
        if (!this._mapInstance)
            return;
        if (this._mapInstance.zoomControl) {
            this._mapInstance.zoomControl.setPosition(this._isMobile ? 'bottomright' : 'topleft');
        }
        if (this._mapInstance.attributionControl) {
            this._mapInstance.attributionControl.setPosition(this._isMobile ? 'bottomleft' : 'bottomright');
        }
        this._mapInstance.setMinZoom(this._isMobile ? 5 : 3);
        this._mapInstance.setMaxZoom(this._isMobile ? 18 : 20);
    }
    updateMapReference(mapReference) {
        const startTime = Date.now();
        Logger.info(this.TAG, 'Updating map reference');
        if (this._mapInstance && this._mapClickHandler) {
            Logger.debug(this.TAG, 'Cleaning up previous click handler');
            this._mapInstance.off('click', this._mapClickHandler);
            this._mapClickHandler = null;
        }
        if (mapReference && typeof mapReference === 'object') {
            if ('current' in mapReference) {
                this._mapRef = mapReference.current;
            }
            else {
                this._mapRef = mapReference;
            }
        }
        else {
            this._mapRef = mapReference;
        }
        if (this._mapRef) {
            Logger.debug(this.TAG, 'Map reference details:');
            Logger.debug(this.TAG, '- Type:', typeof this._mapRef);
            Logger.debug(this.TAG, '- Has getContainer?', !!this._mapRef.getContainer);
            const hasLatlng = !!this._mapRef.latLngToContainerPoint;
            const hasSetView = !!this._mapRef.setView;
            const hasAddHandler = !!this._mapRef.on;
            Logger.debug(this.TAG, '- Core methods present:', { hasLatlng, hasSetView, hasAddHandler });
        }
        const success = this._extractMapInstance();
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('map', 'mapReferenceUpdate', duration, {
            success,
            hasMapRef: !!this._mapRef,
            hasMapInstance: !!this._mapInstance,
            hasLatlng: !!this._mapRef.latLngToContainerPoint,
            hasSetView: !!this._mapRef.setView,
            hasAddHandler: !!this._mapRef.on,
        });
        if (success) {
            Logger.info(this.TAG, 'Map reference updated successfully');
            this._setupMapClickHandler();
            this._isReady = true;
            if (this.onReady && typeof this.onReady === 'function') {
                this.onReady(true);
            }
        }
        else {
            Logger.warn(this.TAG, 'Failed to update map reference - invalid map');
        }
        return success && !!this._mapInstance;
    }
    _setupMapClickHandler() {
        const startTime = Date.now();
        if (!this._mapInstance) {
            Logger.warn(this.TAG, 'Cannot set up click handler - no map instance');
            PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', 0, {
                success: false,
                reason: 'noMapInstance',
            });
            return;
        }
        if (this._mapClickHandler) {
            Logger.debug(this.TAG, 'Removing existing click handler');
            this._mapInstance.off('click', this._mapClickHandler);
            this._mapClickHandler = null;
        }
        if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
            this._mapClickHandler = this._handleMapClick.bind(this);
            this._mapInstance.on('click', this._mapClickHandler);
            Logger.info(this.TAG, 'Map click handler set up successfully');
            const duration = Date.now() - startTime;
            PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', duration, {
                success: true,
                hasMapInstance: !!this._mapInstance,
                hasClickHandler: !!this._mapClickHandler,
                hasLocationSelectCallback: !!this.onLocationSelect,
            });
        }
        else {
            Logger.info(this.TAG, 'No location select callback provided, click handler not initialized');
            PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', 0, {
                success: false,
                reason: 'noLocationSelectCallback',
            });
        }
    }
    _clearQueue() {
        this._operationQueue = [];
        this._currentOperation = null;
        this._isProcessingQueue = false;
    }
    async _processOperation(operation) {
        const { location, options = {}, onEnd } = operation;
        if (!this._mapInstance) {
            const error = new Error('Map instance not initialized');
            return this._errorHandler.handleError(error, 'navigation', { operation });
        }
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            const error = new Error('Invalid location provided');
            return this._errorHandler.handleError(error, 'navigation', {
                operation,
                location,
                context: 'Invalid location format',
            });
        }
        if (location._source === 'map' && !options.forceCenter) {
            Logger.debug(this.TAG, 'Skipping map centering for map click source', location);
            return true;
        }
        return new Promise((resolve, reject) => {
            try {
                const zoomToUse = options.zoom ?? this._mapInstance.getZoom();
                const duration = this._isMobile ? 1 : 1.5;
                const easeLinearity = this._isMobile ? 0.3 : 0.25;
                const method = options.method === 'flyTo' ? 'flyTo' : 'setView';
                if (method === 'flyTo' && typeof this._mapInstance.flyTo === 'function') {
                    this._mapInstance.flyTo([location.lat, location.lng], zoomToUse, {
                        animate: options.animate !== false,
                        duration: options.duration ?? duration,
                        easeLinearity,
                        onEnd: () => {
                            if (onEnd)
                                onEnd();
                            resolve(true);
                        },
                    });
                }
                else {
                    this._mapInstance.setView([location.lat, location.lng], zoomToUse, {
                        animate: options.animate !== false,
                        duration: options.duration ?? duration,
                        easeLinearity,
                        onEnd: () => {
                            if (onEnd)
                                onEnd();
                            resolve(true);
                        },
                    });
                }
            }
            catch (error) {
                Logger.error(this.TAG, 'Error during map view change:', error);
                reject(error);
            }
        });
    }
    _extractMapInstance() {
        if (!this._mapRef) {
            Logger.warn(this.TAG, 'Cannot extract map instance - mapRef is null');
            return false;
        }
        if (this._mapRef && typeof this._mapRef === 'object') {
            if (this._mapRef.getContainer && this._mapRef.latLngToContainerPoint) {
                this._mapInstance = this._mapRef;
                Logger.debug(this.TAG, 'Valid Leaflet map instance extracted from react-leaflet');
                this._setupTouchHandlers();
                return true;
            }
            if (this._mapRef.current.getContainer &&
                this._mapRef.current.latLngToContainerPoint) {
                this._mapInstance = this._mapRef.current;
                Logger.debug(this.TAG, 'Valid Leaflet map instance extracted from ref.current');
                this._setupTouchHandlers();
                return true;
            }
        }
        Logger.warn(this.TAG, 'Invalid map reference - not a valid Leaflet map instance');
        return false;
    }
    async _handleMapClick(e) {
        const startTime = Date.now();
        const { lat, lng } = e.latlng;
        Logger.debug(this.TAG, 'Map clicked at:', { lat, lng });
        if (this.onMapClick && typeof this.onMapClick === 'function') {
            this.onMapClick(e);
        }
        if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
            try {
                const tempLocation = {
                    lat: lat,
                    lng: lng,
                    lon: lng,
                    display_name: 'Finding location...',
                    _source: 'map',
                };
                this.setSelectedLocation(tempLocation);
                this.onLocationSelect(tempLocation);
                if (this.onReverseGeocodingStart) {
                    this.onReverseGeocodingStart();
                }
                try {
                    const locationWithAddress = await this._handleReverseGeocoding(lat, lng, 'map');
                    const duration = Date.now() - startTime;
                    PerformanceMonitor.trackOperationTiming('map', 'mapClick', duration, {
                        success: true,
                    });
                    return locationWithAddress;
                }
                catch (error) {
                    throw error;
                }
                finally {
                    if (this.onReverseGeocodingEnd) {
                        this.onReverseGeocodingEnd();
                    }
                }
            }
            catch (error) {
                Logger.error(this.TAG, 'Error handling map click:', error);
                const errorLocation = {
                    lat,
                    lng,
                    lon: lng,
                    display_name: 'Unable to find address',
                    _source: 'map',
                };
                this.setSelectedLocation(errorLocation);
                if (this.onLocationSelect) {
                    this.onLocationSelect(errorLocation);
                }
                if (this.onError) {
                    this.onError(error);
                }
                const duration = Date.now() - startTime;
                PerformanceMonitor.trackOperationTiming('map', 'mapClick', duration, {
                    success: false,
                    error: error.message,
                });
                return errorLocation;
            }
        }
        return null;
    }
    _setupTouchHandlers() {
        if (!this._mapInstance)
            return;
        if (this._mapInstance.removeEventListener) {
            this._mapInstance.removeEventListener('touchstart', this._handleTouchStart);
            this._mapInstance.removeEventListener('touchend', this._handleTouchEnd);
        }
        if (this._mapInstance.addEventListener) {
            this._mapInstance.addEventListener('touchstart', this._handleTouchStart);
            this._mapInstance.addEventListener('touchend', this._handleTouchEnd);
        }
    }
    _handleTouchStart(event) {
        if (event.touches.length > 1)
            return;
        this._touchStartTime = Date.now();
        this._touchStartLocation = {
            lat: event.touches[0].clientY,
            lng: event.touches[0].clientX,
            display_name: 'Touch Location',
        };
    }
    _handleTouchEnd(event) {
        if (event.touches.length > 1)
            return;
        const now = Date.now();
        if (now - this._lastTouchEnd <= this._touchDebounceTime) {
            event.preventDefault();
            return;
        }
        this._lastTouchEnd = now;
        const touchDuration = now - this._touchStartTime;
        const touchDistance = this._touchStartLocation
            ? Math.sqrt(Math.pow(event.changedTouches[0].clientY - this._touchStartLocation.lat, 2) +
                Math.pow(event.changedTouches[0].clientX - this._touchStartLocation.lng, 2))
            : 0;
        if (touchDuration < 200 && touchDistance < 10 && this._mapInstance) {
            const point = this._mapInstance.containerPointToLatLng([
                event.changedTouches[0].clientX,
                event.changedTouches[0].clientY,
            ]);
            if (point) {
                this._handleLocationSelect(point);
            }
        }
    }
    _handleLocationSelect(location) {
        if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
            this.onLocationSelect({
                lat: location.lat,
                lng: location.lng,
                display_name: 'Selected Location',
            });
        }
    }
    setUserLocation(location) {
        const normalizedLocation = this._normalizeLocation(location);
        if (!normalizedLocation) {
            Logger.warn(this.TAG, 'Invalid user location provided:', location);
            return false;
        }
        this._userLocation = normalizedLocation;
        Logger.debug(this.TAG, 'User location updated:', normalizedLocation);
        if (this.onLocationChange && typeof this.onLocationChange === 'function') {
            this.onLocationChange(normalizedLocation);
        }
        return true;
    }
    setSelectedLocation(location) {
        const normalizedLocation = this._normalizeLocation(location);
        if (!normalizedLocation) {
            Logger.warn(this.TAG, 'Invalid selected location provided:', location);
            return false;
        }
        this._selectedLocation = normalizedLocation;
        Logger.debug(this.TAG, 'Selected location updated:', normalizedLocation);
        return true;
    }
    async _handleReverseGeocoding(lat, lng, source = 'map') {
        try {
            const results = await searchLocations(null, { lat, lng });
            if (results && results.length > 0) {
                const result = results[0];
                const displayName = this._determineDisplayName(result);
                if (this.onSearchAddressUpdate) {
                    this.onSearchAddressUpdate(displayName);
                }
                const locationWithAddress = {
                    ...result,
                    lat,
                    lng,
                    lon: lng,
                    display_name: displayName,
                    _source: source,
                };
                this.setSelectedLocation(locationWithAddress);
                if (this.onLocationSelect) {
                    this.onLocationSelect(locationWithAddress);
                }
                return locationWithAddress;
            }
            throw new Error('No results found');
        }
        catch (error) {
            Logger.error(this.TAG, 'Error reverse geocoding:', error);
            throw error;
        }
    }
    _determineDisplayName(result) {
        const startTime = Date.now();
        let displayName = result.display_name ?? '';
        if (result.name) {
            displayName = result.name;
        }
        else if (result.tags?.name) {
            displayName = result.tags.name;
        }
        else if (result.address) {
            const address = result.address;
            const placeName = (address.attraction ?? address.building) ||
                address.amenity ||
                address.leisure ||
                address.tourism ||
                address.shop ||
                address.historic ||
                address.natural ||
                address.office ||
                address.healthcare ||
                address.place_of_worship;
            if (placeName) {
                displayName = placeName;
            }
        }
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('map', 'determineDisplayName', duration, {
            success: true,
            hasDisplayName: !!displayName,
            hasName: !!result.name,
            hasTags: !!result.tags,
            hasAddress: !!result.address,
        });
        return displayName;
    }
    _isValidLocation(location) {
        return (location &&
            typeof location.lat === 'number' &&
            typeof location.lng === 'number' &&
            !isNaN(location.lat) &&
            !isNaN(location.lng));
    }
    _normalizeLocation(location) {
        if (!location)
            return null;
        if (typeof location.lat === 'number' && typeof location.lng === 'number') {
            return {
                lat: location.lat,
                lng: location.lng,
                ...location,
            };
        }
        if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
            return {
                lat: location.latitude,
                lng: location.longitude,
                ...location,
            };
        }
        if (Array.isArray(location) &&
            location.length >= 2 &&
            typeof location[0] === 'number' &&
            typeof location[1] === 'number') {
            return {
                lat: location[0],
                lng: location[1],
                display_name: 'Array Location',
            };
        }
        Logger.warn(this.TAG, 'Invalid location format', location);
        return null;
    }
    async _queueOperation(operation) {
        return new Promise((resolve, reject) => {
            this._operationQueue.push({
                ...operation,
                resolve,
                reject,
            });
            if (!this._isProcessingQueue) {
                this._processQueue();
            }
        });
    }
    async _processQueue() {
        if (this._isProcessingQueue || this._operationQueue.length === 0) {
            return;
        }
        this._isProcessingQueue = true;
        try {
            while (this._operationQueue.length > 0) {
                if (this._lastNavigationTime) {
                    const timeSinceLastNav = Date.now() - this._lastNavigationTime;
                    if (timeSinceLastNav < this._navigationDebounceTime) {
                        await new Promise(resolve => setTimeout(resolve, this._navigationDebounceTime - timeSinceLastNav));
                    }
                }
                const operation = this._operationQueue.shift();
                if (!operation)
                    continue;
                this._currentOperation = operation;
                try {
                    const result = await this._processOperation(operation);
                    operation.resolve?.(result);
                }
                catch (error) {
                    const recovered = await this._errorHandler.handleError(error, 'navigation', {
                        operation,
                        queueLength: this._operationQueue.length,
                    });
                    if (recovered) {
                        operation.resolve?.(recovered);
                    }
                    else {
                        operation.reject?.(error);
                    }
                }
                this._lastNavigationTime = Date.now();
                this._currentOperation = null;
            }
        }
        catch (error) {
            console.error('[MapNavigationController] Queue processing error:', error);
            this._errorHandler.handleError(error, 'navigation', {
                queueLength: this._operationQueue.length,
            });
        }
        finally {
            this._isProcessingQueue = false;
        }
    }
    navigateTo(location, options = {}) {
        Logger.debug(this.TAG, 'Navigating to:', location, 'with options:', options);
        const normalizedLocation = this._normalizeLocation(location);
        if (!normalizedLocation) {
            Logger.warn(this.TAG, 'Invalid location for navigation:', location);
            return Promise.resolve(false);
        }
        if (normalizedLocation._source === 'map' && !options.forceCenter) {
            Logger.debug(this.TAG, 'Skip centering view for map click source:', normalizedLocation);
            return Promise.resolve(true);
        }
        const operation = {
            type: 'navigateTo',
            location: normalizedLocation,
            options: {
                zoom: (options.zoom ?? this._mapInstance?.getZoom()) || this.defaultZoom,
                animate: options.animate !== false && this.animateTransitions,
                method: options.method || 'flyTo',
                duration: options.duration || 1,
                ...(options || {}),
            },
        };
        return this._queueOperation(operation);
    }
    centerOnUser(options = {}) {
        if (!this._userLocation) {
            Logger.warn('MapNavigationController', 'No user location available');
            return Promise.resolve(false);
        }
        return this.navigateTo(this._userLocation, options);
    }
    dispose() {
        const startTime = Date.now();
        this._clearQueue();
        if (this._mapInstance && this._mapClickHandler) {
            Logger.debug(this.TAG, 'Removing map click handler during disposal');
            this._mapInstance.off('click', this._mapClickHandler);
            this._mapClickHandler = null;
        }
        this._cachedSetView = null;
        this._cachedFlyTo = null;
        this._cachedPanTo = null;
        this._cachedGetZoom = null;
        this._mapRef = null;
        this._mapInstance = null;
        this._isReady = false;
        this._clickHandlerInitialized = false;
        window.removeEventListener('resize', this._handleResize);
        if (this._mapInstance) {
            this._mapInstance.removeEventListener('touchstart', this._handleTouchStart);
            this._mapInstance.removeEventListener('touchend', this._handleTouchEnd);
        }
        Logger.info(this.TAG, 'Controller disposed');
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('map', 'controllerDispose', duration, {
            success: true,
            hadMapInstance: !!this._mapInstance,
            hadClickHandler: !!this._mapClickHandler,
        });
    }
}
export default MapNavigationController;
//# sourceMappingURL=MapNavigationController.js.map