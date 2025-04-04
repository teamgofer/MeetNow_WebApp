import type {
  GeolocationPosition,
  Geofence,
  LocationHistoryEntry,
} from '../features/proximity-chat/types/geolocation';
import { LocationHistoryOptions } from '../features/proximity-chat/types/geolocation';
import { errorHandlingService } from '../utils/ErrorHandlingService';

import { GeofenceService } from './GeofenceService';
import { LocationHistoryService } from './LocationHistoryService';

export class LocationService {
  private _errorHandler: typeof errorHandlingService;
  private _errorCategories: Record<string, string>;
  private _currentLocation: GeolocationPosition | null = null;
  private _locationWatchId: number | null = null;
  private _geofenceService: GeofenceService;
  private _historyService: LocationHistoryService;

  constructor() {
    this._errorHandler = errorHandlingService;
    this._errorCategories = this._errorHandler.getErrorCategories();
    this._geofenceService = new GeofenceService();
    this._historyService = new LocationHistoryService();
  }

  /**
   * Get current location
   * @returns Promise<GeolocationPosition>
   */
  async getCurrentLocation(): Promise<GeolocationPosition> {
    try {
      if (this._currentLocation) {
        return this._currentLocation;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      this._currentLocation = position;
      this._handlePositionSuccess(position);
      return position;
    } catch (error) {
      this._errorHandler.handleError(
        error instanceof Error ? error : new Error('Failed to get location'),
        this._errorCategories.LOCATION
      );
      throw error;
    }
  }

  /**
   * Start watching location
   * @param callback Function to call when location changes
   */
  startWatchingLocation(callback: (position: GeolocationPosition) => void): void {
    try {
      if (this._locationWatchId !== null) {
        return;
      }

      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      this._locationWatchId = navigator.geolocation.watchPosition(
        position => {
          this._currentLocation = position;
          this._handlePositionSuccess(position);
          callback(position);
        },
        error => {
          this._errorHandler.handleError(
            error instanceof Error ? error : new Error('Failed to watch location'),
            this._errorCategories.LOCATION
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      this._errorHandler.handleError(
        error instanceof Error ? error : new Error('Failed to start watching location'),
        this._errorCategories.LOCATION
      );
      throw error;
    }
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(): void {
    if (this._locationWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this._locationWatchId);
      this._locationWatchId = null;
    }
  }

  /**
   * Get current location coordinates
   * @returns Promise<{latitude: number; longitude: number}>
   */
  async getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
    const position = await this.getCurrentLocation();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  /**
   * Add a geofence
   * @param geofence The geofence to add
   */
  addGeofence(geofence: Geofence): void {
    this._geofenceService.addGeofence(geofence);
  }

  /**
   * Remove a geofence
   * @param id The ID of the geofence to remove
   */
  removeGeofence(id: string): void {
    this._geofenceService.removeGeofence(id);
  }

  /**
   * Get all active geofences
   * @returns Array of active geofences
   */
  getActiveGeofences(): Geofence[] {
    return this._geofenceService.getActiveGeofences();
  }

  /**
   * Check if a location is inside any geofence
   * @param position The position to check
   * @returns boolean indicating if the position is inside any geofence
   */
  isInsideAnyGeofence(position: GeolocationPosition): boolean {
    return this._geofenceService.isInsideAnyGeofence(position);
  }

  /**
   * Register a callback for when entering a geofence
   * @param callback The callback function
   */
  onGeofenceEnter(callback: (geofence: Geofence) => void): void {
    this._geofenceService.on('enter', callback);
  }

  /**
   * Register a callback for when exiting a geofence
   * @param callback The callback function
   */
  onGeofenceExit(callback: (geofence: Geofence) => void): void {
    this._geofenceService.on('exit', callback);
  }

  /**
   * Register a callback for when dwelling in a geofence
   * @param callback The callback function
   */
  onGeofenceDwell(callback: (geofence: Geofence, duration: number) => void): void {
    this._geofenceService.on('dwell', callback);
  }

  /**
   * Get location history entries
   * @returns Array of location history entries
   */
  getLocationHistory(): LocationHistoryEntry[] {
    return this._historyService.getEntries();
  }

  /**
   * Get recent location history entries
   * @param count Number of entries to return
   * @returns Array of recent location history entries
   */
  getRecentHistory(count: number): LocationHistoryEntry[] {
    return this._historyService.getRecentEntries(count);
  }

  /**
   * Get location history entries within a time range
   * @param start Start timestamp
   * @param end End timestamp
   * @returns Array of location history entries
   */
  getHistoryInRange(start: number, end: number): LocationHistoryEntry[] {
    return this._historyService.getEntriesInRange(start, end);
  }

  /**
   * Clear location history
   */
  clearHistory(): void {
    this._historyService.clear();
  }

  /**
   * Handle successful position updates
   * @param position The new position
   */
  private _handlePositionSuccess(position: GeolocationPosition): void {
    // Update geofences
    this._geofenceService.updateLocation(position);

    // Add to history
    this._historyService.addEntry(position);
  }
}
