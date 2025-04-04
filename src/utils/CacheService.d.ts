export declare class CacheService {
    private static _cache;
    static get<T>(key: string): T | null;
    static set<T>(key: string, value: T): void;
    static remove(key: string): void;
    static clear(): void;
    static has(key: string): boolean;
    static keys(): string[];
    static size(): number;
}
