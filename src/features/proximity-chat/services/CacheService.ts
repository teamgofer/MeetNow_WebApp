import { CacheError } from '../types/errors';

interface ICacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export class CacheService {
  private static readonly PREFIX = 'meetnow_';
  private static readonly COMPRESSION_THRESHOLD = 1024 * 1024; // 1MB

  static get<T>(key: string): T | null {
    try {
      const entry = localStorage.getItem(this.PREFIX + key);
      if (!entry) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(entry);

      // Check if entry has expired
      if (cacheEntry.ttl && Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
        this.remove(key);
        return null;
      }

      return cacheEntry.value;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  }

  static set<T>(key: string, value: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
      };

      let serialized = JSON.stringify(entry);

      // Compress if value is large
      if (serialized.length > this.COMPRESSION_THRESHOLD) {
        serialized = this.compress(serialized);
      }

      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw new CacheError('Failed to set cache');
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error('Failed to remove from cache:', error);
      throw new CacheError('Failed to remove from cache');
    }
  }

  static clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new CacheError('Failed to clear cache');
    }
  }

  static getKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .map(key => key.slice(this.PREFIX.length));
    } catch (error) {
      console.error('Failed to get cache keys:', error);
      return [];
    }
  }

  private static compress(str: string): string {
    // Simple compression for large strings
    return str.replace(/\s+/g, '');
  }

  private static decompress(str: string): string {
    // Simple decompression for large strings
    return str;
  }
}
