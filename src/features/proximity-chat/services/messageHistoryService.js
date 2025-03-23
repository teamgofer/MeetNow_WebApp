import { api } from '../../../services/api';
import { URLS, TIMING, API } from '../constants';
import { authFetch } from '../../../utils/authUtils';

/**
 * Service for loading and managing message history for proximity chat
 */
const messageHistoryService = {
  /**
   * Load message history for a specific region
   * @param {string} regionId - ID of the region to load messages for
   * @param {Object} options - Options for loading messages
   * @param {number} [options.limit=50] - Maximum number of messages to load
   * @param {number} [options.before] - Timestamp to load messages before
   * @param {number} [options.after] - Timestamp to load messages after
   * @returns {Promise<Array>} Promise resolving to array of messages
   */
  async loadMessageHistory(regionId, options = {}) {
    try {
      const { limit = 50, before, after } = options;
      
      const params = {
        regionId,
        limit
      };
      
      if (before) {
        params.before = before;
      }
      
      if (after) {
        params.after = after;
      }
      
      const response = await api.get(URLS.MESSAGE_HISTORY, { params });
      return response.data.messages || [];
    } catch (error) {
      console.error('Error loading message history:', error);
      throw error;
    }
  },
  
  /**
   * Load messages from before the oldest loaded message
   * @param {string} regionId - ID of the region
   * @param {number} oldestTimestamp - Timestamp of the oldest loaded message
   * @param {number} [limit=20] - Number of messages to load
   * @returns {Promise<Array>} Promise resolving to array of older messages
   */
  async loadOlderMessages(regionId, oldestTimestamp, limit = 20) {
    try {
      return await this.loadMessageHistory(regionId, {
        limit,
        before: oldestTimestamp
      });
    } catch (error) {
      console.error('Error loading older messages:', error);
      throw error;
    }
  },
  
  /**
   * Load messages that were sent when user wasn't in the area
   * @param {string} regionId - ID of the region
   * @param {number} enteredAt - Timestamp when user entered the region
   * @param {number} [limit=50] - Number of messages to load
   * @returns {Promise<Array>} Promise resolving to array of previous messages
   */
  async loadMessagesBeforeArrival(regionId, enteredAt, limit = 50) {
    try {
      return await this.loadMessageHistory(regionId, {
        limit,
        before: enteredAt
      });
    } catch (error) {
      console.error('Error loading messages before arrival:', error);
      throw error;
    }
  },
  
  /**
   * Mark messages in a region as read
   * @param {string} regionId - ID of the region
   * @returns {Promise<Object>} Promise resolving when messages are marked as read
   */
  async markMessagesAsRead(regionId) {
    try {
      const response = await api.post(URLS.MARK_MESSAGES_READ, { regionId });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },
  
  /**
   * Delete a message from history
   * @param {string} messageId - ID of the message to delete
   * @returns {Promise<Object>} Promise resolving when message is deleted
   */
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`${URLS.MESSAGES}/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

export default messageHistoryService;

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