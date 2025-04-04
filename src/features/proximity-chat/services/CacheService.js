import { CacheError } from '../types/errors';
export class CacheService {
    static get(key) {
        try {
            const entry = localStorage.getItem(this.PREFIX + key);
            if (!entry)
                return null;
            const cacheEntry = JSON.parse(entry);
            if (cacheEntry.ttl && Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
                this.remove(key);
                return null;
            }
            return cacheEntry.value;
        }
        catch (error) {
            console.error('Failed to get from cache:', error);
            return null;
        }
    }
    static set(key, value, ttl) {
        try {
            const entry = {
                value,
                timestamp: Date.now(),
                ttl,
            };
            let serialized = JSON.stringify(entry);
            if (serialized.length > this.COMPRESSION_THRESHOLD) {
                serialized = this.compress(serialized);
            }
            localStorage.setItem(this.PREFIX + key, serialized);
        }
        catch (error) {
            console.error('Failed to set cache:', error);
            throw new CacheError('Failed to set cache');
        }
    }
    static remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
        }
        catch (error) {
            console.error('Failed to remove from cache:', error);
            throw new CacheError('Failed to remove from cache');
        }
    }
    static clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.PREFIX))
                .forEach(key => localStorage.removeItem(key));
        }
        catch (error) {
            console.error('Failed to clear cache:', error);
            throw new CacheError('Failed to clear cache');
        }
    }
    static getKeys() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.PREFIX))
                .map(key => key.slice(this.PREFIX.length));
        }
        catch (error) {
            console.error('Failed to get cache keys:', error);
            return [];
        }
    }
    static compress(str) {
        return str.replace(/\s+/g, '');
    }
    static decompress(str) {
        return str;
    }
}
CacheService.PREFIX = 'meetnow_';
CacheService.COMPRESSION_THRESHOLD = 1024 * 1024;
//# sourceMappingURL=CacheService.js.map