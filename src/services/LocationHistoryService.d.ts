import type { GeolocationPosition, LocationHistoryEntry, LocationHistoryOptions } from '../features/proximity-chat/types/geolocation';
export declare class LocationHistoryService {
    private static readonly CACHE_KEY;
    private static readonly DEFAULT_OPTIONS;
    private entries;
    private options;
    constructor(options?: Partial<LocationHistoryOptions>);
    addEntry(position: GeolocationPosition): void;
    getEntries(): LocationHistoryEntry[];
    getRecentEntries(count: number): LocationHistoryEntry[];
    getEntriesInRange(start: number, end: number): LocationHistoryEntry[];
    clear(): void;
    private shouldAddEntry;
    private cleanupOldEntries;
    private loadHistory;
    private saveHistory;
}
