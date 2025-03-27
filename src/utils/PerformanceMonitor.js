/**
 * PerformanceMonitor provides centralized performance monitoring and analytics
 */

class PerformanceMonitor {
  constructor() {
    // Metrics storage
    this._metrics = {
      apiCalls: new Map(),
      cacheStats: new Map(),
      operationTimings: new Map(),
      errors: new Map(),
      memoryUsage: new Map(),
      resourceUsage: new Map()
    };
    
    // Configuration
    this._config = {
      maxMetricsAge: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      maxMetricsPerCategory: 1000,
      memoryWarningThreshold: 0.8, // 80% of max memory
      resourceWarningThreshold: 0.9 // 90% of max resources
    };
    
    // Start cleanup interval
    this._startCleanupInterval();
    
    // Start resource monitoring
    this._startResourceMonitoring();
  }
  
  /**
   * Track API call performance
   * @param {string} service - Service name (e.g., 'overpass', 'nominatim')
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {boolean} success - Whether the operation was successful
   * @param {Object} metadata - Additional metadata
   */
  trackApiCall(service, operation, duration, success, metadata = {}) {
    const key = `${service}:${operation}`;
    const timestamp = Date.now();
    
    if (!this._metrics.apiCalls.has(key)) {
      this._metrics.apiCalls.set(key, []);
    }
    
    const calls = this._metrics.apiCalls.get(key);
    calls.push({
      timestamp,
      duration,
      success,
      metadata
    });
    
    // Keep only recent calls
    if (calls.length > this._config.maxMetricsPerCategory) {
      calls.shift();
    }
  }
  
  /**
   * Track cache performance
   * @param {string} service - Service name
   * @param {string} operation - Operation name
   * @param {boolean} hit - Whether it was a cache hit
   * @param {number} size - Size of cached data in bytes
   * @param {Object} metadata - Additional metadata
   */
  trackCacheOperation(service, operation, hit, size, metadata = {}) {
    const key = `${service}:${operation}`;
    const timestamp = Date.now();
    
    if (!this._metrics.cacheStats.has(key)) {
      this._metrics.cacheStats.set(key, {
        hits: 0,
        misses: 0,
        totalSize: 0,
        operations: []
      });
    }
    
    const stats = this._metrics.cacheStats.get(key);
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    stats.totalSize += size;
    stats.operations.push({
      timestamp,
      hit,
      size,
      metadata
    });
    
    // Keep only recent operations
    if (stats.operations.length > this._config.maxMetricsPerCategory) {
      stats.operations.shift();
    }
  }
  
  /**
   * Track operation timing
   * @param {string} category - Operation category
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  trackOperationTiming(category, operation, duration, metadata = {}) {
    const key = `${category}:${operation}`;
    const timestamp = Date.now();
    
    if (!this._metrics.operationTimings.has(key)) {
      this._metrics.operationTimings.set(key, []);
    }
    
    const timings = this._metrics.operationTimings.get(key);
    timings.push({
      timestamp,
      duration,
      metadata
    });
    
    // Keep only recent timings
    if (timings.length > this._config.maxMetricsPerCategory) {
      timings.shift();
    }
  }
  
  /**
   * Track error occurrence
   * @param {string} category - Error category
   * @param {string} operation - Operation name
   * @param {Error} error - Error object
   * @param {Object} metadata - Additional metadata
   */
  trackError(category, operation, error, metadata = {}) {
    const key = `${category}:${operation}`;
    const timestamp = Date.now();
    
    if (!this._metrics.errors.has(key)) {
      this._metrics.errors.set(key, []);
    }
    
    const errors = this._metrics.errors.get(key);
    errors.push({
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      metadata
    });
    
    // Keep only recent errors
    if (errors.length > this._config.maxMetricsPerCategory) {
      errors.shift();
    }
  }
  
