import { CacheService } from '../../../utils/CacheService';
import { LocationUtils } from '../utils/LocationUtils';
export class LocationHistoryService {
    constructor(options) {
        this.entries = [];
        this.options = { ...LocationHistoryService.DEFAULT_OPTIONS, ...options };
        this._loadHistory();
    }
    addEntry(position, source) {
        const entry = {
            position,
            timestamp: Date.now(),
            source,
            accuracy: position.coords.accuracy,
        };
        if (this._shouldAddEntry(entry)) {
            this.entries.push(entry);
            this._cleanup();
            this._saveHistory();
        }
    }
    getEntries(startTime, endTime) {
        return this.entries.filter(entry => {
            if (startTime && entry.timestamp < startTime)
                return false;
            if (endTime && entry.timestamp > endTime)
                return false;
            return true;
        });
    }
    clear() {
        this.entries = [];
        this._saveHistory();
    }
    getMostRecent() {
        return this.entries[this.entries.length - 1] ?? null;
    }
    getRecentEntries(duration) {
        const endTime = Date.now();
        const startTime = endTime - duration;
        return this.getEntries(startTime, endTime);
    }
    getEntriesInRange(latitude, longitude, radius) {
        return this.entries.filter(entry => {
            const distance = LocationUtils.calculateDistance(latitude, longitude, entry.position.coords.latitude, entry.position.coords.longitude);
            return distance <= radius;
        });
    }
    _shouldAddEntry(entry) {
        if (this.entries.length >= this.options.maxEntries) {
            return false;
        }
        if (Date.now() - entry.timestamp > this.options.maxAge) {
            return false;
        }
        const lastEntry = this.getMostRecent();
        if (lastEntry) {
            const distance = LocationUtils.calculatePositionDistance(lastEntry.position, entry.position);
            if (distance < this.options.minDistance) {
                return false;
            }
        }
        return true;
    }
    _cleanup() {
        const now = Date.now();
        this.entries = this.entries.filter(entry => now - entry.timestamp <= this.options.maxAge);
        if (this.entries.length > this.options.maxEntries) {
            this.entries = this.entries.slice(-this.options.maxEntries);
        }
    }
    _loadHistory() {
        try {
            const cached = CacheService.get(LocationHistoryService.CACHE_KEY);
            if (cached) {
                this.entries = cached;
                this._cleanup();
            }
        }
        catch (error) {
            console.error('Error loading location history:', error);
        }
    }
    _saveHistory() {
        try {
            CacheService.set(LocationHistoryService.CACHE_KEY, this.entries);
        }
        catch (error) {
            console.error('Error saving location history:', error);
        }
    }
}
LocationHistoryService.CACHE_KEY = 'locationHistory';
LocationHistoryService.DEFAULT_OPTIONS = {
    maxEntries: 100,
    maxAge: 24 * 60 * 60 * 1000,
    minDistance: 10,
};
//# sourceMappingURL=LocationHistoryService.js.map