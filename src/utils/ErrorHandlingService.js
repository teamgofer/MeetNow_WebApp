import { EventEmitter } from './EventEmitter.js';

/**
 * ErrorHandlingService provides centralized error handling and recovery mechanisms
 */
class ErrorHandlingService {
  constructor() {
    // Event emitters for different types of errors
    this._errorEmitter = new EventEmitter();
    this._recoveryEmitter = new EventEmitter();
    
    // Error tracking
    this._errorCount = 0;
    this._recentErrors = [];
    this._maxRecentErrors = 100;
    
    // Recovery strategies
    this._recoveryStrategies = new Map();
    
    // Error severity levels
    this._severityLevels = {
      CRITICAL: 'critical',   // System-wide failures
      ERROR: 'error',         // Feature failures
      WARNING: 'warning',     // Degraded functionality
      INFO: 'info'           // Informational messages
    };
    
    // Error categories and their handlers
    this._errorCategories = {
      NETWORK: 'network',
      AUTH: 'auth',
      LOCATION: 'location',
      STORAGE: 'storage',
      VALIDATION: 'validation',
      PERMISSION: 'permission',
      RATE_LIMIT: 'rate_limit',
      UNKNOWN: 'unknown'
    };
    
    // Error analytics
    this._analytics = {
      errorsByCategory: {},
      errorsBySeverity: {},
      recoverySuccessRate: {},
      averageRecoveryTime: {},
      lastErrorTimestamp: null,
      errorFrequency: 0
    };
    
    // Default recovery strategies
    this._initializeDefaultStrategies();
  }
  
  /**
   * Initialize default recovery strategies
   * @private
   */
  _initializeDefaultStrategies() {
    // Network error recovery
    this.registerRecoveryStrategy(this._errorCategories.NETWORK, async (error) => {
      const startTime = Date.now();
      try {
        // Try to reconnect
        await this._attemptReconnection();
        // Clear any cached data that might be stale
        await this._clearStaleCache();
        // Track recovery success
        this._trackRecovery('network', true, Date.now() - startTime);
        return true;
      } catch (recoveryError) {
        this._trackRecovery('network', false, Date.now() - startTime);
        throw recoveryError;
      }
    });
    
    // Auth error recovery
    this.registerRecoveryStrategy(this._errorCategories.AUTH, async (error) => {
      const startTime = Date.now();
      try {
        // Try to refresh token
        await this._refreshAuthToken();
        // Retry the failed operation
        this._trackRecovery('auth', true, Date.now() - startTime);
        return true;
      } catch (recoveryError) {
        this._trackRecovery('auth', false, Date.now() - startTime);
        throw recoveryError;
      }
    });
    
    // Location error recovery
    this.registerRecoveryStrategy(this._errorCategories.LOCATION, async (error) => {
      const startTime = Date.now();
      try {
        // Try to get location from cache
        const cachedLocation = await this._getCachedLocation();
        if (cachedLocation) {
          this._trackRecovery('location', true, Date.now() - startTime);
          return cachedLocation;
        }
        // Fall back to default location
        const defaultLocation = await this._getDefaultLocation();
        this._trackRecovery('location', true, Date.now() - startTime);
        return defaultLocation;
      } catch (recoveryError) {
        this._trackRecovery('location', false, Date.now() - startTime);
        throw recoveryError;
      }
    });
    
    // Storage error recovery
    this.registerRecoveryStrategy(this._errorCategories.STORAGE, async (error) => {
      const startTime = Date.now();
      try {
        // Try to clear storage
        await this._clearStorage();
        // Reinitialize storage
        await this._reinitializeStorage();
        this._trackRecovery('storage', true, Date.now() - startTime);
        return true;
      } catch (recoveryError) {
        this._trackRecovery('storage', false, Date.now() - startTime);
        throw recoveryError;
      }
    });

    // Rate limit error recovery
    this.registerRecoveryStrategy(this._errorCategories.RATE_LIMIT, async (error) => {
      const startTime = Date.now();
      try {
        // Implement exponential backoff
        const backoffTime = this._calculateBackoffTime(error);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        this._trackRecovery('rate_limit', true, Date.now() - startTime);
        return true;
      } catch (recoveryError) {
        this._trackRecovery('rate_limit', false, Date.now() - startTime);
        throw recoveryError;
      }
    });
  }
  
