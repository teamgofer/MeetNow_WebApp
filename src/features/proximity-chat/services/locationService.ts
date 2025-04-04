import { EventEmitter } from '../../../features/utils/EventEmitter';
import { errorHandlingService } from '../../../utils/ErrorHandlingService';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor';
import { ERROR_MESSAGES, TIMING } from '../constants';
import {
  LocationError,
  GeolocationNotSupportedError,
  GeolocationPermissionDeniedError,
  GeolocationPositionUnavailableError,
  GeolocationTimeoutError,
  LocationTrackingError,
} from '../types/errors';
import type {
  GeolocationPosition,
  LocationOptions,
  LocationCallback,
  ErrorCallback,
  Geofence,
  LocationHistoryEntry,
} from '../types/geolocation';
import { LocationUtils } from '../utils/LocationUtils';

import { GeofenceService } from './GeofenceService';
import { LocationCacheService } from './LocationCacheService';
import { LocationHistoryService } from './LocationHistoryService';

/**
 * Service for handling location tracking and updates
 */
export class LocationService {
  private lastLocation: GeolocationPosition | null = null;
  private watchId: number | null = null;
  private minDistanceThreshold: number = 10; // meters

  // Event emitters with proper typing
  private readonly _locationEmitter: EventEmitter<GeolocationPosition>;
  private readonly _errorEmitter: EventEmitter<Error>;

  // State
  private _isTracking: boolean = false;
  private _retryCount: number = 0;
  private readonly _maxRetries: number = 3;

  // Enhanced options for location tracking
  private readonly _options: LocationOptions = {
    enableHighAccuracy: true,
    maximumAge: 300000, // 5 minutes
    timeout: 30000, // 30 seconds
  };

  // Initialize error handler
  private readonly _errorHandler: typeof errorHandlingService;

  // Initialize performance monitor
  private readonly _monitor: typeof PerformanceMonitor;

  // Initialize geofence and history services
  private readonly _geofenceService: GeofenceService;
  private readonly _historyService: LocationHistoryService;

  constructor(options?: Partial<LocationOptions>) {
    this._options = { ...this._options, ...options };
    this._locationEmitter = new EventEmitter<GeolocationPosition>();
    this._errorEmitter = new EventEmitter<Error>();
    this._monitor = PerformanceMonitor;
    this._errorHandler = errorHandlingService;
    this._retryCount = 0;
    this._isTracking = false;

    // Initialize geofence and history services
    this._geofenceService = new GeofenceService();
    this._historyService = new LocationHistoryService();

    // Register location-specific recovery strategy
    this._errorHandler.registerRecoveryStrategy(
      this._errorHandler.getErrorCategories().LOCATION,
      async (error: Error) => {
        // Try to get location from cache
        const cached = LocationCacheService.loadCachedLocation();
        if (cached.location) {
          return cached.location;
        }
        // Fall back to default location
        return this._getDefaultLocation();
      }
    );

    // Load cached location
    const cached = LocationCacheService.loadCachedLocation();
    if (cached.location) {
      this.lastLocation = cached.location;
    }

    // Bind methods
    this._handlePositionSuccess = this._handlePositionSuccess.bind(this);
    this._handlePositionError = this._handlePositionError.bind(this);
  }

