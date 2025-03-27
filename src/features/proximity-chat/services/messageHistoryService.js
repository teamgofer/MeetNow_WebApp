import { api } from '../../../services/api';
import { URLS, TIMING, API } from '../constants';
import { authFetch } from '../../../utils/authUtils';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import { CacheService } from '../../../utils/CacheService.js';

/**
 * Service for loading and managing message history for proximity chat
 */
class MessageHistoryService {
  constructor() {
    this._monitor = PerformanceMonitor;
    this._cache = CacheService;
    this._messageCount = 0;
    this._lastMessageTimestamp = null;
    this._batchOperations = 0;
    this._memoryUsage = 0;
    this._maxCacheSize = 100 * 1024 * 1024; // 100MB max cache size
    this._errorCount = 0;
    this._lastError = null;
    this._unreadCounts = new Map();
    this._visitedRegions = new Map();
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      messageCount: this._messageCount,
      lastMessageTimestamp: this._lastMessageTimestamp,
      batchOperations: this._batchOperations,
      memoryUsage: this._memoryUsage,
      errorCount: this._errorCount,
      lastError: this._lastError,
      unreadCounts: Object.fromEntries(this._unreadCounts),
      visitedRegions: Object.fromEntries(this._visitedRegions),
      cacheStats: this._cache.getStats()
    };
  }

  /**
   * Track memory usage for message set
   * @param {Array} messages - Array of messages
   * @private
   */
  _trackMemoryUsage(messages) {
    const messageSize = JSON.stringify(messages).length;
    this._memoryUsage += messageSize;
    
    // Track memory usage in performance monitor with detailed metrics
    this._monitor.trackMemoryUsage('messageHistory', 'messageSet', messageSize, {
      messageCount: messages.length,
      averageMessageSize: messageSize / messages.length,
      totalMemoryUsage: this._memoryUsage,
      messageTypes: messages.reduce((acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      }, {}),
      oldestMessageTimestamp: messages.length > 0 ? Math.min(...messages.map(m => m.timestamp)) : null,
      newestMessageTimestamp: messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : null
    });

    // Cleanup if memory usage exceeds limit
    if (this._memoryUsage > this._maxCacheSize) {
      this._cleanupCache();
    }
  }

  /**
   * Clean up cache to reduce memory usage
   * @private
   */
  _cleanupCache() {
    const startTime = Date.now();
    try {
      // Clear oldest entries until we're under the limit
      while (this._memoryUsage > this._maxCacheSize * 0.8) { // Clear until 80% of max
        const oldestKey = this._cache.getOldestKey();
        if (!oldestKey) break;
        
        const entry = this._cache.get(oldestKey);
        if (entry) {
          this._memoryUsage -= JSON.stringify(entry).length;
        }
        this._cache.remove(oldestKey);
      }

      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('cache', 'cleanup', duration, {
        success: true,
        newMemoryUsage: this._memoryUsage,
        entriesCleared: this._cache.getStats().size
      });
    } catch (error) {
      this._monitor.trackError('cache', 'cleanup', error);
      console.warn('[MessageHistoryService] Error during cache cleanup:', error);
    }
  }

  /**
   * Generate cache key for messages
   * @param {string} regionId - Region ID
   * @param {Object} options - Query options
   * @returns {string} Cache key
   * @private
   */
  _generateCacheKey(regionId, options) {
    const { limit = 50, before, after, includeBeforeJoin = false } = options;
    return `messages:${regionId}:${limit}:${before || 'latest'}:${after || 'earliest'}:${includeBeforeJoin}`;
  }

  /**
   * Handle API error
   * @param {Error} error - Error object
   * @param {string} operation - Operation name
   * @param {Object} metadata - Additional metadata
   * @private
   */
  _handleError(error, operation, metadata = {}) {
    this._errorCount++;
    this._lastError = {
      timestamp: Date.now(),
      operation,
      message: error.message,
      metadata
    };
    
    // Track error with detailed metrics
    this._monitor.trackError('messageHistory', operation, error, {
      ...metadata,
      errorCount: this._errorCount,
      lastErrorTimestamp: this._lastError.timestamp,
      messageCount: this._messageCount,
      memoryUsage: this._memoryUsage,
      batchOperations: this._batchOperations,
      cacheStats: this._cache.getStats()
    });
    
    console.error(`[MessageHistoryService] Error in ${operation}:`, error);
  }

  /**
   * Track operation performance
   * @param {string} operation - Operation name
   * @param {number} startTime - Operation start time
   * @param {Object} metadata - Additional metadata
   * @private
   */
  _trackPerformance(operation, startTime, metadata = {}) {
    const duration = Date.now() - startTime;
    this._monitor.trackOperationTiming('messageHistory', operation, duration, {
      ...metadata,
      messageCount: this._messageCount,
      lastMessageTimestamp: this._lastMessageTimestamp,
      errorCount: this._errorCount,
      memoryUsage: this._memoryUsage,
      batchOperations: this._batchOperations,
      cacheStats: this._cache.getStats(),
      timestamp: Date.now()
    });
  }

  /**
   * Make authenticated API request
   * @param {string} url - API URL
   * @param {Object} options - Request options
   * @returns {Promise<Response>} API response
   * @private
   */
  async _makeRequest(url, options = {}) {
    const response = await authFetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }
    
    return response;
  }

  /**
   * Load message history for a specific region
   * @param {string} regionId - ID of the region to load messages for
   * @param {Object} options - Options for loading messages
   * @param {number} [options.limit=50] - Maximum number of messages to load
   * @param {number} [options.before] - Timestamp to load messages before
   * @param {number} [options.after] - Timestamp to load messages after
   * @param {boolean} [options.includeBeforeJoin=false] - Include messages from before user joined
   * @returns {Promise<Array>} Promise resolving to array of messages
   */
  async loadMessageHistory(regionId, options = {}) {
    const startTime = Date.now();
    try {
      if (!regionId) {
        throw new Error('Region ID is required');
      }

      const { limit = 50, before, after, includeBeforeJoin = false } = options;
      
      // Generate cache key
      const cacheKey = this._generateCacheKey(regionId, options);
      
      // Check cache first
      const cachedMessages = this._cache.get(cacheKey);
      if (cachedMessages) {
        this._monitor.trackCacheOperation('messageHistory', 'loadFromCache', true, JSON.stringify(cachedMessages).length, {
          messageCount: cachedMessages.length,
          regionId,
          cacheKey
        });
        this._trackPerformance('loadFromCache', startTime, {
          success: true,
          messageCount: cachedMessages.length,
          regionId,
          cacheKey
        });
        return cachedMessages;
      }
      
      this._monitor.trackCacheOperation('messageHistory', 'loadFromCache', false, 0, {
        regionId,
        cacheKey,
        reason: 'Cache miss'
      });
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      if (before) params.append('before', before.toString());
      if (after) params.append('after', after.toString());
      if (includeBeforeJoin) params.append('includeBeforeJoin', 'true');
      
      // Fetch from API
      const response = await this._makeRequest(
        `${API.BASE_URL}/regions/${regionId}/messages?${params.toString()}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      const messages = data.messages || [];
      
      // Update stats and cache
      if (messages.length > 0) {
        this._messageCount += messages.length;
        this._lastMessageTimestamp = messages[0].timestamp;
        this._batchOperations++;
        
        // Track memory usage
        this._trackMemoryUsage(messages);
        
        // Cache the results with TTL
        this._cache.set(cacheKey, messages, TIMING.MESSAGE_CACHE_TTL);
      }
      
      this._trackPerformance('loadFromApi', startTime, {
        success: true,
        messageCount: messages.length,
        regionId,
        cacheKey,
        memoryUsage: this._memoryUsage
      });
      
      return messages;
    } catch (error) {
      this._handleError(error, 'loadMessageHistory', { regionId, options });
      this._trackPerformance('loadFromApi', startTime, {
        success: false,
        regionId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Load messages from before the oldest loaded message
   * @param {string} regionId - ID of the region
   * @param {number} oldestTimestamp - Timestamp of the oldest loaded message
   * @param {number} [limit=20] - Number of messages to load
   * @returns {Promise<Array>} Promise resolving to array of older messages
   */
  async loadOlderMessages(regionId, oldestTimestamp, limit = 20) {
    const startTime = Date.now();
    try {
      const messages = await this.loadMessageHistory(regionId, {
        limit,
        before: oldestTimestamp
      });
      
      this._trackPerformance('loadOlderMessages', startTime, {
        success: true,
        messageCount: messages.length,
        oldestTimestamp,
        regionId,
        limit
      });
      
      return messages;
    } catch (error) {
      this._handleError(error, 'loadOlderMessages', { regionId, oldestTimestamp, limit });
      this._trackPerformance('loadOlderMessages', startTime, {
        success: false,
        oldestTimestamp,
        regionId,
        limit
      });
      throw error;
    }
  }
  
  /**
   * Load messages that were sent when user wasn't in the area
   * @param {string} regionId - ID of the region
   * @param {number} enteredAt - Timestamp when user entered the region
   * @param {number} [limit=50] - Number of messages to load
   * @returns {Promise<Array>} Promise resolving to array of previous messages
   */
  async loadMessagesBeforeArrival(regionId, enteredAt, limit = 50) {
    const startTime = Date.now();
    try {
      const messages = await this.loadMessageHistory(regionId, {
        limit,
        before: enteredAt,
        includeBeforeJoin: true
      });
      
      this._trackPerformance('loadMessagesBeforeArrival', startTime, {
        success: true,
        messageCount: messages.length,
        enteredAt,
        regionId,
        limit
      });
      
      return messages;
    } catch (error) {
      this._handleError(error, 'loadMessagesBeforeArrival', { regionId, enteredAt, limit });
      this._trackPerformance('loadMessagesBeforeArrival', startTime, {
        success: false,
        enteredAt,
        regionId,
        limit
      });
      throw error;
    }
  }
  
  /**
   * Mark messages in a region as read
   * @param {string} regionId - ID of the region
   * @param {Object} options - Mark as read options
   * @param {string} [options.upToMessageId] - Mark all messages up to this message as read
   * @param {number} [options.upToTimestamp] - Mark all messages up to this timestamp as read
   * @returns {Promise<Object>} Promise resolving to response data
   */
  async markMessagesAsRead(regionId, options = {}) {
    const startTime = Date.now();
    try {
      if (!regionId) {
        throw new Error('Region ID is required');
      }
      
      const { upToMessageId, upToTimestamp } = options;
      
      // At least one of upToMessageId or upToTimestamp must be provided
      if (!upToMessageId && !upToTimestamp) {
        throw new Error('Either upToMessageId or upToTimestamp must be provided');
      }
      
      const payload = {};
      if (upToMessageId) payload.upToMessageId = upToMessageId;
      if (upToTimestamp) payload.upToTimestamp = upToTimestamp;
      
      const response = await this._makeRequest(
        `${API.BASE_URL}/regions/${regionId}/messages/read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
      const data = await response.json();
      
      this._trackPerformance('markMessagesAsRead', startTime, {
        success: true,
        regionId,
        upToMessageId,
        upToTimestamp
      });
      
      return data;
    } catch (error) {
      this._handleError(error, 'markMessagesAsRead', { regionId, options });
      this._trackPerformance('markMessagesAsRead', startTime, {
        success: false,
        regionId
      });
      throw error;
    }
  }
  
  /**
   * Delete a message
   * @param {string} messageId - ID of the message to delete
   * @param {Object} options - Options
   * @param {boolean} [options.forEveryone=false] - Whether to delete for everyone or just the current user
   * @returns {Promise<Object>} Result object
   */
  async deleteMessage(messageId, options = {}) {
    const startTime = Date.now();
    try {
      const { forEveryone = false } = options;
      
      const response = await this._makeRequest(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forEveryone })
      });
      
      const data = await response.json();
      
      this._trackPerformance('deleteMessage', startTime, {
        success: true,
        messageId,
        forEveryone,
        totalMessages: this._messageCount
      });
      
      return data;
    } catch (error) {
      this._handleError(error, 'deleteMessage', { messageId, options });
      this._trackPerformance('deleteMessage', startTime, {
        success: false,
        messageId
      });
      throw error;
    }
  }

  /**
   * Get unread message counts for all regions
   * @returns {Promise<Object>} Object mapping region IDs to unread counts
   */
  async getUnreadMessageCounts() {
    const startTime = Date.now();
    try {
      const response = await this._makeRequest('/api/chat/unread-counts');
      const data = await response.json();
      
      // Update internal state
      this._unreadCounts = new Map(Object.entries(data.counts || {}));
      
      this._trackPerformance('getUnreadCounts', startTime, {
        success: true,
        regionCount: this._unreadCounts.size
      });
      
      return data.counts || {};
    } catch (error) {
      this._handleError(error, 'getUnreadCounts');
      this._trackPerformance('getUnreadCounts', startTime, {
        success: false
      });
      throw error;
    }
  }

  /**
   * Get user's visited regions with timestamps
   * @returns {Promise<Array>} Array of region objects with visit timestamps
   */
  async getVisitedRegions() {
    const startTime = Date.now();
    try {
      const response = await this._makeRequest('/api/chat/visited-regions');
      const data = await response.json();
      
      // Update internal state
      this._visitedRegions = new Map(
        (data.regions || []).map(region => [region.id, region])
      );
      
      this._trackPerformance('getVisitedRegions', startTime, {
        success: true,
        regionCount: this._visitedRegions.size
      });
      
      return data.regions || [];
    } catch (error) {
      this._handleError(error, 'getVisitedRegions');
      this._trackPerformance('getVisitedRegions', startTime, {
        success: false
      });
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageHistoryService();

/**
 * Message History Service
 * 
 * Provides API methods for retrieving and managing message history
 * for the proximity chat feature.
 */

/**
 * Fetch message history for a specific region
 * 
 * @param {string} regionId - ID of the region to fetch history for
 * @param {Object} options - Query options
 * @param {number} [options.limit=25] - Maximum number of messages to return
 * @param {number} [options.before] - Timestamp to fetch messages before (millis)
 * @param {number} [options.after] - Timestamp to fetch messages after (millis)
 * @param {boolean} [options.includeBeforeJoin=false] - Include messages from before user joined
 * @returns {Promise<Array>} Promise resolving to array of message objects
 */
export const fetchMessageHistory = async (regionId, options = {}) => {
  if (!regionId) {
    throw new Error('Region ID is required');
  }
  
  const {
    limit = API.DEFAULT_MESSAGE_HISTORY_LIMIT,
    before,
    after,
    includeBeforeJoin = false
  } = options;
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  
  if (before) {
    params.append('before', before.toString());
  }
  
  if (after) {
    params.append('after', after.toString());
  }
  
  if (includeBeforeJoin) {
    params.append('includeBeforeJoin', 'true');
  }
  
  try {
    const response = await authFetch(
      `${API.BASE_URL}/regions/${regionId}/messages?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch message history: ${errorData.message || response.statusText}`
      );
    }
    
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching message history:', error);
    throw error;
  }
};

/**
 * Mark messages in a region as read
 * 
 * @param {string} regionId - ID of the region
 * @param {Object} options - Mark as read options
 * @param {string} [options.upToMessageId] - Mark all messages up to this message as read
 * @param {number} [options.upToTimestamp] - Mark all messages up to this timestamp as read
 * @returns {Promise<Object>} Promise resolving to response data
 */
export const markMessagesAsRead = async (regionId, options = {}) => {
  if (!regionId) {
    throw new Error('Region ID is required');
  }
  
  const { upToMessageId, upToTimestamp } = options;
  
  // At least one of upToMessageId or upToTimestamp must be provided
  if (!upToMessageId && !upToTimestamp) {
    throw new Error('Either upToMessageId or upToTimestamp must be provided');
  }
  
  try {
    const payload = {};
    
    if (upToMessageId) {
      payload.upToMessageId = upToMessageId;
    }
    
    if (upToTimestamp) {
      payload.upToTimestamp = upToTimestamp;
    }
    
    const response = await authFetch(
      `${API.BASE_URL}/regions/${regionId}/messages/read`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to mark messages as read: ${errorData.message || response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Delete a message
 * 
 * @param {string} messageId - ID of the message to delete
 * @param {Object} options - Options
 * @param {boolean} [options.forEveryone=false] - Whether to delete for everyone or just the current user
 * @returns {Promise<Object>} Result object
 */
export const deleteMessage = async (messageId, options = {}) => {
  const { forEveryone = false } = options;

  try {
    const response = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        forEveryone
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete message: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Get unread message counts for all regions
 * 
 * @returns {Promise<Object>} Object mapping region IDs to unread counts
 */
export const getUnreadMessageCounts = async () => {
  try {
    const response = await fetch('/api/chat/unread-counts');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch unread counts: ${response.status}`);
    }
    
    const data = await response.json();
    return data.counts || {};
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    throw error;
  }
};

/**
 * Get user's visited regions with timestamps
 * 
 * @returns {Promise<Array>} Array of region objects with visit timestamps
 */
export const getVisitedRegions = async () => {
  try {
    const response = await fetch('/api/chat/visited-regions');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch visited regions: ${response.status}`);
    }
    
    const data = await response.json();
    return data.regions || [];
  } catch (error) {
    console.error('Error fetching visited regions:', error);
    throw error;
  }
}; 