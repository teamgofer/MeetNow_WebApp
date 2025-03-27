import { API_ENDPOINTS } from '../constants';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * Service for handling message persistence and retrieval
 */
class MessageService {
  constructor() {
    this.apiEndpoint = API_ENDPOINTS.MESSAGES;
    this._monitor = PerformanceMonitor;
    this._messageCount = 0;
    this._lastMessageTimestamp = null;
  }
  
  /**
   * Get messages for a specific session or area
   * @param {Object} options - Options for fetching messages
   * @param {string} options.sessionId - User's session ID
   * @param {Object} options.location - Location to fetch messages for
   * @param {number} options.radius - Radius in meters to fetch messages from
   * @param {number} options.limit - Maximum number of messages to fetch
   * @param {string} options.before - Fetch messages before this timestamp
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(options = {}) {
    const startTime = Date.now();
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (options.sessionId) {
        params.append('sessionId', options.sessionId);
      }
      
      if (options.location) {
        params.append('latitude', options.location.latitude.toString());
        params.append('longitude', options.location.longitude.toString());
      }
      
      if (options.radius) {
        params.append('radius', options.radius.toString());
      }
      
      if (options.limit) {
        params.append('limit', options.limit.toString());
      }
      
      if (options.before) {
        params.append('before', options.before);
      }
      
      // Make API request
      const response = await fetch(`${this.apiEndpoint}?${params.toString()}`, {
        method: 'GET',
        headers: this._getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      const messages = data.messages || [];
      
      // Update stats
      if (messages.length > 0) {
        this._messageCount += messages.length;
        this._lastMessageTimestamp = messages[0].timestamp;
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('message', 'getMessages', duration, {
        success: true,
        messageCount: messages.length,
        totalMessages: this._messageCount,
        timeSinceLastMessage: this._lastMessageTimestamp ? 
          Date.now() - new Date(this._lastMessageTimestamp).getTime() : null,
        ...options
      });
      
      return messages;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('message', 'getMessages', error);
      this._monitor.trackOperationTiming('message', 'getMessages', duration, {
        success: false,
        ...options
      });
      console.error('[MessageService] Error fetching messages:', error);
      throw error;
    }
  }
  
  /**
   * Send a message
   * @param {Object} message - Message to send
   * @param {string} message.content - Message content
   * @param {string} message.sessionId - Sender's session ID
   * @param {Object} message.location - Message location
   * @param {string} message.timestamp - Message timestamp
   * @returns {Promise<Object>} - The sent message with server-assigned ID
   */
  async sendMessage(message) {
    const startTime = Date.now();
    try {
      if (!message.content) {
        throw new Error('Message content is required');
      }
      
      if (!message.sessionId) {
        throw new Error('Session ID is required');
      }
      
      // Make API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();
      const sentMessage = data.message;
      
      // Update stats
      this._messageCount++;
      this._lastMessageTimestamp = sentMessage.timestamp;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('message', 'sendMessage', duration, {
        success: true,
        messageLength: message.content.length,
        totalMessages: this._messageCount,
        timeSinceLastMessage: this._lastMessageTimestamp ? 
          Date.now() - new Date(this._lastMessageTimestamp).getTime() : null
      });
      
      return sentMessage;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('message', 'sendMessage', error);
      this._monitor.trackOperationTiming('message', 'sendMessage', duration, {
        success: false,
        messageLength: message.content.length
      });
      console.error('[MessageService] Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Delete a message
   * @param {string} messageId - ID of the message to delete
   * @param {string} sessionId - User's session ID (for verification)
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteMessage(messageId, sessionId) {
    const startTime = Date.now();
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }
      
      // Make API request
      const response = await fetch(`${this.apiEndpoint}/${messageId}`, {
        method: 'DELETE',
        headers: this._getHeaders(),
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status}`);
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('message', 'deleteMessage', duration, {
        success: true,
        messageId,
        totalMessages: this._messageCount
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('message', 'deleteMessage', error);
      this._monitor.trackOperationTiming('message', 'deleteMessage', duration, {
        success: false,
        messageId
      });
      console.error('[MessageService] Error deleting message:', error);
      throw error;
    }
  }
  
  /**
   * Report a message for moderation
   * @param {string} messageId - ID of the message to report
   * @param {string} sessionId - User's session ID
   * @param {string} reason - Reason for reporting
   * @returns {Promise<boolean>} - True if report was successful
   */
  async reportMessage(messageId, sessionId, reason) {
    const startTime = Date.now();
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }
      
      // Make API request
      const response = await fetch(`${this.apiEndpoint}/${messageId}/report`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          sessionId,
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to report message: ${response.status}`);
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('message', 'reportMessage', duration, {
        success: true,
        messageId,
        reason
      });
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('message', 'reportMessage', error);
      this._monitor.trackOperationTiming('message', 'reportMessage', duration, {
        success: false,
        messageId,
        reason
      });
      console.error('[MessageService] Error reporting message:', error);
      throw error;
    }
  }
  
  /**
   * Get common headers for API requests
   * @returns {Object} - Headers object
   * @private
   */
  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this._getAuthToken()}`
    };
  }
  
  /**
   * Get authentication token from storage
   * @returns {string} - Authentication token
   * @private
   */
  _getAuthToken() {
    return localStorage.getItem('accessToken') || '';
  }
}

export { MessageService };
export default MessageService; 