  /**
   * Track memory usage
   * @param {string} category - Category name
   * @param {string} operation - Operation name
   * @param {number} size - Size in bytes
   * @param {Object} metadata - Additional metadata
   */
  trackMemoryUsage(category, operation, size, metadata = {}) {
    const key = `${category}:${operation}`;
    const timestamp = Date.now();
    
    if (!this._metrics.memoryUsage.has(key)) {
      this._metrics.memoryUsage.set(key, {
        totalSize: 0,
        peakSize: 0,
        samples: []
      });
    }
    
    const usage = this._metrics.memoryUsage.get(key);
    usage.totalSize += size;
    usage.peakSize = Math.max(usage.peakSize, usage.totalSize);
    
    usage.samples.push({
      timestamp,
      size,
      metadata
    });
    
    // Keep only recent samples
    if (usage.samples.length > this._config.maxMetricsPerCategory) {
      usage.samples.shift();
    }
    
    // Check for memory warnings
    if (usage.totalSize > this._config.memoryWarningThreshold * usage.peakSize) {
      this._trackWarning('memory', key, {
        currentSize: usage.totalSize,
        peakSize: usage.peakSize,
        threshold: this._config.memoryWarningThreshold
      });
    }
  }
  
  /**
   * Track resource usage
   * @param {string} resource - Resource name
   * @param {number} usage - Current usage value
   * @param {number} maxUsage - Maximum allowed usage
   * @param {Object} metadata - Additional metadata
   */
  trackResourceUsage(resource, usage, maxUsage, metadata = {}) {
    const timestamp = Date.now();
    
    if (!this._metrics.resourceUsage.has(resource)) {
      this._metrics.resourceUsage.set(resource, {
        current: 0,
        max: maxUsage,
        history: []
      });
    }
    
    const resourceData = this._metrics.resourceUsage.get(resource);
    resourceData.current = usage;
    resourceData.max = Math.max(resourceData.max, maxUsage);
    
    resourceData.history.push({
      timestamp,
      usage,
      maxUsage,
      metadata
    });
    
    // Keep only recent history
    if (resourceData.history.length > this._config.maxMetricsPerCategory) {
      resourceData.history.shift();
    }
    
    // Check for resource warnings
    if (usage > this._config.resourceWarningThreshold * maxUsage) {
      this._trackWarning('resource', resource, {
        current: usage,
        max: maxUsage,
        threshold: this._config.resourceWarningThreshold
      });
    }
  }
  
  /**
   * Track warning
   * @param {string} type - Warning type
   * @param {string} key - Warning key
   * @param {Object} data - Warning data
   * @private
   */
  _trackWarning(type, key, data) {
    const warning = {
      timestamp: Date.now(),
      type,
      key,
      data
    };
    
    // Log warning
    console.warn(`[PerformanceMonitor] ${type} warning:`, warning);
    
    // Track in metrics
    if (!this._metrics.errors.has('warnings')) {
      this._metrics.errors.set('warnings', []);
    }
    
    this._metrics.errors.get('warnings').push(warning);
  }
  
  /**
   * Get performance metrics
   * @param {string} category - Category to filter by
   * @param {Object} options - Filter options
   * @returns {Object} Performance metrics
   */
  getMetrics(category = null, options = {}) {
    const {
      timeRange = this._config.maxMetricsAge,
      includeMetadata = false
    } = options;
    
    const now = Date.now();
    const metrics = {};
    
    // Helper to filter by time range
    const filterByTime = (items) => {
      return items.filter(item => now - item.timestamp <= timeRange);
    };
    
    // Process each metric category
    for (const [key, value] of this._metrics.entries()) {
      if (category && !key.startsWith(category)) continue;
      
      if (Array.isArray(value)) {
        metrics[key] = filterByTime(value);
      } else if (typeof value === 'object') {
        metrics[key] = {
          ...value,
          operations: filterByTime(value.operations || [])
        };
      }
    }
    
    return metrics;
  }
  
  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const now = Date.now();
    const summary = {
      apiCalls: {},
      cacheStats: {},
      operationTimings: {},
      errors: {},
      memoryUsage: {},
      resourceUsage: {}
    };
    
