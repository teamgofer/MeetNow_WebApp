import { CacheService } from '../../../utils/CacheService';
import { LocationCacheError } from '../types/errors';
import { LocationUtils } from '../utils/LocationUtils';
export class LocationCacheService {
    static loadCachedLocation() {
        try {
            const cached = CacheService.get(this.CACHE_KEY);
            if (!cached) {
                return this._createEmptyCache();
            }
            if (this._isCacheExpired(cached)) {
                return this._createEmptyCache();
            }
            return cached;
        }
        catch (error) {
            console.error('Error loading cached location:', error);
            return this._createEmptyCache();
        }
    }
    static saveToCache(position, source, maxAge = this.DEFAULT_MAX_AGE) {
        try {
            LocationUtils.validatePosition(position);
            const cache = {
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
        }
        catch (error) {
            console.error('Error saving location to cache:', error);
            throw new LocationCacheError('Failed to save location to cache');
        }
    }
    static updateStats(hit) {
        try {
            const cache = this.loadCachedLocation();
            if (hit) {
                cache.stats.hits++;
            }
            else {
                cache.stats.misses++;
            }
            cache.stats.lastUpdated = Date.now();
            CacheService.set(this.CACHE_KEY, cache);
        }
        catch (error) {
            console.error('Error updating cache stats:', error);
        }
    }
    static clearCache() {
        try {
            CacheService.remove(this.CACHE_KEY);
        }
        catch (error) {
            console.error('Error clearing location cache:', error);
            throw new LocationCacheError('Failed to clear location cache');
        }
    }
    static _isCacheExpired(cache) {
        return Date.now() - cache.timestamp > cache.maxAge;
    }
    static _createEmptyCache() {
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
LocationCacheService.CACHE_KEY = 'locationCache';
LocationCacheService.DEFAULT_MAX_AGE = 300000;
//# sourceMappingURL=LocationCacheService.js.map