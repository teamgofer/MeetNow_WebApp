import { EventEmitter } from '../../utils/EventEmitter';
import { ERROR_MESSAGES, TIMING } from '../constants';
import { ErrorHandlingService } from '../../../utils/ErrorHandlingService.js';
import { CacheService } from '../../../utils/CacheService.js';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * LocationService handles geolocation functionality for the proximity chat feature
 * It provides methods for getting the user's location and calculating distances
 */
class LocationService {
  constructor() {
    this.lastLocation = null;
    this.watchId = null;
    this.locationListeners = [];
    this.errorListeners = [];
    this.minDistanceThreshold = 10; // meters
    
    // Enhanced location cache with persistence
    this.locationCache = {
      timestamp: 0,
      location: null,
      maxAge: 300000, // 5 minutes
      accuracy: null,
      source: null, // 'gps', 'network', 'cached'
      stats: {
        hits: 0,
        misses: 0,
        lastUpdated: 0
      }
    };

    // Load cached location from localStorage
    this._loadCachedLocation();

    // Event emitters
    this._locationEmitter = new EventEmitter();
    this._errorEmitter = new EventEmitter();
    
    // State
    this._isTracking = false;
    this._retryCount = 0;
    this._maxRetries = 3;
    
    // Enhanced options for location tracking
    this._options = {
      enableHighAccuracy: true,
      maximumAge: 300000,  // 5 minutes
      timeout: 30000,      // 30 seconds
    };
    
    // Bind methods
    this._handlePositionSuccess = this._handlePositionSuccess.bind(this);
    this._handlePositionError = this._handlePositionError.bind(this);

    // Initialize error handler
    this._errorHandler = ErrorHandlingService;
    
    // Initialize cache service
    this._cache = CacheService;
    
    // Register location-specific recovery strategy
    this._errorHandler.registerRecoveryStrategy(
      this._errorHandler._errorCategories.LOCATION,
      async (error) => {
        // Try to get location from cache
        const cachedLocation = this._cache.get('lastKnownLocation');
        if (cachedLocation) {
          return cachedLocation;
        }
        // Fall back to default location
        return {
          latitude: 34.052235,
          longitude: -118.243683
        };
      }
    );

    // Initialize performance monitor
    this._monitor = PerformanceMonitor;
  }

  /**
   * Load cached location from localStorage
   * @private
   */
  _loadCachedLocation() {
    try {
      const cached = localStorage.getItem('locationCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if it's still valid
        if (this._isCacheValid(parsed)) {
          this.locationCache = parsed;
          this.lastLocation = parsed.location;
          console.log('[LocationService] Loaded valid cached location:', parsed.location);
        } else {
          console.log('[LocationService] Cached location expired');
          localStorage.removeItem('locationCache');
        }
      }
    } catch (error) {
      console.warn('[LocationService] Error loading cached location:', error);
    }
  }