  /**
   * Start tracking location
   * @returns Promise that resolves when tracking starts
   */
  public async startTracking(): Promise<void> {
    if (this._isTracking) {
      return;
    }

    const startTime = Date.now();
    try {
      if (!navigator.geolocation) {
        throw new GeolocationNotSupportedError();
      }

      this._isTracking = true;
      this._retryCount = 0;

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        this._handlePositionSuccess,
        this._handlePositionError,
        this._options
      );

      this._monitor.trackOperationTiming('location', 'startTracking', Date.now() - startTime);
    } catch (error) {
      this._monitor.trackOperationTiming('location', 'startTracking', Date.now() - startTime);
      this._handleError(error as Error);
      throw error;
    }
  }

  /**
   * Stop tracking location
   */
  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this._isTracking = false;
  }

  /**
   * Get current location
   * @returns Promise that resolves with the current location
   */
  public async getCurrentLocation(): Promise<GeolocationPosition> {
    const startTime = Date.now();
    try {
      // Try to get from cache first
      const cached = LocationCacheService.loadCachedLocation();
      if (cached.location && !this._isCacheExpired(cached)) {
        LocationCacheService.updateStats(true);
        this._monitor.trackOperationTiming(
          'location',
          'getCurrentLocation',
          Date.now() - startTime
        );
        return cached.location;
      }

      LocationCacheService.updateStats(false);

      // Get fresh location
      const position = await this._getFreshLocation();
      this._monitor.trackOperationTiming('location', 'getCurrentLocation', Date.now() - startTime);
      return position;
    } catch (error) {
      this._monitor.trackOperationTiming('location', 'getCurrentLocation', Date.now() - startTime);
      this._handleError(error as Error);
      throw error;
    }
  }

  /**
   * Register location change event handler
   * @param callback - Location change callback
   * @returns Function to remove the handler
   */
  public onLocationChange(callback: LocationCallback): () => void {
    return this._locationEmitter.on(callback);
  }

  /**
   * Unregister location change event handler
   * @param callback - Location change callback
   */
  public offLocationChange(callback: LocationCallback): void {
    this._locationEmitter.off(callback);
  }

  /**
   * Register error event handler
   * @param callback - Error callback
   * @returns Function to remove the handler
   */
  public onError(callback: ErrorCallback): () => void {
    return this._errorEmitter.on(callback);
  }

  /**
   * Unregister error event handler
   * @param callback - Error callback
   */
  public offError(callback: ErrorCallback): void {
    this._errorEmitter.off(callback);
  }

  /**
   * Handle successful position update
   * @private
   * @param position - Geolocation position
   */
  private _handlePositionSuccess(position: GeolocationPosition): void {
    try {
      LocationUtils.validatePosition(position);

      // Check if position has moved beyond threshold
      if (
        LocationUtils.hasMovedBeyondThreshold(
          this.lastLocation,
          position,
          this.minDistanceThreshold
        )
      ) {
        this.lastLocation = position;
        this._notifyLocation(position);
        LocationCacheService.saveToCache(position, 'gps');

        // Update geofences
        this._geofenceService.updateLocation(position.coords.latitude, position.coords.longitude);

        // Add to history
        this._historyService.addEntry(position, 'gps');
      }

      this._retryCount = 0;
    } catch (error) {
      this._handleError(error as Error);
    }
  }

  /**
   * Handle position error
   * @private
   * @param error - Geolocation position error
   */
  private _handlePositionError(error: GeolocationPositionError): void {
    let locationError: LocationError;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        locationError = new GeolocationPermissionDeniedError();
        break;
      case error.POSITION_UNAVAILABLE:
        locationError = new GeolocationPositionUnavailableError();
        break;
      case error.TIMEOUT:
        locationError = new GeolocationTimeoutError();
        break;
      default:
        locationError = new LocationError(error.message, 'UNKNOWN_ERROR');
    }

    this._handleError(locationError);
  }

  /**
   * Handle error
   * @private
   * @param error - Error to handle
   */
  private _handleError(error: Error): void {
    this._errorHandler.handleError(error);
    this._notifyError(error);

    if (this._retryCount < this._maxRetries) {
      this._retryCount++;
      this._retryTracking();
    } else {
      this.stopTracking();
    }
  }

  /**
   * Retry tracking
   * @private
   */
  private _retryTracking(): void {
    if (this._isTracking) {
      setTimeout(() => {
        if (this._isTracking) {
          this.startTracking();
        }
      }, 1000 * this._retryCount);
    }
  }

  /**
   * Get fresh location
   * @private
   * @returns Promise that resolves with the location
   */
  private _getFreshLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          try {
            LocationUtils.validatePosition(position);
            resolve(position);
          } catch (error) {
            reject(error);
          }
        },
        error => {
          reject(new LocationTrackingError(error.message, this._retryCount));
        },
        this._options
      );
    });
  }

  /**
   * Get default location
   * @private
   * @returns Default location
   */
  private _getDefaultLocation(): GeolocationPosition {
    const coords: GeolocationCoordinates = {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      }),
    };

    return {
      coords,
      timestamp: Date.now(),
      toJSON: () => ({
        coords,
        timestamp: Date.now(),
      }),
    };
  }

  /**
   * Check if cache is expired
   * @private
   * @param cache - Cache to check
   * @returns Whether the cache is expired
   */
  private _isCacheExpired(cache: { timestamp: number; maxAge: number }): boolean {
    return Date.now() - cache.timestamp > cache.maxAge;
  }

  /**
   * Notify location change listeners
   * @private
   * @param position - Geolocation position
   */
  private _notifyLocation(position: GeolocationPosition): void {
    this._locationEmitter.emit(position);
  }

  /**
   * Notify error listeners
   * @private
   * @param error - Error to notify
   */
  private _notifyError(error: Error): void {
    this._errorEmitter.emit(error);
  }

  /**
   * Get current speed in meters per second
   * @returns Current speed or null if not available
   */
  public getCurrentSpeed(): number | null {
    return this.lastLocation?.coords.speed ?? null;
  }

  /**
   * Get current heading in degrees from true north
   * @returns Current heading or null if not available
   */
  public getCurrentHeading(): number | null {
    return this.lastLocation?.coords.heading ?? null;
  }

  /**
   * Get current location accuracy in meters
   * @returns Current accuracy or null if not available
   */
  public getCurrentAccuracy(): number | null {
    return this.lastLocation?.coords.accuracy ?? null;
  }

  /**
   * Check if current location is likely indoors
   * @param threshold - Accuracy threshold in meters (default: 100)
   * @returns Whether location is likely indoors
   */
  public isIndoors(threshold: number = 100): boolean {
    const accuracy = this.getCurrentAccuracy();
    return accuracy !== null && accuracy > threshold;
  }

  /**
   * Get current altitude in meters
   * @returns Current altitude or null if not available
   */
  public getCurrentAltitude(): number | null {
    return this.lastLocation?.coords.altitude ?? null;
  }

  /**
   * Get current altitude accuracy in meters
   * @returns Current altitude accuracy or null if not available
   */
  public getCurrentAltitudeAccuracy(): number | null {
    return this.lastLocation?.coords.altitudeAccuracy ?? null;
  }

  /**
   * Add a new geofence
   * @param geofence - Geofence to add
   */
  public addGeofence(geofence: Geofence): void {
    this._geofenceService.addGeofence(geofence);
  }

  /**
   * Remove a geofence
   * @param id - ID of geofence to remove
   */
  public removeGeofence(id: string): void {
    this._geofenceService.removeGeofence(id);
  }

  /**
   * Get all active geofences
   * @returns Array of active geofences
   */
  public getActiveGeofences(): Geofence[] {
    return this._geofenceService.getActiveGeofences();
  }

  /**
   * Register geofence enter event handler
   * @param callback - Enter event callback
   * @returns Function to remove the handler
   */
  public onGeofenceEnter(callback: (geofence: Geofence) => void): () => void {
    return this._geofenceService.onEnter(callback);
  }

  /**
   * Register geofence exit event handler
   * @param callback - Exit event callback
   * @returns Function to remove the handler
   */
  public onGeofenceExit(callback: (geofence: Geofence) => void): () => void {
    return this._geofenceService.onExit(callback);
  }

  /**
   * Register geofence dwell event handler
   * @param callback - Dwell event callback
   * @returns Function to remove the handler
   */
  public onGeofenceDwell(
    callback: (data: { geofence: Geofence; duration: number }) => void
  ): () => void {
    return this._geofenceService.onDwell(callback);
  }

  /**
   * Get location history entries
   * @param startTime - Start time in milliseconds
   * @param endTime - End time in milliseconds
   * @returns Array of location history entries
   */
  public getLocationHistory(startTime?: number, endTime?: number): LocationHistoryEntry[] {
    return this._historyService.getEntries(startTime, endTime);
  }

  /**
   * Get recent location history entries
   * @param duration - Duration in milliseconds
   * @returns Array of location history entries
   */
  public getRecentHistory(duration: number): LocationHistoryEntry[] {
    return this._historyService.getRecentEntries(duration);
  }

  /**
   * Get location history entries within a range
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radius - Radius in meters
   * @returns Array of location history entries
   */
  public getHistoryInRange(
    latitude: number,
    longitude: number,
    radius: number
  ): LocationHistoryEntry[] {
    return this._historyService.getEntriesInRange(latitude, longitude, radius);
  }

  /**
   * Clear location history
   */
  public clearHistory(): void {
    this._historyService.clear();
  }
}
