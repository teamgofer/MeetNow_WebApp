export class CacheService {
    static get(key) {
        const value = this._cache.get(key);
        return value ?? null;
    }
    static set(key, value) {
        this._cache.set(key, value);
    }
    static remove(key) {
        this._cache.delete(key);
    }
    static clear() {
        this._cache.clear();
    }
    static has(key) {
        return this._cache.has(key);
    }
    static keys() {
        return Array.from(this._cache.keys());
    }
    static size() {
        return this._cache.size;
    }
}
CacheService._cache = new Map();
//# sourceMappingURL=CacheService.js.map