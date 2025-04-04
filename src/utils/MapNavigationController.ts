import type { Map, LatLng, LeafletMouseEvent } from 'leaflet';
import L, { LatLngBounds, LeafletEvent, LeafletEventHandlerFn } from 'leaflet';

import errorHandlingService from './ErrorHandlingService';
import { searchLocations } from './location-services';
import Logger from './Logger';
import { PerformanceMonitor } from './PerformanceMonitor';

// Types
export interface ILocation {
  lat: number;
  lng: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  display_name?: string;
  name?: string;
  type?: string;
  importance?: number;
  tags?: {
    name?: string;
    [key: string]: string | undefined;
  };
  address?: {
    attraction?: string;
    building?: string;
    amenity?: string;
    leisure?: string;
    tourism?: string;
    shop?: string;
    historic?: string;
    natural?: string;
    office?: string;
    healthcare?: string;
    place_of_worship?: string;
    [key: string]: string | undefined;
  };
  _source?: string;
}

export interface INavigationOptions {
  zoom?: number;
  animate?: boolean;
  method?: 'flyTo' | 'setView';
  duration?: number;
  forceCenter?: boolean;
  [key: string]: any;
}

export interface IMapNavigationOptions {
  defaultZoom?: number;
  animateTransitions?: boolean;
  defaultLocation?: ILocation;
  enableDebug?: boolean;
  onReady?: (success: boolean) => void;
  onLocationChange?: (location: ILocation) => void;
  onError?: (error: Error) => void;
  onMapClick?: (event: LeafletMouseEvent) => void;
  onLocationSelect?: (location: ILocation) => void;
  onReverseGeocodingStart?: () => void;
  onReverseGeocodingEnd?: () => void;
  onSearchAddressUpdate?: (address: string) => void;
}

interface INavigationOperation {
  type: string;
  location: ILocation;
  options: INavigationOptions;
  resolve?: (value: boolean | PromiseLike<boolean>) => void;
  reject?: (reason?: any) => void;
  onEnd?: () => void;
}

/**
 * Simplified Map Navigation Controller
 * Provides basic map navigation functionality with mobile optimizations
 */
class MapNavigationController {
  private readonly TAG: string = 'MapNavigationController';
  private _mapRef: Map | { current: Map } | null;
  private _mapInstance: Map | null;
  private _isReady: boolean;
  private _userLocation: ILocation | null;
  private _selectedLocation: ILocation | null;
  private _isReverseGeocoding: boolean;
  private _isMobile: boolean;
  private _touchStartTime: number;
  private _touchStartLocation: ILocation | null;
  private _lastTouchEnd: number;
  private readonly _touchDebounceTime: number;
  private readonly defaultZoom: number;
  private readonly animateTransitions: boolean;
  private readonly onReady?: (success: boolean) => void;
  private readonly onLocationChange?: (location: ILocation) => void;
  private readonly onError?: (error: Error) => void;
  private readonly onMapClick?: (event: LeafletMouseEvent) => void;
  private readonly onLocationSelect?: (location: ILocation) => void;
  private readonly onReverseGeocodingStart?: () => void;
  private readonly onReverseGeocodingEnd?: () => void;
  private readonly onSearchAddressUpdate?: (address: string) => void;
  private _cachedSetView: Function | null;
  private _cachedFlyTo: Function | null;
  private _cachedPanTo: Function | null;
  private _cachedGetZoom: Function | null;
  private _mapClickHandler: ((e: LeafletMouseEvent) => void) | null;
  private _clickHandlerInitialized: boolean;
  private _operationQueue: INavigationOperation[];
  private _isProcessingQueue: boolean;
  private _currentOperation: INavigationOperation | null;
  private _lastNavigationTime: number;
  private readonly _navigationDebounceTime: number;
  private readonly _errorHandler: typeof errorHandlingService;
  private isAnimating: boolean;

