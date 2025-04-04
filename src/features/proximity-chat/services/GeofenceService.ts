import { EventEmitter } from 'events';

import type { Geofence } from '../types/geofence';
import { LocationUtils } from '../utils/LocationUtils';

interface IGeofenceEventMap {
  enter: { geofence: Geofence };
  exit: { geofence: Geofence };
  dwell: { geofence: Geofence; duration: number };
}

/**
 * Service for managing geofences
 */
export class GeofenceService extends EventEmitter {
  private geofences: Map<string, Geofence> = new Map();
  private activeGeofences: Set<string> = new Set();
  private dwellStartTimes: Map<string, number> = new Map();

  /**
   * Add a new geofence
   * @param geofence - Geofence to add
   */
  public addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
  }

  /**
   * Remove a geofence
   * @param id - ID of geofence to remove
   */
  public removeGeofence(id: string): void {
    this.geofences.delete(id);
    this.activeGeofences.delete(id);
    this.dwellStartTimes.delete(id);
  }

  /**
   * Update location and check geofence status
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   */
  public updateLocation(latitude: number, longitude: number): void {
    for (const geofence of this.geofences.values()) {
      const distance = LocationUtils.calculateDistance(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude
      );

      if (distance <= geofence.radius) {
        this._handleEnter(geofence);
      } else {
        this._handleExit(geofence);
      }
    }
  }

  /**
   * Get all active geofences
   * @returns Array of active geofences
   */
  public getActiveGeofences(): Geofence[] {
    return Array.from(this.activeGeofences).map(id => this.geofences.get(id)!);
  }

  /**
   * Check if location is inside any geofence
   * @param latitude - Latitude to check
   * @param longitude - Longitude to check
   * @returns True if inside any geofence
   */
  public isInsideAnyGeofence(latitude: number, longitude: number): boolean {
    for (const geofence of this.geofences.values()) {
      const distance = LocationUtils.calculateDistance(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude
      );

      if (distance <= geofence.radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Register enter event handler
   * @param callback - Enter event callback
   * @returns Function to remove the handler
   */
  public onEnter(callback: (data: { geofence: Geofence }) => void): () => void {
    this.on('enter', callback);
    return () => this.off('enter', callback);
  }

  /**
   * Register exit event handler
   * @param callback - Exit event callback
   * @returns Function to remove the handler
   */
  public onExit(callback: (data: { geofence: Geofence }) => void): () => void {
    this.on('exit', callback);
    return () => this.off('exit', callback);
  }

  /**
   * Register dwell event handler
   * @param callback - Dwell event callback
   * @returns Function to remove the handler
   */
  public onDwell(callback: (data: { geofence: Geofence; duration: number }) => void): () => void {
    this.on('dwell', callback);
    return () => this.off('dwell', callback);
  }

  private _handleEnter(geofence: Geofence): void {
    if (!this.activeGeofences.has(geofence.id)) {
      this.activeGeofences.add(geofence.id);
      this.dwellStartTimes.set(geofence.id, Date.now());
      this.emit('enter', { geofence });
      geofence.onEnter?.();
    }
  }

  private _handleExit(geofence: Geofence): void {
    if (this.activeGeofences.has(geofence.id)) {
      const startTime = this.dwellStartTimes.get(geofence.id);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.emit('dwell', { geofence, duration });
        geofence.onDwell?.(duration);
      }
      this.activeGeofences.delete(geofence.id);
      this.dwellStartTimes.delete(geofence.id);
      this.emit('exit', { geofence });
      geofence.onExit?.();
    }
  }

  // Type-safe event emitter methods
  on<K extends keyof GeofenceEventMap>(
    event: K,
    listener: (data: GeofenceEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof GeofenceEventMap>(event: K, data: GeofenceEventMap[K]): boolean {
    return super.emit(event, data);
  }
}
