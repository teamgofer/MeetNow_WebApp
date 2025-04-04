import { CacheService } from '../features/proximity-chat/services/CacheService';
import { LocationUtils } from '../features/proximity-chat/utils/LocationUtils';
export class LocationHistoryService {
    constructor(options = {}) {
        this.entries = [];
        this.options = { ...LocationHistoryService.DEFAULT_OPTIONS, ...options };
        this.loadHistory();
    }
    addEntry(position) {
        if (!this.shouldAddEntry(position)) {
            return;
        }
        const entry = {
            position,
            timestamp: Date.now(),
            source: 'gps',
            accuracy: position.coords.accuracy,
        };
        this.entries.push(entry);
        this.cleanupOldEntries();
        this.saveHistory();
    }
    getEntries() {
        return [...this.entries].sort((a, b) => a.timestamp - b.timestamp);
    }
    getRecentEntries(count) {
        return this.getEntries().slice(-count);
    }
    getEntriesInRange(start, end) {
        return this.getEntries().filter(entry => entry.timestamp >= start && entry.timestamp <= end);
    }
    clear() {
        this.entries = [];
        this.saveHistory();
    }
    shouldAddEntry(position) {
        if (position.timestamp < Date.now() - this.options.maxAge) {
            return false;
        }
        if (this.entries.length > 0) {
            const lastEntry = this.entries[this.entries.length - 1];
            const distance = LocationUtils.calculateDistance(position.coords.latitude, position.coords.longitude, lastEntry.position.coords.latitude, lastEntry.position.coords.longitude);
            if (distance < this.options.minDistance) {
                return false;
            }
        }
        return true;
    }
    cleanupOldEntries() {
        const cutoff = Date.now() - this.options.maxAge;
        this.entries = this.entries.filter(entry => entry.timestamp >= cutoff);
        if (this.entries.length > this.options.maxEntries) {
            this.entries = this.entries.slice(-this.options.maxEntries);
        }
    }
    loadHistory() {
        const cached = CacheService.get(LocationHistoryService.CACHE_KEY);
        if (cached) {
            try {
                this.entries = JSON.parse(cached);
            }
            catch (error) {
                console.error('Failed to load location history:', error);
            }
        }
    }
    saveHistory() {
        try {
            CacheService.set(LocationHistoryService.CACHE_KEY, JSON.stringify(this.entries));
        }
        catch (error) {
            console.error('Failed to save location history:', error);
        }
    }
}
LocationHistoryService.CACHE_KEY = 'location_history';
LocationHistoryService.DEFAULT_OPTIONS = {
    maxEntries: 100,
    maxAge: 24 * 60 * 60 * 1000,
    minDistance: 10,
};
//# sourceMappingURL=LocationHistoryService.js.map