  /**
   * Calculate backoff time for rate limit errors
   * @private
   * @param {Error} error - The rate limit error
   * @returns {number} - Backoff time in milliseconds
   */
  _calculateBackoffTime(error) {
    const retryAfter = error.headers?.get('Retry-After');
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
    // Default exponential backoff
    return Math.min(1000 * Math.pow(2, this._recentErrors.length), 30000);
  }
  
  /**
   * Track recovery attempt
   * @private
   * @param {string} category - Error category
   * @param {boolean} success - Whether recovery was successful
   * @param {number} duration - Recovery duration in milliseconds
   */
  _trackRecovery(category, success, duration) {
    // Update recovery success rate
    if (!this._analytics.recoverySuccessRate[category]) {
      this._analytics.recoverySuccessRate[category] = { success: 0, total: 0 };
    }
    this._analytics.recoverySuccessRate[category].total++;
    if (success) {
      this._analytics.recoverySuccessRate[category].success++;
    }
    
    // Update average recovery time
    if (!this._analytics.averageRecoveryTime[category]) {
      this._analytics.averageRecoveryTime[category] = { total: 0, count: 0 };
    }
    this._analytics.averageRecoveryTime[category].total += duration;
    this._analytics.averageRecoveryTime[category].count++;
  }
  
  /**
   * Handle an error with recovery attempt
   * @param {Error} error - The error to handle
   * @param {string} category - Error category
   * @param {Object} context - Additional context for error handling
   * @param {string} severity - Error severity level
   */
  async handleError(error, category = this._errorCategories.UNKNOWN, context = {}, severity = this._severityLevels.ERROR) {
    // Track error
    this._trackError(error, category, context, severity);
    
    // Update analytics
    this._updateAnalytics(category, severity);
    
    // Emit error event with enhanced context
    this._errorEmitter.emit({ 
      error, 
      category, 
      context, 
      severity,
      timestamp: Date.now(),
      stack: error.stack,
      message: error.message
    });
    
    // Try to recover
    try {
      const recovered = await this._attemptRecovery(error, category, context);
      if (recovered) {
        this._recoveryEmitter.emit({ error, category, context, severity });
        return true;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
    }
    
    return false;
  }
  
  /**
   * Track error for analysis
   * @private
   * @param {Error} error - The error to track
   * @param {string} category - Error category
   * @param {Object} context - Additional context
   * @param {string} severity - Error severity level
   */
  _trackError(error, category, context, severity) {
    this._errorCount++;
    
    // Add to recent errors with enhanced context
    this._recentErrors.unshift({
      error,
      category,
      context,
      severity,
      timestamp: Date.now(),
      stack: error.stack,
      message: error.message
    });
    
    // Keep only recent errors
    if (this._recentErrors.length > this._maxRecentErrors) {
      this._recentErrors.pop();
    }
  }
  
  /**
   * Update error analytics
   * @private
   * @param {string} category - Error category
   * @param {string} severity - Error severity level
   */
  _updateAnalytics(category, severity) {
    // Update errors by category
    this._analytics.errorsByCategory[category] = (this._analytics.errorsByCategory[category] || 0) + 1;
    
    // Update errors by severity
    this._analytics.errorsBySeverity[severity] = (this._analytics.errorsBySeverity[severity] || 0) + 1;
    
    // Update last error timestamp and frequency
    const now = Date.now();
    if (this._analytics.lastErrorTimestamp) {
      const timeSinceLastError = now - this._analytics.lastErrorTimestamp;
      this._analytics.errorFrequency = 1000 / timeSinceLastError; // errors per second
    }
    this._analytics.lastErrorTimestamp = now;
  }
  
  /**
   * Get error statistics with enhanced analytics
   * @returns {Object} Error statistics and analytics
   */
  getErrorStats() {
    return {
      totalErrors: this._errorCount,
      recentErrors: this._recentErrors.length,
      categories: this._getErrorCategoryStats(),
      analytics: {
        errorsByCategory: this._analytics.errorsByCategory,
        errorsBySeverity: this._analytics.errorsBySeverity,
        recoverySuccessRate: this._getRecoverySuccessRate(),
        averageRecoveryTime: this._getAverageRecoveryTime(),
        errorFrequency: this._analytics.errorFrequency
      }
    };
  }
  
  /**
   * Get recovery success rate by category
   * @private
   * @returns {Object} Recovery success rates
   */
  _getRecoverySuccessRate() {
    const rates = {};
    for (const [category, stats] of Object.entries(this._analytics.recoverySuccessRate)) {
      rates[category] = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    }
    return rates;
  }
  
  /**
   * Get average recovery time by category
   * @private
   * @returns {Object} Average recovery times
   */
  _getAverageRecoveryTime() {
    const times = {};
    for (const [category, stats] of Object.entries(this._analytics.averageRecoveryTime)) {
      times[category] = stats.count > 0 ? stats.total / stats.count : 0;
    }
    return times;
  }
  
  /**
   * Register a recovery strategy for an error category
   * @param {string} category - Error category
   * @param {Function} strategy - Recovery strategy function
   */
  registerRecoveryStrategy(category, strategy) {
    this._recoveryStrategies.set(category, strategy);
  }
  
  /**
   * Attempt to recover from an error
   * @private
   * @param {Error} error - The error to recover from
   * @param {string} category - Error category
   * @param {Object} context - Additional context
   * @returns {Promise<boolean>} - Whether recovery was successful
   */
  async _attemptRecovery(error, category, context) {
    const strategy = this._recoveryStrategies.get(category);
    if (!strategy) {
      console.warn(`No recovery strategy found for category: ${category}`);
      return false;
    }
    
    try {
      return await strategy(error, context);
    } catch (recoveryError) {
      console.error(`Recovery strategy failed for category ${category}:`, recoveryError);
      return false;
    }
  }
  
  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this._errorCount,
      recentErrors: this._recentErrors.length,
      categories: this._getErrorCategoryStats()
    };
  }
  
  /**
   * Get error statistics by category
   * @private
   * @returns {Object} Error statistics by category
   */
  _getErrorCategoryStats() {
    const stats = {};
    this._recentErrors.forEach(({ category }) => {
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory() {
    this._errorCount = 0;
    this._recentErrors = [];
  }
  
  /**
   * Register an error handler
   * @param {Function} handler - Error handler function
   * @returns {Function} - Function to remove the handler
   */
  onError(handler) {
    return this._errorEmitter.on(handler);
  }
  
  /**
   * Register a recovery handler
   * @param {Function} handler - Recovery handler function
   * @returns {Function} - Function to remove the handler
   */
  onRecovery(handler) {
    return this._recoveryEmitter.on(handler);
  }
  
  /**
   * Remove an error handler
   * @param {Function} handler - Handler to remove
   */
  offError(handler) {
    this._errorEmitter.off(handler);
  }
  
  /**
   * Remove a recovery handler
   * @param {Function} handler - Handler to remove
   */
  offRecovery(handler) {
    this._recoveryEmitter.off(handler);
  }
  
  // Recovery strategy implementations
  async _attemptReconnection() {
    // Implementation for network reconnection
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  
  async _refreshAuthToken() {
    // Implementation for auth token refresh
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  
  _getCachedLocation() {
    // Implementation for getting cached location
    return null;
  }
  
  _getDefaultLocation() {
    // Implementation for getting default location
    return {
      latitude: 34.052235,
      longitude: -118.243683
    };
  }
  
  async _clearStorage() {
    // Implementation for clearing storage
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  
  async _reinitializeStorage() {
    // Implementation for reinitializing storage
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  
  _clearStaleCache() {
    // Implementation for clearing stale cache
  }
}

// Export as singleton
const errorHandlingService = new ErrorHandlingService();
export { errorHandlingService as ErrorHandlingService };
export default errorHandlingService; 