/**
 * URL Caching System
 * Provides in-memory caching for pre-signed URLs with expiration handling
 */

interface CachedUrl {
  url: string;          // The signed URL
  expiry: number;       // Timestamp (ms) when URL expires
  createdAt: number;    // Timestamp (ms) when URL was cached
}

// In-memory cache storage
const urlCache: Record<string, CachedUrl> = {};

// Cache statistics for monitoring
const stats = {
  hits: 0,
  misses: 0,
  expired: 0
};

/**
 * Get a cached URL if available and not expired
 * @param path The storage path used as cache key
 * @returns The cached URL or null if not found/expired
 */
export const getCachedUrl = (path: string): string | null => {
  const cached = urlCache[path];
  
  // If not in cache
  if (!cached) {
    stats.misses++;
    return null;
  }
  
  // If expired
  if (cached.expiry < Date.now()) {
    stats.expired++;
    // Don't delete immediately to avoid thrashing if many components
    // request the same URL at almost the same time
    setTimeout(() => {
      delete urlCache[path];
    }, 100);
    return null;
  }
  
  // Cache hit
  stats.hits++;
  return cached.url;
};

/**
 * Store a URL in the cache with its expiration time
 * @param path The storage path to use as cache key
 * @param url The signed URL to cache
 * @param expiresIn Expiration time in seconds
 */
export const setCachedUrl = (
  path: string, 
  url: string, 
  expiresIn: number
): void => {
  // Add a 1 minute buffer before expiry to avoid edge cases
  const bufferMs = 60 * 1000; 
  
  urlCache[path] = {
    url,
    expiry: Date.now() + (expiresIn * 1000) - bufferMs,
    createdAt: Date.now()
  };
};

/**
 * Clear expired URLs from the cache
 */
export const cleanupExpiredUrls = (): void => {
  const now = Date.now();
  let cleaned = 0;
  
  Object.keys(urlCache).forEach(key => {
    const cachedItem = urlCache[key];
    if (cachedItem && cachedItem.expiry < now) {
      delete urlCache[key];
      cleaned++;
    }
  });
  
  console.log(`URL cache cleanup: removed ${cleaned} expired URLs`);
};

/**
 * Invalidate a specific URL or URLs matching a pattern
 * @param pathPattern Optional regex to match paths to invalidate
 */
export const invalidateCache = (pathPattern?: RegExp): void => {
  if (pathPattern) {
    Object.keys(urlCache).forEach(key => {
      if (pathPattern.test(key)) {
        delete urlCache[key];
      }
    });
  } else {
    // Clear entire cache
    Object.keys(urlCache).forEach(key => {
      delete urlCache[key];
    });
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): typeof stats => {
  return { ...stats };
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredUrls, 5 * 60 * 1000); 
 
 
 