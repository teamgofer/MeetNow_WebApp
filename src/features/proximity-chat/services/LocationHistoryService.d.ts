import type { LocationHistoryEntry, LocationHistoryOptions } from '../types/geolocation';
export declare class LocationHistoryService {
    private static readonly CACHE_KEY;
    private static readonly DEFAULT_OPTIONS;
    private entries;
    private options;
    constructor(options?: Partial<LocationHistoryOptions>);
    addEntry(position: GeolocationPosition, source: 'gps' | 'network' | 'cached'): void;
    getEntries(startTime?: number, endTime?: number): LocationHistoryEntry[];
    clear(): void;
    getMostRecent(): LocationHistoryEntry | null;
    getRecentEntries(duration: number): LocationHistoryEntry[];
    getEntriesInRange(latitude: number, longitude: number, radius: number): LocationHistoryEntry[];
    private _shouldAddEntry;
    private _cleanup;
    private _loadHistory;
    private _saveHistory;
}
