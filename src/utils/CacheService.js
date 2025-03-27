/**
 * CacheService provides centralized caching functionality with persistence
 * and automatic cleanup. It supports different storage backends and TTLs.
 */

import { PerformanceMonitor } from './PerformanceMonitor.js';

class CacheService {
  constructor() {
    // Initialize performance monitor
    this._monitor = PerformanceMonitor;
    
    // In-memory cache
    this._memoryCache = new Map();
    
    // Cache configuration
    this._config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000, // Maximum number of items in memory cache
      cleanupInterval: 60 * 1000, // 1 minute
      persistToStorage: true, // Whether to persist to localStorage
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB max memory usage
      memoryWarningThreshold: 0.8 // 80% of max memory
    };
    
    // Memory tracking
    this._memoryUsage = 0;
    this._peakMemoryUsage = 0;
    
    // Start cleanup interval
    this._startCleanupInterval();
    
    // Load persisted cache if enabled
    if (this._config.persistToStorage) {
      this._loadPersistedCache();
    }
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} - Whether the operation was successful
   */
  set(key, value, ttl = this._config.defaultTTL) {
    const startTime = Date.now();
    try {
      const entry = {
        value,
        timestamp: Date.now(),
        ttl
      };
      
      // Estimate size before storing
      const size = this._estimateSize(entry);
      
      // Check memory usage and cleanup if needed
      if (this._memoryUsage + size > this._config.maxMemoryUsage) {
        this._cleanupMemory(size);
      }
      
      // Store in memory
      this._memoryCache.set(key, entry);
      this._memoryUsage += size;
      this._peakMemoryUsage = Math.max(this._peakMemoryUsage, this._memoryUsage);
      
      // Persist if enabled
      if (this._config.persistToStorage) {
        this._persistToStorage(key, entry);
      }
      
      // Track performance
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'set', duration, { 
        key, 
        size,
        memoryUsage: this._memoryUsage,
        peakMemoryUsage: this._peakMemoryUsage
      });
      this._monitor.trackCacheOperation('cache', 'set', false, size, { key });
      this._monitor.trackMemoryUsage('cache', 'set', size, { key });
      
      return true;
    } catch (error) {
      // Track error
      this._monitor.trackError('cache', 'set', error, { key });
      console.warn('[CacheService] Error setting cache:', error);
      return false;
    }
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const startTime = Date.now();
    try {
      // Try memory cache first
      const memoryEntry = this._memoryCache.get(key);
      if (memoryEntry && !this._isExpired(memoryEntry)) {
        const duration = Date.now() - startTime;
        const size = this._estimateSize(memoryEntry);
        this._monitor.trackOperationTiming('cache', 'get', duration, { 
          key, 
          size,
          source: 'memory'
        });
        this._monitor.trackCacheOperation('cache', 'get', true, size, { key });
        return memoryEntry.value;
      }
      
      // Try storage if enabled
      if (this._config.persistToStorage) {
        const storageEntry = this._getFromStorage(key);
        if (storageEntry && !this._isExpired(storageEntry)) {
          // Restore to memory cache
          const size = this._estimateSize(storageEntry);
          this._memoryCache.set(key, storageEntry);
          this._memoryUsage += size;
          
          const duration = Date.now() - startTime;
          this._monitor.trackOperationTiming('cache', 'get', duration, { 
            key, 
            size,
            source: 'storage'
          });
          this._monitor.trackCacheOperation('cache', 'get', true, size, { key });
          return storageEntry.value;
        }
      }
      
      // Track cache miss
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'get', duration, { 
        key,
        source: 'miss'
      });
      this._monitor.trackCacheOperation('cache', 'get', false, 0, { key });
      
      return null;
    } catch (error) {
      // Track error
      this._monitor.trackError('cache', 'get', error, { key });
      console.warn('[CacheService] Error getting from cache:', error);
      return null;
    }
  }
  
  /**
   * Remove a value from the cache
   * @param {string} key - Cache key
   * @returns {boolean} - Whether the operation was successful
   */
  remove(key) {
    const startTime = Date.now();
    try {
      // Get entry to calculate size reduction
      const entry = this._memoryCache.get(key);
      if (entry) {
        const size = this._estimateSize(entry);
        this._memoryUsage -= size;
      }
      
      // Remove from memory
      this._memoryCache.delete(key);
      
      // Remove from storage if enabled
      if (this._config.persistToStorage) {
        localStorage.removeItem(`cache_${key}`);
      }
      
      // Track performance
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'remove', duration, { 
        key,
        memoryUsage: this._memoryUsage
      });
      
      return true;
    } catch (error) {
      // Track error
      this._monitor.trackError('cache', 'remove', error, { key });
      console.warn('[CacheService] Error removing from cache:', error);
      return false;
    }
  }
  
  /**
   * Clear all cached values
   * @returns {boolean} - Whether the operation was successful
   */
  clear() {
    const startTime = Date.now();
    try {
      // Clear memory cache
      this._memoryCache.clear();
      this._memoryUsage = 0;
      
      // Clear storage if enabled
      if (this._config.persistToStorage) {
        this._clearStorage();
      }
      
      // Track performance
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'clear', duration, {
        memoryUsage: this._memoryUsage
      });
      
      return true;
    } catch (error) {
      // Track error
      this._monitor.trackError('cache', 'clear', error);
      console.warn('[CacheService] Error clearing cache:', error);
      return false;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {boolean} - Whether the key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const stats = {
      size: this._memoryCache.size,
      maxSize: this._config.maxSize,
      defaultTTL: this._config.defaultTTL,
      persistToStorage: this._config.persistToStorage,
      memoryUsage: this._memoryUsage,
      peakMemoryUsage: this._peakMemoryUsage
    };
    
    // Add performance metrics
    const metrics = this._monitor.getMetrics('cache');
    stats.performance = {
      operations: metrics.operationTimings || {},
      cacheStats: metrics.cacheStats || {},
      errors: metrics.errors || {},
      memoryUsage: metrics.memoryUsage || {}
    };
    
    return stats;
  }
  
  /**
   * Start the cleanup interval
   * @private
   */
  _startCleanupInterval() {
    setInterval(() => {
      this._cleanup();
    }, this._config.cleanupInterval);
  }
  
  /**
   * Clean up expired entries
   * @private
   */
  _cleanup() {
    try {
      // Clean memory cache
      for (const [key, entry] of this._memoryCache.entries()) {
        if (this._isExpired(entry)) {
          this._memoryCache.delete(key);
        }
      }
      
      // Clean storage if enabled
      if (this._config.persistToStorage) {
        this._cleanupStorage();
      }
    } catch (error) {
      console.warn('[CacheService] Error during cleanup:', error);
    }
  }
  
  /**
   * Check if cache needs cleanup
   * @private
   * @returns {boolean} - Whether cleanup is needed
   */
  _cleanupIfNeeded() {
    return this._memoryCache.size >= this._config.maxSize;
  }
  
  /**
   * Check if a cache entry is expired
   * @private
   * @param {Object} entry - Cache entry
   * @returns {boolean} - Whether the entry is expired
   */
  _isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  /**
   * Load persisted cache from storage
   * @private
   */
  _loadPersistedCache() {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const entry = this._getFromStorage(key);
          if (entry && !this._isExpired(entry)) {
            this._memoryCache.set(key.slice(6), entry);
          } else {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[CacheService] Error loading persisted cache:', error);
    }
  }
  
  /**
   * Get entry from storage
   * @private
   * @param {string} key - Cache key
   * @returns {Object|null} - Cache entry or null
   */
  _getFromStorage(key) {
    try {
      const data = localStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[CacheService] Error getting from storage:', error);
      return null;
    }
  }
  
  /**
   * Persist entry to storage
   * @private
   * @param {string} key - Cache key
   * @param {Object} entry - Cache entry
   */
  _persistToStorage(key, entry) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('[CacheService] Error persisting to storage:', error);
    }
  }
  
  /**
   * Clean up storage
   * @private
   */
  _cleanupStorage() {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const entry = this._getFromStorage(key);
          if (entry && this._isExpired(entry)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[CacheService] Error cleaning up storage:', error);
    }
  }
  
  /**
   * Clear storage
   * @private
   */
  _clearStorage() {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('[CacheService] Error clearing storage:', error);
    }
  }
  
  /**
   * Estimate size of a value in bytes
   * @private
   * @param {any} value - Value to estimate size of
   * @returns {number} - Estimated size in bytes
   */
  _estimateSize(value) {
    try {
      return new TextEncoder().encode(JSON.stringify(value)).length;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Clean up memory to make space for new entry
   * @param {number} requiredSize - Size needed for new entry
   * @private
   */
  _cleanupMemory(requiredSize) {
    const startTime = Date.now();
    try {
      // Calculate target memory usage (80% of max)
      const targetMemoryUsage = this._config.maxMemoryUsage * this._config.memoryWarningThreshold;
      
      // Remove entries until we have enough space
      while (this._memoryUsage + requiredSize > targetMemoryUsage) {
        const oldestKey = this._getOldestKey();
        if (!oldestKey) break;
        
        const entry = this._memoryCache.get(oldestKey);
        if (entry) {
          const size = this._estimateSize(entry);
          this._memoryUsage -= size;
        }
        this._memoryCache.delete(oldestKey);
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'cleanup', duration, {
        requiredSize,
        newMemoryUsage: this._memoryUsage,
        entriesCleared: this._memoryCache.size
      });
    } catch (error) {
      this._monitor.trackError('cache', 'cleanup', error);
      console.warn('[CacheService] Error during memory cleanup:', error);
    }
  }
  
  /**
   * Get the oldest cache key
   * @returns {string|null} - Oldest cache key or null if cache is empty
   * @private
   */
  _getOldestKey() {
    let oldestKey = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this._memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
}

// Export as singleton
const cacheService = new CacheService();
export { cacheService as CacheService };
export default cacheService; 