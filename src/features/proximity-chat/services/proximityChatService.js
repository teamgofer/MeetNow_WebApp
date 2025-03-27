/**
 * Service for the proximity chat functionality
 */

import { API, TIMING } from '../constants';
import { authFetch } from '../../../utils/authUtils';
import { EventEmitter } from '../../utils/EventEmitter';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * ProximityChatService integrates WebSocketService, LocationService, and MessageService 
 * to provide a complete proximity-based chat solution
 */
class ProximityChatService {
  /**
   * @param {Object} options
   * @param {WebSocketService} options.webSocketService - Service for managing WebSocket connection
   * @param {LocationService} options.locationService - Service for tracking user location
   * @param {MessageService} options.messageService - Service for persistent message handling
   */
  constructor({ webSocketService, locationService, messageService }) {
    this.webSocketService = webSocketService;
    this.locationService = locationService; 
    this.messageService = messageService;
    
    // Event emitters
    this._messagesEmitter = new EventEmitter();
    this._nearbyUsersEmitter = new EventEmitter();
    this._connectionStatusEmitter = new EventEmitter();
    this._errorEmitter = new EventEmitter();
    
    // Bind methods that will be used as callbacks
    this._handleLocationChange = this._handleLocationChange.bind(this);
    this._handleMessages = this._handleMessages.bind(this);
    this._handleNearbyUsers = this._handleNearbyUsers.bind(this);
    this._handleConnectionStatus = this._handleConnectionStatus.bind(this);
    this._handleWebSocketError = this._handleWebSocketError.bind(this);
    this._handleLocationError = this._handleLocationError.bind(this);
    
    // State
    this._connected = false;
    this._currentUserId = null;
    this._sessionOptions = null;
    this._messageCount = 0;
    this._userCount = 0;
    this._lastLocationUpdate = null;
    this._lastMessageTimestamp = null;

    // Initialize performance monitor
    this._monitor = PerformanceMonitor;
  }
  