  /**
   * Create a new map navigation controller
   * @param {IMapNavigationOptions} [options] - Configuration options
   */
  constructor(options: IMapNavigationOptions = {}) {
    // Initialize state
    this._mapRef = null;
    this._mapInstance = null;
    this._isReady = false;
    this._userLocation = null;
    this._selectedLocation = null;
    this._isReverseGeocoding = false;

    // Default options
    this.defaultZoom = options.defaultZoom ?? 15;
    this.animateTransitions = options.animateTransitions !== false;

    // Mobile-specific settings
    this._isMobile = window.innerWidth < 768;
    this._touchStartTime = 0;
    this._touchStartLocation = null;
    this._lastTouchEnd = 0;
    this._touchDebounceTime = 300; // ms

    // Store callbacks
    this.onReady = options.onReady;
    this.onLocationChange = options.onLocationChange;
    this.onError = options.onError;
    this.onMapClick = options.onMapClick;
    this.onLocationSelect = options.onLocationSelect;
    this.onReverseGeocodingStart = options.onReverseGeocodingStart;
    this.onReverseGeocodingEnd = options.onReverseGeocodingEnd;
    this.onSearchAddressUpdate = options.onSearchAddressUpdate;

    // Cache for map methods
    this._cachedSetView = null;
    this._cachedFlyTo = null;
    this._cachedPanTo = null;
    this._cachedGetZoom = null;

    // Reference to the map click handler to properly remove it later
    this._mapClickHandler = null;
    this._clickHandlerInitialized = false;

    // Add operation queue and state management
    this._operationQueue = [];
    this._isProcessingQueue = false;
    this._currentOperation = null;
    this._lastNavigationTime = 0;
    this._navigationDebounceTime = 300; // ms

    // Initialize error handling
    this._errorHandler = errorHandlingService;

    // Animation state
    this.isAnimating = false;

    // Add window resize handler for mobile detection
    this._handleResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._handleResize);

    // Register navigation-specific recovery strategies
    this._errorHandler.registerRecoveryStrategy('navigation', async (error: Error) => {
      // Try to clear the queue and retry the last operation
      this._clearQueue();
      if (this._currentOperation) {
        return this._processOperation(this._currentOperation);
      }
      return false;
    });

