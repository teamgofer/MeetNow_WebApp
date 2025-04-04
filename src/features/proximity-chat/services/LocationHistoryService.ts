import { CacheService } from '../../../utils/CacheService';
import type { LocationHistoryEntry, LocationHistoryOptions } from '../types/geolocation';
import { LocationUtils } from '../utils/LocationUtils';

export class LocationHistoryService {
  private static readonly CACHE_KEY = 'locationHistory';
  private static readonly DEFAULT_OPTIONS: LocationHistoryOptions = {
    maxEntries: 100,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    minDistance: 10, // 10 meters
  };

  private entries: LocationHistoryEntry[] = [];
  private options: LocationHistoryOptions;

  constructor(options?: Partial<LocationHistoryOptions>) {
    this.options = { ...LocationHistoryService.DEFAULT_OPTIONS, ...options };
    this._loadHistory();
  }

  /**
   * Add a new location entry
   * @param position - Geolocation position
   * @param source - Source of the location data
   */
  public addEntry(position: GeolocationPosition, source: 'gps' | 'network' | 'cached'): void {
    const entry: LocationHistoryEntry = {
      position,
      timestamp: Date.now(),
      source,
      accuracy: position.coords.accuracy,
    };

    // Check if we should add this entry
    if (this._shouldAddEntry(entry)) {
      this.entries.push(entry);
      this._cleanup();
      this._saveHistory();
    }
  }

  /**
   * Get location history entries
   * @param startTime - Start time in milliseconds
   * @param endTime - End time in milliseconds
   * @returns Array of location history entries
   */
  public getEntries(startTime?: number, endTime?: number): LocationHistoryEntry[] {
    return this.entries.filter(entry => {
      if (startTime && entry.timestamp < startTime) return false;
      if (endTime && entry.timestamp > endTime) return false;
      return true;
    });
  }

  /**
   * Clear location history
   */
  public clear(): void {
    this.entries = [];
    this._saveHistory();
  }

  /**
   * Get the most recent entry
   * @returns Most recent location history entry or null
   */
  public getMostRecent(): LocationHistoryEntry | null {
    return this.entries[this.entries.length - 1] ?? null;
  }

  /**
   * Get entries within a time range
   * @param duration - Duration in milliseconds
   * @returns Array of location history entries
   */
  public getRecentEntries(duration: number): LocationHistoryEntry[] {
    const endTime = Date.now();
    const startTime = endTime - duration;
    return this.getEntries(startTime, endTime);
  }

  /**
   * Get entries within a distance range
   * @param latitude - Center latitude
   * @param longitude - Center longitude
   * @param radius - Radius in meters
   * @returns Array of location history entries
   */
  public getEntriesInRange(
    latitude: number,
    longitude: number,
    radius: number
  ): LocationHistoryEntry[] {
    return this.entries.filter(entry => {
      const distance = LocationUtils.calculateDistance(
        latitude,
        longitude,
        entry.position.coords.latitude,
        entry.position.coords.longitude
      );
      return distance <= radius;
    });
  }

  private _shouldAddEntry(entry: LocationHistoryEntry): boolean {
    // Check if we've exceeded max entries
    if (this.entries.length >= this.options.maxEntries) {
      return false;
    }

    // Check if entry is too old
    if (Date.now() - entry.timestamp > this.options.maxAge) {
      return false;
    }

    // Check if entry is too close to the last entry
    const lastEntry = this.getMostRecent();
    if (lastEntry) {
      const distance = LocationUtils.calculatePositionDistance(lastEntry.position, entry.position);
      if (distance < this.options.minDistance) {
        return false;
      }
    }

    return true;
  }

  private _cleanup(): void {
    const now = Date.now();

    // Remove old entries
    this.entries = this.entries.filter(entry => now - entry.timestamp <= this.options.maxAge);

    // Remove excess entries
    if (this.entries.length > this.options.maxEntries) {
      this.entries = this.entries.slice(-this.options.maxEntries);
    }
  }

  private _loadHistory(): void {
    try {
      const cached = CacheService.get<LocationHistoryEntry[]>(LocationHistoryService.CACHE_KEY);
      if (cached) {
        this.entries = cached;
        this._cleanup();
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  }

  private _saveHistory(): void {
    try {
      CacheService.set(LocationHistoryService.CACHE_KEY, this.entries);
    } catch (error) {
      console.error('Error saving location history:', error);
    }
  }
}
