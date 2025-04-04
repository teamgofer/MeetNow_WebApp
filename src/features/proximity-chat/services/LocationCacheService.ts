import { CacheService } from '../../../utils/CacheService';
import { LocationCacheError } from '../types/errors';
import type { LocationCache, GeolocationPosition } from '../types/geolocation';
import { LocationUtils } from '../utils/LocationUtils';

/**
 * Service for handling location caching
 */
export class LocationCacheService {
  private static readonly CACHE_KEY = 'locationCache';
  private static readonly DEFAULT_MAX_AGE = 300000; // 5 minutes

  /**
   * Load cached location
   * @returns Cached location or null if not found or expired
   */
  public static loadCachedLocation(): LocationCache {
    try {
      const cached = CacheService.get(this.CACHE_KEY);
      if (!cached) {
        return this._createEmptyCache();
      }

      if (this._isCacheExpired(cached)) {
        return this._createEmptyCache();
      }

      return cached;
    } catch (error) {
      console.error('Error loading cached location:', error);
      return this._createEmptyCache();
    }
  }

  /**
   * Save location to cache
   * @param position - Position to cache
   * @param source - Source of the location
   * @param maxAge - Maximum age of the cache in milliseconds
   */
  public static saveToCache(
    position: GeolocationPosition,
    source: 'gps' | 'network' | 'cached',
    maxAge: number = this.DEFAULT_MAX_AGE
  ): void {
    try {
      LocationUtils.validatePosition(position);

      const cache: LocationCache = {
        timestamp: Date.now(),
        location: position,
        maxAge,
        accuracy: position.coords.accuracy,
        source,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: Date.now(),
        },
      };

      CacheService.set(this.CACHE_KEY, cache);
    } catch (error) {
      console.error('Error saving location to cache:', error);
      throw new LocationCacheError('Failed to save location to cache');
    }
  }

  /**
   * Update cache statistics
   * @param hit - Whether the cache was a hit
   */
  public static updateStats(hit: boolean): void {
    try {
      const cache = this.loadCachedLocation();
      if (hit) {
        cache.stats.hits++;
      } else {
        cache.stats.misses++;
      }
      cache.stats.lastUpdated = Date.now();
      CacheService.set(this.CACHE_KEY, cache);
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }

  /**
   * Clear the location cache
   */
  public static clearCache(): void {
    try {
      CacheService.remove(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing location cache:', error);
      throw new LocationCacheError('Failed to clear location cache');
    }
  }

  /**
   * Check if cache is expired
   * @private
   * @param cache - Cache to check
   * @returns Whether the cache is expired
   */
  private static _isCacheExpired(cache: LocationCache): boolean {
    return Date.now() - cache.timestamp > cache.maxAge;
  }

  /**
   * Create an empty cache object
   * @private
   * @returns Empty cache object
   */
  private static _createEmptyCache(): LocationCache {
    return {
      timestamp: 0,
      location: null,
      maxAge: this.DEFAULT_MAX_AGE,
      accuracy: null,
      source: null,
      stats: {
        hits: 0,
        misses: 0,
        lastUpdated: 0,
      },
    };
  }
}