    // Process API calls
    for (const [key, calls] of this._metrics.apiCalls.entries()) {
      const recentCalls = calls.filter(call => now - call.timestamp <= this._config.maxMetricsAge);
      summary.apiCalls[key] = {
        total: recentCalls.length,
        successRate: recentCalls.filter(call => call.success).length / recentCalls.length,
        avgDuration: recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length
      };
    }
    
    // Process cache stats
    for (const [key, stats] of this._metrics.cacheStats.entries()) {
      const recentOps = stats.operations.filter(op => now - op.timestamp <= this._config.maxMetricsAge);
      summary.cacheStats[key] = {
        hitRate: stats.hits / (stats.hits + stats.misses),
        totalSize: stats.totalSize,
        operations: recentOps.length
      };
    }
    
    // Process operation timings
    for (const [key, timings] of this._metrics.operationTimings.entries()) {
      const recentTimings = timings.filter(timing => now - timing.timestamp <= this._config.maxMetricsAge);
      summary.operationTimings[key] = {
        count: recentTimings.length,
        avgDuration: recentTimings.reduce((sum, timing) => sum + timing.duration, 0) / recentTimings.length
      };
    }
    
    // Process memory usage
    for (const [key, usage] of this._metrics.memoryUsage.entries()) {
      const recentSamples = usage.samples.filter(sample => now - sample.timestamp <= this._config.maxMetricsAge);
      summary.memoryUsage[key] = {
        currentSize: usage.totalSize,
        peakSize: usage.peakSize,
        samples: recentSamples.length
      };
    }
    
    // Process resource usage
    for (const [key, usage] of this._metrics.resourceUsage.entries()) {
      const recentHistory = usage.history.filter(h => now - h.timestamp <= this._config.maxMetricsAge);
      summary.resourceUsage[key] = {
        current: usage.current,
        max: usage.max,
        history: recentHistory.length
      };
    }
    
    // Process errors and warnings
    for (const [key, errors] of this._metrics.errors.entries()) {
      const recentErrors = errors.filter(error => now - error.timestamp <= this._config.maxMetricsAge);
      summary.errors[key] = {
        count: recentErrors.length,
        lastError: recentErrors[recentErrors.length - 1]
      };
    }
    
    return summary;
  }
  
  /**
   * Clear old metrics
   * @private
   */
  _cleanup() {
    const now = Date.now();
    
    // Clean up API calls
    for (const [key, calls] of this._metrics.apiCalls.entries()) {
      this._metrics.apiCalls.set(
        key,
        calls.filter(call => now - call.timestamp <= this._config.maxMetricsAge)
      );
    }
    
    // Clean up cache stats
    for (const [key, stats] of this._metrics.cacheStats.entries()) {
      stats.operations = stats.operations.filter(
        op => now - op.timestamp <= this._config.maxMetricsAge
      );
    }
    
    // Clean up operation timings
    for (const [key, timings] of this._metrics.operationTimings.entries()) {
      this._metrics.operationTimings.set(
        key,
        timings.filter(timing => now - timing.timestamp <= this._config.maxMetricsAge)
      );
    }
    
    // Clean up errors
    for (const [key, errors] of this._metrics.errors.entries()) {
      this._metrics.errors.set(
        key,
        errors.filter(error => now - error.timestamp <= this._config.maxMetricsAge)
      );
    }
  }
  
  /**
   * Start cleanup interval
   * @private
   */
  _startCleanupInterval() {
    setInterval(() => {
      this._cleanup();
    }, this._config.cleanupInterval);
  }
  
  /**
   * Start resource monitoring
   * @private
   */
  _startResourceMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        this.trackResourceUsage('memory', memory.usedJSHeapSize, memory.jsHeapSizeLimit, {
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }, 60000); // Check every minute
    }
    
    // Monitor CPU usage if available
    if (performance.getEntriesByType) {
      setInterval(() => {
        const entries = performance.getEntriesByType('resource');
        const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
        this.trackResourceUsage('cpu', totalDuration, 1000, {
          entries: entries.length
        });
      }, 60000);
    }
  }
}

// Export as singleton
const performanceMonitor = new PerformanceMonitor();
export { performanceMonitor as PerformanceMonitor };
export default performanceMonitor; 