  /**
   * Initialize the proximity chat service
   * @param {Object} options 
   * @param {string} options.sessionId - Current user session ID
   * @param {number} options.radius - Chat radius in meters (optional)
   * @param {Object} options.chatSettings - Chat settings (optional)
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    const startTime = Date.now();
    try {
      this._sessionOptions = options;
      this._currentUserId = options.sessionId;
      
      // Register event handlers
      this.webSocketService.onMessage(this._handleMessages);
      this.webSocketService.onNearbyUsers(this._handleNearbyUsers);
      this.webSocketService.onConnectionStatus(this._handleConnectionStatus);
      this.webSocketService.onError(this._handleWebSocketError);
      this.locationService.onLocationChange(this._handleLocationChange);
      this.locationService.onError(this._handleLocationError);
      
      // Connect to WebSocket server
      const wsStartTime = Date.now();
      await this.webSocketService.connect({
        sessionId: options.sessionId,
        radius: options.radius,
        initialLocation: await this.locationService.getCurrentLocation(),
      });
      const wsDuration = Date.now() - wsStartTime;
      this._monitor.trackOperationTiming('websocket', 'connect', wsDuration, {
        success: true,
        sessionId: options.sessionId
      });
      
      // Start tracking location
      const locStartTime = Date.now();
      await this.locationService.startTracking();
      const locDuration = Date.now() - locStartTime;
      this._monitor.trackOperationTiming('location', 'startTracking', locDuration, {
        success: true,
        sessionId: options.sessionId
      });
      
      // Load message history
      const historyStartTime = Date.now();
      await this.loadMessageHistory();
      const historyDuration = Date.now() - historyStartTime;
      this._monitor.trackOperationTiming('chat', 'loadHistory', historyDuration, {
        success: true,
        sessionId: options.sessionId
      });
      
      const totalDuration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'initialize', totalDuration, {
        success: true,
        sessionId: options.sessionId,
        components: {
          websocket: wsDuration,
          location: locDuration,
          history: historyDuration
        }
      });
      
      this._connected = true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'initialize', error);
      this._monitor.trackOperationTiming('chat', 'initialize', duration, {
        success: false,
        sessionId: options.sessionId
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Clean up and disconnect the proximity chat service
   * @returns {Promise<void>}
   */
  async cleanup() {
    const startTime = Date.now();
    try {
      // Unregister event handlers
      this.webSocketService.offMessage(this._handleMessages);
      this.webSocketService.offNearbyUsers(this._handleNearbyUsers);
      this.webSocketService.offConnectionStatus(this._handleConnectionStatus);
      this.webSocketService.offError(this._handleWebSocketError);
      this.locationService.offLocationChange(this._handleLocationChange);
      this.locationService.offError(this._handleLocationError);
      
      // Disconnect and stop tracking
      if (this.webSocketService) {
        await this.webSocketService.disconnect();
      }
      
      if (this.locationService) {
        await this.locationService.stopTracking();
      }
      
      this._connected = false;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'cleanup', duration, {
        success: true,
        sessionId: this._currentUserId,
        stats: {
          totalMessages: this._messageCount,
          totalUsers: this._userCount,
          lastLocationUpdate: this._lastLocationUpdate,
          lastMessageTimestamp: this._lastMessageTimestamp
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'cleanup', error);
      this._monitor.trackOperationTiming('chat', 'cleanup', duration, {
        success: false,
        sessionId: this._currentUserId
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Check if the service is connected to the WebSocket server
   * @returns {boolean}
   */
  isConnected() {
    return this._connected;
  }
  
  /**
   * Send a chat message
   * @param {string} content - Message content
   * @param {Object} metadata - Additional message metadata (optional)
   * @returns {Promise<Object>} - The sent message
   */
  async sendMessage(content, metadata = {}) {
    const startTime = Date.now();
    try {
      // Send message through WebSocket for real-time delivery
      const wsStartTime = Date.now();
      await this.webSocketService.sendMessage(content, metadata);
      const wsDuration = Date.now() - wsStartTime;
      this._monitor.trackOperationTiming('websocket', 'sendMessage', wsDuration, {
        success: true,
        messageLength: content.length
      });
      
      // Also persist the message via the API
      const apiStartTime = Date.now();
      const message = await this.messageService.sendMessage({
        content,
        sessionId: this._currentUserId,
        timestamp: new Date().toISOString(),
        ...metadata
      });
      const apiDuration = Date.now() - apiStartTime;
      this._monitor.trackOperationTiming('api', 'sendMessage', apiDuration, {
        success: true,
        messageLength: content.length
      });
      
      this._messageCount++;
      this._lastMessageTimestamp = new Date().toISOString();
      
      const totalDuration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'sendMessage', totalDuration, {
        success: true,
        messageLength: content.length,
        components: {
          websocket: wsDuration,
          api: apiDuration
        }
      });
      
      return message;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'sendMessage', error);
      this._monitor.trackOperationTiming('chat', 'sendMessage', duration, {
        success: false,
        messageLength: content.length
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Update the user's typing status
   * @param {boolean} isTyping - Whether the user is typing
   * @returns {Promise<void>}
   */
  async setTypingStatus(isTyping) {
    const startTime = Date.now();
    try {
      await this.webSocketService.setTypingStatus(isTyping);
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'setTypingStatus', duration, {
        success: true,
        isTyping
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'setTypingStatus', error);
      this._monitor.trackOperationTiming('chat', 'setTypingStatus', duration, {
        success: false,
        isTyping
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Load message history
   * @param {Object} options - Options for loading message history
   * @param {number} options.limit - Maximum number of messages to load
   * @param {string} options.before - Load messages before this timestamp
   * @returns {Promise<Array>} - Array of messages
   */
  async loadMessageHistory(options = {}) {
    const startTime = Date.now();
    try {
      const messages = await this.messageService.getMessages({
        sessionId: this._currentUserId,
        ...this._sessionOptions,
        ...options
      });
      
      if (messages && messages.length > 0) {
        this._messagesEmitter.emit(messages);
        this._messageCount += messages.length;
        this._lastMessageTimestamp = messages[0].timestamp;
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'loadHistory', duration, {
        success: true,
        messageCount: messages?.length || 0,
        ...options
      });
      
      return messages;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'loadHistory', error);
      this._monitor.trackOperationTiming('chat', 'loadHistory', duration, {
        success: false,
        ...options
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Update the chat radius
   * @param {number} radius - New chat radius in meters
   * @returns {Promise<void>}
   */
  async updateRadius(radius) {
    const startTime = Date.now();
    try {
      await this.webSocketService.updateRadius(radius);
      this._sessionOptions.radius = radius;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'updateRadius', duration, {
        success: true,
        newRadius: radius,
        oldRadius: this._sessionOptions.radius
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'updateRadius', error);
      this._monitor.trackOperationTiming('chat', 'updateRadius', duration, {
        success: false,
        newRadius: radius
      });
      this._handleError(error);
      throw error;
    }
  }
  
  /**
   * Register a callback for incoming messages
   * @param {Function} callback - Function to call with messages
   * @returns {Function} - Function to remove the listener
   */
  onMessages(callback) {
    return this._messagesEmitter.on(callback);
  }
  
  /**
   * Register a callback for nearby users updates
   * @param {Function} callback - Function to call with nearby users
   * @returns {Function} - Function to remove the listener
   */
  onNearbyUsers(callback) {
    return this._nearbyUsersEmitter.on(callback);
  }
  
  /**
   * Register a callback for connection status updates
   * @param {Function} callback - Function to call with connection status
   * @returns {Function} - Function to remove the listener
   */
  onConnectionStatus(callback) {
    return this._connectionStatusEmitter.on(callback);
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
   * Handle location changes from LocationService
   * @param {Object} location - New location
   * @private
   */
  _handleLocationChange(location) {
    const startTime = Date.now();
    try {
      this.webSocketService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      });
      
      this._lastLocationUpdate = new Date().toISOString();
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'handleLocationChange', duration, {
        success: true,
        accuracy: location.accuracy,
        timeSinceLastUpdate: this._lastLocationUpdate ? 
          Date.now() - new Date(this._lastLocationUpdate).getTime() : null
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'handleLocationChange', error);
      this._monitor.trackOperationTiming('chat', 'handleLocationChange', duration, {
        success: false
      });
      this._handleError(error);
    }
  }
  
  /**
   * Handle incoming messages from WebSocketService
   * @param {Object} data - Message data
   * @private
   */
  _handleMessages(data) {
    const startTime = Date.now();
    try {
      // Format might be a single message or an array
      const messages = Array.isArray(data) ? data : [data];
      this._messagesEmitter.emit(messages);
      
      this._messageCount += messages.length;
      this._lastMessageTimestamp = messages[0].timestamp;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'handleMessages', duration, {
        success: true,
        messageCount: messages.length,
        totalMessages: this._messageCount,
        timeSinceLastMessage: this._lastMessageTimestamp ? 
          Date.now() - new Date(this._lastMessageTimestamp).getTime() : null
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'handleMessages', error);
      this._monitor.trackOperationTiming('chat', 'handleMessages', duration, {
        success: false
      });
      this._handleError(error);
    }
  }
  
  /**
   * Handle nearby users updates from WebSocketService
   * @param {Array} users - Nearby users
   * @private
   */
  _handleNearbyUsers(users) {
    const startTime = Date.now();
    try {
      this._nearbyUsersEmitter.emit(users);
      
      this._userCount = users.length;
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'handleNearbyUsers', duration, {
        success: true,
        userCount: users.length,
        timeSinceLastLocationUpdate: this._lastLocationUpdate ? 
          Date.now() - new Date(this._lastLocationUpdate).getTime() : null
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'handleNearbyUsers', error);
      this._monitor.trackOperationTiming('chat', 'handleNearbyUsers', duration, {
        success: false
      });
      this._handleError(error);
    }
  }
  
  /**
   * Handle WebSocket connection status changes
   * @param {boolean} connected - Connection status
   * @private
   */
  _handleConnectionStatus(connected) {
    const startTime = Date.now();
    try {
      this._connected = connected;
      this._connectionStatusEmitter.emit(connected);
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('chat', 'handleConnectionStatus', duration, {
        success: true,
        connected,
        stats: {
          totalMessages: this._messageCount,
          totalUsers: this._userCount,
          lastLocationUpdate: this._lastLocationUpdate,
          lastMessageTimestamp: this._lastMessageTimestamp
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('chat', 'handleConnectionStatus', error);
      this._monitor.trackOperationTiming('chat', 'handleConnectionStatus', duration, {
        success: false,
        connected
      });
      this._handleError(error);
    }
  }
  
  /**
   * Handle WebSocket errors
   * @param {Error} error - WebSocket error
   * @private
   */
  _handleWebSocketError(error) {
    this._monitor.trackError('chat', 'websocket', error);
    this._handleError(error);
  }
  
  /**
   * Handle location service errors
   * @param {Error} error - Location service error
   * @private
   */
  _handleLocationError(error) {
    this._monitor.trackError('chat', 'location', error);
    this._handleError(error);
  }
  
  /**
   * Generic error handler that emits errors to listeners
   * @param {Object|string} error - Error data
   * @private
   */
  _handleError(error) {
    console.error('[ProximityChatService] Error:', error);
    this._errorEmitter.emit(error);
  }
}

export { ProximityChatService };
export default ProximityChatService; 