  /**
   * Save location to localStorage
   * @private
   * @param {Object} location - Location data
   * @param {number} accuracy - Location accuracy
   * @param {string} source - Location source
   */
  _saveToCache(location, accuracy, source) {
    const startTime = Date.now();
    try {
      const cacheData = {
        timestamp: Date.now(),
        location,
        maxAge: this._options.maximumAge,
        accuracy,
        source,
        stats: this.locationCache.stats
      };
      
      // Save to CacheService with 5 minute TTL
      this._cache.set('lastKnownLocation', cacheData, 5 * 60 * 1000);
      
      // Update local cache
      this.locationCache = cacheData;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('location', 'saveToCache', duration, {
        success: true,
        source,
        accuracy,
        cacheSize: JSON.stringify(cacheData).length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('location', 'saveToCache', error);
      this._monitor.trackOperationTiming('location', 'saveToCache', duration, {
        success: false,
        source,
        error: error.message
      });
      console.warn('[LocationService] Error saving to cache:', error);
      this._errorHandler.handleError(error, this._errorHandler._errorCategories.STORAGE);
    }
  }

  /**
   * Check if cache is valid
   * @private
   * @param {Object} cache - Cache data to validate
   * @returns {boolean} - Whether cache is valid
   */
  _isCacheValid(cache) {
    if (!cache || !cache.location || !cache.timestamp) return false;
    
    const age = Date.now() - cache.timestamp;
    return age < cache.maxAge;
  }

  /**
   * Update cache statistics
   * @private
   * @param {boolean} hit - Whether this was a cache hit
   */
  _updateCacheStats(hit) {
    if (hit) {
      this.locationCache.stats.hits++;
    } else {
      this.locationCache.stats.misses++;
    }
    this.locationCache.stats.lastUpdated = Date.now();
  }

  /**
   * Clean up old cache entries
   * @private
   */
  _cleanupCache() {
    try {
      if (!this._isCacheValid(this.locationCache)) {
        localStorage.removeItem('locationCache');
        this.locationCache = {
          timestamp: 0,
          location: null,
          maxAge: this._options.maximumAge,
          accuracy: null,
          source: null,
          stats: {
            hits: 0,
            misses: 0,
            lastUpdated: 0
          }
        };
      }
    } catch (error) {
      console.warn('[LocationService] Error cleaning up cache:', error);
    }
  }

  /**
   * Start tracking the user's location with retry logic
   * @returns {Promise<Object>} - Current location
   */
  async startTracking() {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser');
        this._monitor.trackError('location', 'startTracking', error);
        this._errorHandler.handleError(error, 'location', { action: 'startTracking' })
          .then(recovered => {
            if (recovered) {
              const duration = Date.now() - startTime;
              this._monitor.trackOperationTiming('location', 'startTracking', duration, {
                source: 'fallback',
                success: true
              });
              resolve(recovered);
            } else {
              const duration = Date.now() - startTime;
              this._monitor.trackOperationTiming('location', 'startTracking', duration, {
                source: 'fallback',
                success: false
              });
              reject(error);
            }
          })
          .catch(recoveryError => {
            console.error('[LocationService] Recovery attempt failed:', recoveryError);
        reject(error);
          });
        return;
      }
      
      // First try to get current position with retry logic
      this._getCurrentPositionWithRetry()
        .then((position) => {
          const location = this._formatPosition(position);
          this.lastLocation = location;
          this._isTracking = true;
          this._retryCount = 0; // Reset retry count on success
          
          // Then start watching position with enhanced options
          this.watchId = navigator.geolocation.watchPosition(
            this._handlePositionSuccess,
            this._handlePositionError,
            this._options
          );
          
          const duration = Date.now() - startTime;
          this._monitor.trackOperationTiming('location', 'startTracking', duration, {
            source: 'gps',
            success: true,
            accuracy: position.coords.accuracy
          });
          
          resolve(location);
        })
        .catch((error) => {
          const duration = Date.now() - startTime;
          this._monitor.trackError('location', 'startTracking', error);
          this._monitor.trackOperationTiming('location', 'startTracking', duration, {
            source: 'gps',
            success: false,
            retryCount: this._retryCount
          });
          
          this._errorHandler.handleError(error, 'location', { action: 'startTracking' })
            .then(recovered => {
              if (recovered) {
                resolve(recovered);
              } else {
                reject(error);
              }
            })
            .catch(recoveryError => {
              console.error('[LocationService] Recovery attempt failed:', recoveryError);
              reject(error);
            });
        });
    });
  }

  /**
   * Get current position with retry logic
   * @private
   * @returns {Promise<Position>} - Geolocation position
   */
  _getCurrentPositionWithRetry() {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const attempt = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this._retryCount = 0; // Reset retry count on success
            const duration = Date.now() - startTime;
            this._monitor.trackOperationTiming('location', 'getCurrentPosition', duration, {
              source: 'gps',
              success: true,
              accuracy: position.coords.accuracy,
              retryCount: this._retryCount
            });
            resolve(position);
        },
        (error) => {
            if (this._retryCount < this._maxRetries) {
              this._retryCount++;
              const delay = Math.min(1000 * Math.pow(2, this._retryCount), 10000); // Exponential backoff, max 10s
              setTimeout(attempt, delay);
            } else {
              const duration = Date.now() - startTime;
              this._monitor.trackError('location', 'getCurrentPosition', error);
              this._monitor.trackOperationTiming('location', 'getCurrentPosition', duration, {
                source: 'gps',
                success: false,
                retryCount: this._retryCount
              });
          reject(error);
            }
        },
        this._options
        );
      };
      
      attempt();
    });
  }

  /**
   * Handle position success with enhanced caching
   * @private
   * @param {Position} position - Geolocation position
   */
  _handlePositionSuccess(position) {
    const startTime = Date.now();
    const location = this._formatPosition(position);
    const source = position.coords.altitude ? 'gps' : 'network';
    
    // Update cache with new location
    this._saveToCache(location, position.coords.accuracy, source);
    
    // Update last location
    this.lastLocation = location;
    
    // Track performance
    const duration = Date.now() - startTime;
    this._monitor.trackOperationTiming('location', 'handlePositionSuccess', duration, {
      source,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude
    });
    
    // Notify listeners
    this._notifyLocation(location);
  }

  /**
   * Get current position with reduced accuracy
   * @private
   * @returns {Promise<Position>} - Geolocation position
   */
  _getCurrentPositionWithReducedAccuracy() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
  
  /**
   * Get default location
   * @private
   * @returns {Object} Default location
   */
  _getDefaultLocation() {
    return {
      latitude: 34.052235,
      longitude: -118.243683,
      accuracy: 1000,
      timestamp: Date.now()
    };
  }

  /**
   * Handle position error with enhanced fallback
   * @private
   * @param {PositionError} error - Geolocation PositionError object
   */
  _handlePositionError(error) {
    const startTime = Date.now();
    let errorMessage;
    let context = {
      code: error.code,
      timestamp: Date.now(),
      lastKnownLocation: this.lastLocation
    };
    
    switch (error.code) {
      case 1:
        errorMessage = ERROR_MESSAGES.LOCATION_PERMISSION_DENIED;
        break;
      case 2:
        errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
        break;
      case 3:
        errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage = `Location error: ${error.message}`;
    }
    
    // Track error
    this._monitor.trackError('location', 'handlePositionError', error, context);
    
    // Handle error with recovery attempt
    this._errorHandler.handleError(error, 'location', context)
      .then(recovered => {
        const duration = Date.now() - startTime;
        this._monitor.trackOperationTiming('location', 'handlePositionError', duration, {
          source: 'error',
          success: !!recovered,
          errorCode: error.code
        });
        
        if (recovered) {
          console.log('[LocationService] Successfully recovered from location error');
        } else {
          this._notifyError(errorMessage);
        }
      })
      .catch(recoveryError => {
        const duration = Date.now() - startTime;
        this._monitor.trackOperationTiming('location', 'handlePositionError', duration, {
          source: 'error',
          success: false,
          errorCode: error.code,
          recoveryError: true
        });
        console.error('[LocationService] Recovery attempt failed:', recoveryError);
        this._notifyError(errorMessage);
      });
  }

  /**
   * Get the current user location with enhanced caching
   * @returns {Promise<Object>} - User location
   */
  async getCurrentLocation() {
    const startTime = Date.now();
    
    // Clean up old cache entries
    this._cleanupCache();
    
    // First check CacheService
    const cachedData = this._cache.get('lastKnownLocation');
    if (cachedData && !this._isExpired(cachedData)) {
      this._updateCacheStats(true);
      this.locationCache = cachedData;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('location', 'getCurrentLocation', duration, {
        source: 'cache',
        success: true
      });
      
      return cachedData.location;
    }
    
    this._updateCacheStats(false);
    
    // If no valid cache, try to get fresh location
    return this._getCurrentPositionWithRetry()
      .then((position) => {
          const location = this._formatPosition(position);
        const source = position.coords.altitude ? 'gps' : 'network';
        
        // Save to cache
        this._saveToCache(location, position.coords.accuracy, source);
        
          this.lastLocation = location;
        
        const duration = Date.now() - startTime;
        this._monitor.trackOperationTiming('location', 'getCurrentLocation', duration, {
          source: 'gps',
          success: true,
          accuracy: position.coords.accuracy
        });
        
        return location;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this._monitor.trackError('location', 'getCurrentLocation', error);
        this._monitor.trackOperationTiming('location', 'getCurrentLocation', duration, {
          source: 'gps',
          success: false
        });
        
        // If fresh location fails but we have a cached location, use it
        const cachedData = this._cache.get('lastKnownLocation');
        if (cachedData && !this._isExpired(cachedData)) {
          this._updateCacheStats(true);
          this.locationCache = cachedData;
          return cachedData.location;
        }
        throw error;
    });
  }
  
  /**
   * Check if the service is currently tracking location
   * @returns {boolean} - True if tracking
   */
  isTracking() {
    return this._isTracking;
  }
  
  /**
   * Register a callback for location changes
   * @param {Function} callback - Function to call with location data
   * @returns {Function} - Function to remove the listener
   */
  onLocationChange(callback) {
    return this._locationEmitter.on(callback);
  }
  
  /**
   * Unregister a location change callback
   * @param {Function} callback - The callback to remove
   */
  offLocationChange(callback) {
    this._locationEmitter.off(callback);
  }
  
  /**
   * Register a callback for error handling
   * @param {Function} callback - Function to call with errors
   * @returns {Function} - Function to remove the listener
   */
  onError(callback) {
    return this._errorEmitter.on(callback);
  }
  
  /**
   * Unregister an error callback
   * @param {Function} callback - The callback to remove
   */
  offError(callback) {
    this._errorEmitter.off(callback);
  }
  
  /**
   * Format geolocation position into a standard object
   * @param {Position} position - Geolocation Position object
   * @returns {Object} - Formatted location
   * @private
   */
  _formatPosition(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
  }
  
  /**
   * Notify location change listeners
   * @param {Object} location - Location data
   * @private
   */
  _notifyLocation(location) {
    const startTime = Date.now();
    const listenerCount = this._locationEmitter.listenerCount();
    
    this._locationEmitter.emit(location);
    
    const duration = Date.now() - startTime;
    this._monitor.trackOperationTiming('location', 'notifyLocation', duration, {
      success: true,
      listenerCount,
      hasLocation: !!location,
      accuracy: location?.accuracy
    });
  }
  
  /**
   * Notify error listeners
   * @param {Error|string} error - Error to notify
   * @private
   */
  _notifyError(error) {
    const startTime = Date.now();
    const listenerCount = this._errorEmitter.listenerCount();
    
    console.error('[LocationService] Error:', error);
    this._errorEmitter.emit(error);
    
    const duration = Date.now() - startTime;
    this._monitor.trackOperationTiming('location', 'notifyError', duration, {
      success: true,
      listenerCount,
      errorType: error instanceof Error ? error.name : typeof error,
      hasMessage: !!error?.message
    });
  }

  /**
   * Calculate distance between two points using the Haversine formula
   * @param {number} lat1 - Latitude of the first point
   * @param {number} lon1 - Longitude of the first point
   * @param {number} lat2 - Latitude of the second point
   * @param {number} lon2 - Longitude of the second point
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const startTime = Date.now();
    try {
    // Earth's radius in meters
    const R = 6371e3;
    
    const φ1 = this._toRadians(lat1);
    const φ2 = this._toRadians(lat2);
    const Δφ = this._toRadians(lat2 - lat1);
    const Δλ = this._toRadians(lon2 - lon1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const distance = R * c;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('location', 'calculateDistance', duration, {
        success: true,
        distance,
        lat1,
        lon1,
        lat2,
        lon2
      });
      
      return distance;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('location', 'calculateDistance', error);
      this._monitor.trackOperationTiming('location', 'calculateDistance', duration, {
        success: false,
        error: error.message,
        lat1,
        lon1,
        lat2,
        lon2
      });
      throw error;
    }
  }

  /**
   * Convert degrees to radians
   * @private
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  _toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return { ...this.locationCache.stats };
  }

  /**
   * Clear the location cache
   */
  clearCache() {
    const startTime = Date.now();
    try {
      const oldStats = { ...this.locationCache.stats };
      localStorage.removeItem('locationCache');
      this.locationCache = {
        timestamp: 0,
        location: null,
        maxAge: this._options.maximumAge,
        accuracy: null,
        source: null,
        stats: {
          hits: 0,
          misses: 0,
          lastUpdated: 0
        }
      };
      this.lastLocation = null;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('location', 'clearCache', duration, {
        success: true,
        oldHits: oldStats.hits,
        oldMisses: oldStats.misses,
        hadLocation: !!this.lastLocation
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('location', 'clearCache', error);
      this._monitor.trackOperationTiming('location', 'clearCache', duration, {
        success: false,
        error: error.message
      });
      console.warn('[LocationService] Error clearing cache:', error);
    }
  }
}

// Export as class
export { LocationService };
export default LocationService; 