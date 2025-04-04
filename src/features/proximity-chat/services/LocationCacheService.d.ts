import type { LocationCache, GeolocationPosition } from '../types/geolocation';
export declare class LocationCacheService {
    private static readonly CACHE_KEY;
    private static readonly DEFAULT_MAX_AGE;
    static loadCachedLocation(): LocationCache;
    static saveToCache(position: GeolocationPosition, source: 'gps' | 'network' | 'cached', maxAge?: number): void;
    static updateStats(hit: boolean): void;
    static clearCache(): void;
    private static _isCacheExpired;
    private static _createEmptyCache;
}
