export declare class CacheService {
    private static readonly PREFIX;
    private static readonly COMPRESSION_THRESHOLD;
    static get<T>(key: string): T | null;
    static set<T>(key: string, value: T, ttl?: number): void;
    static remove(key: string): void;
    static clear(): void;
    static getKeys(): string[];
    private static compress;
    private static decompress;
}
