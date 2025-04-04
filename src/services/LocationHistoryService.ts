import { CacheService } from '../features/proximity-chat/services/CacheService';
import type {
  GeolocationPosition,
  LocationHistoryEntry,
  LocationHistoryOptions,
} from '../features/proximity-chat/types/geolocation';
import { LocationUtils } from '../features/proximity-chat/utils/LocationUtils';

export class LocationHistoryService {
  private static readonly CACHE_KEY = 'location_history';
  private static readonly DEFAULT_OPTIONS: LocationHistoryOptions = {
    maxEntries: 100,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    minDistance: 10, // 10 meters
  };

  private entries: LocationHistoryEntry[] = [];
  private options: LocationHistoryOptions;

  constructor(options: Partial<LocationHistoryOptions> = {}) {
    this.options = { ...LocationHistoryService.DEFAULT_OPTIONS, ...options };
    this.loadHistory();
  }

  addEntry(position: GeolocationPosition): void {
    if (!this.shouldAddEntry(position)) {
      return;
    }

    const entry: LocationHistoryEntry = {
      position,
      timestamp: Date.now(),
      source: 'gps',
      accuracy: position.coords.accuracy,
    };

    this.entries.push(entry);
    this.cleanupOldEntries();
    this.saveHistory();
  }

  getEntries(): LocationHistoryEntry[] {
    return [...this.entries].sort((a, b) => a.timestamp - b.timestamp);
  }

  getRecentEntries(count: number): LocationHistoryEntry[] {
    return this.getEntries().slice(-count);
  }

  getEntriesInRange(start: number, end: number): LocationHistoryEntry[] {
    return this.getEntries().filter(entry => entry.timestamp >= start && entry.timestamp <= end);
  }

  clear(): void {
    this.entries = [];
    this.saveHistory();
  }

  private shouldAddEntry(position: GeolocationPosition): boolean {
    // Check if entry is too old
    if (position.timestamp < Date.now() - this.options.maxAge) {
      return false;
    }

    // Check if entry is too close to the last entry
    if (this.entries.length > 0) {
      const lastEntry = this.entries[this.entries.length - 1];
      const distance = LocationUtils.calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        lastEntry.position.coords.latitude,
        lastEntry.position.coords.longitude
      );
      if (distance < this.options.minDistance) {
        return false;
      }
    }

    return true;
  }

  private cleanupOldEntries(): void {
    const cutoff = Date.now() - this.options.maxAge;
    this.entries = this.entries.filter(entry => entry.timestamp >= cutoff);

    if (this.entries.length > this.options.maxEntries) {
      this.entries = this.entries.slice(-this.options.maxEntries);
    }
  }

  private loadHistory(): void {
    const cached = CacheService.get(LocationHistoryService.CACHE_KEY);
    if (cached) {
      try {
        this.entries = JSON.parse(cached);
      } catch (error) {
        console.error('Failed to load location history:', error);
      }
    }
  }

  private saveHistory(): void {
    try {
      CacheService.set(LocationHistoryService.CACHE_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.error('Failed to save location history:', error);
    }
  }
}