    // Log initialization
    Logger.info(this.TAG, 'Initialized with options:', options);
  }

  /**
   * Handle window resize events
   * @private
   */
  private _handleResize(): void {
    const newIsMobile = window.innerWidth < 768;
    if (newIsMobile !== this._isMobile) {
      this._isMobile = newIsMobile;
      Logger.debug(this.TAG, `Device type changed to ${newIsMobile ? 'mobile' : 'desktop'}`);

      // Update map settings for mobile
      if (this._mapInstance) {
        this._updateMapSettingsForDevice();
      }
    }
  }

  /**
   * Update map settings based on device type
   * @private
   */
  private _updateMapSettingsForDevice(): void {
    if (!this._mapInstance) return;

    // Adjust zoom control position for mobile
    if (this._mapInstance.zoomControl) {
      this._mapInstance.zoomControl.setPosition(this._isMobile ? 'bottomright' : 'topleft');
    }

    // Adjust attribution control position for mobile
    if (this._mapInstance.attributionControl) {
      this._mapInstance.attributionControl.setPosition(
        this._isMobile ? 'bottomleft' : 'bottomright'
      );
    }

    // Set appropriate zoom limits for mobile
    this._mapInstance.setMinZoom(this._isMobile ? 5 : 3);
    this._mapInstance.setMaxZoom(this._isMobile ? 18 : 20);
  }

  /**
   * Updates the map reference
   * @param {Map | { current: Map }} mapReference - Reference to the map instance or React ref
   * @returns {boolean} - Whether the update was successful
   */
  public updateMapReference(mapReference: Map | { current: Map }): boolean {
    const startTime = Date.now();
    Logger.info(this.TAG, 'Updating map reference');

    // Clean up previous click handler if it exists
    if (this._mapInstance && this._mapClickHandler) {
      Logger.debug(this.TAG, 'Cleaning up previous click handler');
      this._mapInstance.off('click', this._mapClickHandler);
      this._mapClickHandler = null;
    }

    // Handle both direct map instances and React ref objects
    // If it's a ref object (has a 'current' property), use the current value
    if (mapReference && typeof mapReference === 'object') {
      if ('current' in mapReference) {
        this._mapRef = mapReference.current;
      } else {
        this._mapRef = mapReference;
      }
    } else {
      this._mapRef = mapReference;
    }

    // Log map reference details for debugging
    if (this._mapRef) {
      Logger.debug(this.TAG, 'Map reference details:');
      Logger.debug(this.TAG, '- Type:', typeof this._mapRef);
      Logger.debug(this.TAG, '- Has getContainer?', !!this._mapRef.getContainer);

      // Check if it's a valid map by checking for essential methods
      const hasLatlng = !!this._mapRef.latLngToContainerPoint;
      const hasSetView = !!this._mapRef.setView;
      const hasAddHandler = !!this._mapRef.on;

      Logger.debug(this.TAG, '- Core methods present:', { hasLatlng, hasSetView, hasAddHandler });
    }

    // Try to extract the map instance
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

      // Set up map click handler
      this._setupMapClickHandler();

      // Mark the controller as ready
      this._isReady = true;

      // Call the ready callback if provided
      if (this.onReady && typeof this.onReady === 'function') {
        this.onReady(true);
      }
    } else {
      Logger.warn(this.TAG, 'Failed to update map reference - invalid map');
    }

    // Return whether we have a valid map instance
    return success && !!this._mapInstance;
  }

  /**
   * Set up the map click handler
   * @private
   */
  private _setupMapClickHandler(): void {
    const startTime = Date.now();

    if (!this._mapInstance) {
      Logger.warn(this.TAG, 'Cannot set up click handler - no map instance');
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', 0, {
        success: false,
        reason: 'noMapInstance',
      });
      return;
    }

    // Clean up previous handler if it exists
    if (this._mapClickHandler) {
      Logger.debug(this.TAG, 'Removing existing click handler');
      this._mapInstance.off('click', this._mapClickHandler);
      this._mapClickHandler = null;
    }

    // Only setup click handling if we have a callback to handle the selected location
    if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
      // Create a fresh handler with proper binding
      this._mapClickHandler = this._handleMapClick.bind(this);

      // Add the click handler to the map
      this._mapInstance.on('click', this._mapClickHandler);
      Logger.info(this.TAG, 'Map click handler set up successfully');

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', duration, {
        success: true,
        hasMapInstance: !!this._mapInstance,
        hasClickHandler: !!this._mapClickHandler,
        hasLocationSelectCallback: !!this.onLocationSelect,
      });
    } else {
      Logger.info(this.TAG, 'No location select callback provided, click handler not initialized');
      PerformanceMonitor.trackOperationTiming('map', 'mapClickHandlerSetup', 0, {
        success: false,
        reason: 'noLocationSelectCallback',
      });
    }
  }

  /**
   * Clear the operation queue
   * @private
   */
  private _clearQueue(): void {
    this._operationQueue = [];
    this._currentOperation = null;
    this._isProcessingQueue = false;
  }

  /**
   * Process a navigation operation
   * @private
   * @param {NavigationOperation} operation - The operation to process
   * @returns {Promise<boolean>} - Operation result
   */
  private async _processOperation(operation: INavigationOperation): Promise<boolean> {
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

    // Skip recentering for map clicks unless explicitly forced
    if (location._source === 'map' && !options.forceCenter) {
      Logger.debug(this.TAG, 'Skipping map centering for map click source', location);
      return true; // Return success without changing map view
    }

    return new Promise((resolve, reject) => {
      try {
        // Determine zoom level to use
        const zoomToUse = options.zoom ?? this._mapInstance.getZoom();

        // Adjust animation duration for mobile
        const duration = this._isMobile ? 1 : 1.5;
        const easeLinearity = this._isMobile ? 0.3 : 0.25;

        // Choose animation method based on options or defaults
        const method = options.method === 'flyTo' ? 'flyTo' : 'setView';

        if (method === 'flyTo' && typeof this._mapInstance.flyTo === 'function') {
          this._mapInstance.flyTo([location.lat, location.lng], zoomToUse, {
            animate: options.animate !== false,
            duration: options.duration ?? duration,
            easeLinearity,
            onEnd: () => {
              if (onEnd) onEnd();
              resolve(true);
            },
          });
        } else {
          this._mapInstance.setView([location.lat, location.lng], zoomToUse, {
            animate: options.animate !== false,
            duration: options.duration ?? duration,
            easeLinearity,
            onEnd: () => {
              if (onEnd) onEnd();
              resolve(true);
            },
          });
        }
      } catch (error) {
        Logger.error(this.TAG, 'Error during map view change:', error);
        reject(error);
      }
    });
  }

  /**
   * Extracts the actual map instance from the reference
   * @private
   * @returns {boolean} - Whether the extraction was successful
   */
  private _extractMapInstance(): boolean {
    if (!this._mapRef) {
      Logger.warn(this.TAG, 'Cannot extract map instance - mapRef is null');
      return false;
    }

    // Handle react-leaflet map instance
    if (this._mapRef && typeof this._mapRef === 'object') {
      // If it's a react-leaflet map instance, it should have these properties
      if ((this._mapRef as Map).getContainer && (this._mapRef as Map).latLngToContainerPoint) {
        this._mapInstance = this._mapRef as Map;
        Logger.debug(this.TAG, 'Valid Leaflet map instance extracted from react-leaflet');

        // Set up touch event handlers
        this._setupTouchHandlers();

        return true;
      }

      // If it's a ref object with current property
      if (
        (this._mapRef as { current: Map }).current.getContainer &&
        (this._mapRef as { current: Map }).current.latLngToContainerPoint
      ) {
        this._mapInstance = (this._mapRef as { current: Map }).current;
        Logger.debug(this.TAG, 'Valid Leaflet map instance extracted from ref.current');

        // Set up touch event handlers
        this._setupTouchHandlers();

        return true;
      }
    }

    Logger.warn(this.TAG, 'Invalid map reference - not a valid Leaflet map instance');
    return false;
  }

  /**
   * Handle map clicks with reverse geocoding
   * @private
   * @param {LeafletMouseEvent} e - Leaflet click event
   */
  private async _handleMapClick(e: LeafletMouseEvent): Promise<ILocation | null> {
    const startTime = Date.now();
    const { lat, lng } = e.latlng;
    Logger.debug(this.TAG, 'Map clicked at:', { lat, lng });

    // Call the raw map click callback if provided
    if (this.onMapClick && typeof this.onMapClick === 'function') {
      this.onMapClick(e);
    }

    // If we have a location select callback, handle the click
    if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
      try {
        // Create a location object with temporary data
        const tempLocation: ILocation = {
          lat: lat,
          lng: lng,
          lon: lng, // Add lon property for compatibility
          display_name: 'Finding location...',
          _source: 'map', // Add source to indicate this came from a map click
        };

        // First, update our internal selected location
        this.setSelectedLocation(tempLocation);

        // Call the location select callback with temporary data
        this.onLocationSelect(tempLocation);

        // Start reverse geocoding process
        if (this.onReverseGeocodingStart) {
          this.onReverseGeocodingStart();
        }

        try {
          // Perform reverse geocoding - pass 'map' as the source to preserve it
          const locationWithAddress = await this._handleReverseGeocoding(lat, lng, 'map');

          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('map', 'mapClick', duration, {
            success: true,
          });

          return locationWithAddress;
        } catch (error) {
          throw error; // Let the outer catch handle it
        } finally {
          // Notify that reverse geocoding is done
          if (this.onReverseGeocodingEnd) {
            this.onReverseGeocodingEnd();
          }
        }
      } catch (error) {
        Logger.error(this.TAG, 'Error handling map click:', error);

        // Create an error location
        const errorLocation: ILocation = {
          lat,
          lng,
          lon: lng, // Add lon property for compatibility
          display_name: 'Unable to find address',
          _source: 'map', // Add source to indicate this came from a map click
        };

        // Update our internal selected location
        this.setSelectedLocation(errorLocation);

        // Notify with the error location
        if (this.onLocationSelect) {
          this.onLocationSelect(errorLocation);
        }

        // Call error callback if provided
        if (this.onError) {
          this.onError(error as Error);
        }

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('map', 'mapClick', duration, {
          success: false,
          error: (error as Error).message,
        });

        return errorLocation;
      }
    }

    return null;
  }

  /**
   * Set up touch event handlers
   * @private
   */
  private _setupTouchHandlers(): void {
    if (!this._mapInstance) return;

    // Remove existing touch event handlers
    if (this._mapInstance.removeEventListener) {
      this._mapInstance.removeEventListener('touchstart', this._handleTouchStart);
      this._mapInstance.removeEventListener('touchend', this._handleTouchEnd);
    }

    // Add new touch event handlers
    if (this._mapInstance.addEventListener) {
      this._mapInstance.addEventListener('touchstart', this._handleTouchStart);
      this._mapInstance.addEventListener('touchend', this._handleTouchEnd);
    }
  }

  /**
   * Handle touch events for mobile devices
   * @private
   * @param {TouchEvent} event - Touch event
   */
  private _handleTouchStart(event: TouchEvent): void {
    if (event.touches.length > 1) return;

    this._touchStartTime = Date.now();
    this._touchStartLocation = {
      lat: event.touches[0].clientY,
      lng: event.touches[0].clientX,
      display_name: 'Touch Location',
    };
  }

  /**
   * Handle touch end events for mobile devices
   * @private
   * @param {TouchEvent} event - Touch event
   */
  private _handleTouchEnd(event: TouchEvent): void {
    if (event.touches.length > 1) return;

    const now = Date.now();
    if (now - this._lastTouchEnd <= this._touchDebounceTime) {
      event.preventDefault();
      return;
    }

    this._lastTouchEnd = now;

    // Calculate touch duration and distance
    const touchDuration = now - this._touchStartTime;
    const touchDistance = this._touchStartLocation
      ? Math.sqrt(
          Math.pow(event.changedTouches[0].clientY - this._touchStartLocation.lat, 2) +
            Math.pow(event.changedTouches[0].clientX - this._touchStartLocation.lng, 2)
        )
      : 0;

    // If it's a quick tap with minimal movement, treat it as a click
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

  /**
   * Handle location selection
   * @private
   * @param {LatLng} location - Selected location
   */
  private _handleLocationSelect(location: LatLng): void {
    if (this.onLocationSelect && typeof this.onLocationSelect === 'function') {
      this.onLocationSelect({
        lat: location.lat,
        lng: location.lng,
        display_name: 'Selected Location',
      });
    }
  }

  /**
   * Sets the user's current location
   * @param {Location} location - The user's location
   */
  public setUserLocation(location: ILocation): boolean {
    const normalizedLocation = this._normalizeLocation(location);

    if (!normalizedLocation) {
      Logger.warn(this.TAG, 'Invalid user location provided:', location);
      return false;
    }

    this._userLocation = normalizedLocation;
    Logger.debug(this.TAG, 'User location updated:', normalizedLocation);

    // Call the location change callback if provided
    if (this.onLocationChange && typeof this.onLocationChange === 'function') {
      this.onLocationChange(normalizedLocation);
    }

    return true;
  }

  /**
   * Sets the user's selected location
   * @param {Location} location - The selected location
   */
  public setSelectedLocation(location: ILocation): boolean {
    const normalizedLocation = this._normalizeLocation(location);

    if (!normalizedLocation) {
      Logger.warn(this.TAG, 'Invalid selected location provided:', location);
      return false;
    }

    this._selectedLocation = normalizedLocation;
    Logger.debug(this.TAG, 'Selected location updated:', normalizedLocation);

    return true;
  }

  /**
   * Handle reverse geocoding for a location
   * @private
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} source - Source of the location request, defaults to 'map'
   */
  private async _handleReverseGeocoding(
    lat: number,
    lng: number,
    source: string = 'map'
  ): Promise<ILocation> {
    try {
      // Fetch the actual address using reverse geocoding
      const results = await searchLocations(null, { lat, lng });

      if (results && results.length > 0) {
        const result = results[0];

        // Determine the best display name
        const displayName = this._determineDisplayName(result);

        // Update the search address field
        if (this.onSearchAddressUpdate) {
          this.onSearchAddressUpdate(displayName);
        }

        // Create the location with the display name and ensure consistent properties
        const locationWithAddress: ILocation = {
          ...result,
          lat,
          lng,
          lon: lng, // Ensure lon property is set for compatibility
          display_name: displayName,
          _source: source, // Preserve the source of the location request
        };

        // Update our internal selected location
        this.setSelectedLocation(locationWithAddress);

        // Notify with the location and display name
        if (this.onLocationSelect) {
          // Important: Pass the location with source to avoid map recentering
          this.onLocationSelect(locationWithAddress);
        }

        return locationWithAddress;
      }

      throw new Error('No results found');
    } catch (error) {
      Logger.error(this.TAG, 'Error reverse geocoding:', error);
      throw error;
    }
  }

  /**
   * Determine the best display name from geocoding result
   * @private
   * @param {Location} result - The geocoding result
   * @returns {string} The display name
   */
  private _determineDisplayName(result: ILocation): string {
    const startTime = Date.now();

    // By default, use the full address
    let displayName = result.display_name ?? '';

    // Try to find a place name to prioritize
    if (result.name) {
      // Direct name property - use this if available
      displayName = result.name;
    } else if (result.tags?.name) {
      // OSM tags may have a name
      displayName = result.tags.name;
    } else if (result.address) {
      const address = result.address;

      // Try to find the most specific name (from most to least specific)
      const placeName =
        (address.attraction ?? address.building) ||
        address.amenity ||
        address.leisure ||
        address.tourism ||
        address.shop ||
        address.historic ||
        address.natural ||
        address.office ||
        address.healthcare ||
        address.place_of_worship;

      // If a specific place name was found, use it
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

  /**
   * Validates that a location object has the correct format
   * @private
   * @param {Location} location - Location to validate
   * @returns {boolean} - Whether the location is valid
   */
  private _isValidLocation(location: ILocation): boolean {
    // Check that location has lat and lng properties that are numbers
    return (
      location &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      !isNaN(location.lat) &&
      !isNaN(location.lng)
    );
  }

  /**
   * Normalizes location objects to a consistent format
   * @param {Location} location - Location object with lat/lng or latitude/longitude
   * @returns {Location|null} - Normalized location with lat/lng or null if invalid
   * @private
   */
  private _normalizeLocation(location: ILocation | null): ILocation | null {
    if (!location) return null;

    // Already has lat/lng
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      return {
        lat: location.lat,
        lng: location.lng,
        // Preserve other properties
        ...location,
      };
    }

    // Has latitude/longitude
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      return {
        lat: location.latitude,
        lng: location.longitude,
        // Preserve other properties
        ...location,
      };
    }

    // Has array format [lat, lng]
    if (
      Array.isArray(location) &&
      location.length >= 2 &&
      typeof location[0] === 'number' &&
      typeof location[1] === 'number'
    ) {
      return {
        lat: location[0],
        lng: location[1],
        display_name: 'Array Location',
      };
    }

    Logger.warn(this.TAG, 'Invalid location format', location);
    return null;
  }

  /**
   * Queue and process a navigation operation
   * @private
   * @param {NavigationOperation} operation - Navigation operation
   * @returns {Promise<boolean>} - Operation result
   */
  private async _queueOperation(operation: INavigationOperation): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Add operation to queue
      this._operationQueue.push({
        ...operation,
        resolve,
        reject,
      });

      // Start processing if not already processing
      if (!this._isProcessingQueue) {
        this._processQueue();
      }
    });
  }

  /**
   * Process the operation queue
   * @private
   */
  private async _processQueue(): Promise<void> {
    if (this._isProcessingQueue || this._operationQueue.length === 0) {
      return;
    }

    this._isProcessingQueue = true;

    try {
      while (this._operationQueue.length > 0) {
        // Check debounce condition
        if (this._lastNavigationTime) {
          const timeSinceLastNav = Date.now() - this._lastNavigationTime;
          if (timeSinceLastNav < this._navigationDebounceTime) {
            await new Promise(resolve =>
              setTimeout(resolve, this._navigationDebounceTime - timeSinceLastNav)
            );
          }
        }

        const operation = this._operationQueue.shift();
        if (!operation) continue;

        this._currentOperation = operation;

        try {
          const result = await this._processOperation(operation);
          operation.resolve?.(result);
        } catch (error) {
          // Handle error with recovery attempt
          const recovered = await this._errorHandler.handleError(error as Error, 'navigation', {
            operation,
            queueLength: this._operationQueue.length,
          });

          if (recovered) {
            operation.resolve?.(recovered);
          } else {
            operation.reject?.(error);
          }
        }

        this._lastNavigationTime = Date.now();
        this._currentOperation = null;
      }
    } catch (error) {
      console.error('[MapNavigationController] Queue processing error:', error);
      this._errorHandler.handleError(error as Error, 'navigation', {
        queueLength: this._operationQueue.length,
      });
    } finally {
      this._isProcessingQueue = false;
    }
  }

  /**
   * Navigate to a specific location
   * @param {Location} location - Target location
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} Whether navigation was successful
   */
  public navigateTo(location: ILocation, options: INavigationOptions = {}): Promise<boolean> {
    Logger.debug(this.TAG, 'Navigating to:', location, 'with options:', options);

    // Normalize the location to ensure consistent format
    const normalizedLocation = this._normalizeLocation(location);

    if (!normalizedLocation) {
      Logger.warn(this.TAG, 'Invalid location for navigation:', location);
      return Promise.resolve(false);
    }

    // Skip map view change if this location came from a map click
    // This prevents the reverse geocoding result from re-centering the map
    if (normalizedLocation._source === 'map' && !options.forceCenter) {
      Logger.debug(this.TAG, 'Skip centering view for map click source:', normalizedLocation);
      return Promise.resolve(true);
    }

    // Construct a navigation operation
    const operation: INavigationOperation = {
      type: 'navigateTo',
      location: normalizedLocation,
      options: {
        // Default options
        zoom: (options.zoom ?? this._mapInstance?.getZoom()) || this.defaultZoom,
        animate: options.animate !== false && this.animateTransitions,
        method: options.method || 'flyTo', // 'flyTo', 'setView', etc.
        duration: options.duration || 1, // seconds
        ...(options || {}),
      },
    };

    // Queue the navigation operation
    return this._queueOperation(operation);
  }

  /**
   * Center on user's location
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} Whether centering was successful
   */
  public centerOnUser(options: INavigationOptions = {}): Promise<boolean> {
    if (!this._userLocation) {
      Logger.warn('MapNavigationController', 'No user location available');
      return Promise.resolve(false);
    }

    return this.navigateTo(this._userLocation, options);
  }

  /**
   * Dispose of the controller
   */
  public dispose(): void {
    const startTime = Date.now();

    this._clearQueue();

    // Remove map click handler if it exists
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

    // Remove window resize handler
    window.removeEventListener('resize', this._handleResize);

    // Clean up touch event handlers
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
