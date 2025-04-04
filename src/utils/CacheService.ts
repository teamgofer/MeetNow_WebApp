/**
 * Service for handling cached data
 */
export class CacheService {
  private static _cache: Map<string, unknown> = new Map();

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  public static get<T>(key: string): T | null {
    const value = this._cache.get(key);
    return (value as T) ?? null;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   */
  public static set<T>(key: string, value: T): void {
    this._cache.set(key, value);
  }

  /**
   * Remove a value from cache
   * @param key - Cache key
   */
  public static remove(key: string): void {
    this._cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  public static clear(): void {
    this._cache.clear();
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns Whether the key exists
   */
  public static has(key: string): boolean {
    return this._cache.has(key);
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  public static keys(): string[] {
    return Array.from(this._cache.keys());
  }

  /**
   * Get cache size
   * @returns Number of items in cache
   */
  public static size(): number {
    return this._cache.size;
  }
}
