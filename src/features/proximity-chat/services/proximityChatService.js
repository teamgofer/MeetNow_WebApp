/**
 * Service for the proximity chat functionality
 */

import { API, TIMING } from '../constants';
import { authFetch } from '../../../utils/authUtils';

/**
 * Class for managing WebSocket connection to proximity chat service
 */
class ProximityChatService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.handlers = {
      onMessage: () => {},
      onConnect: () => {},
      onDisconnect: () => {},
      onUserJoined: () => {},
      onUserLeft: () => {},
      onLocationUpdate: () => {},
      onTypingStatusChange: () => {},
      onError: () => {},
    };
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Initialize the WebSocket connection
   * 
   * @param {string} userId - Current user's ID
   * @param {Object} options - Connection options
   * @param {Object} options.location - Initial location {latitude, longitude}
   * @param {number} options.radius - Proximity radius in meters
   * @param {Object} callbacks - Callback functions for events
   * @returns {Promise<void>} Promise that resolves when connected
   */
  async connect(userId, options = {}, callbacks = {}) {
    if (!userId) {
      throw new Error('User ID is required to establish connection');
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Update event handlers with provided callbacks
    this.handlers = {
      ...this.handlers,
      ...callbacks
    };
    
    // Generate auth token for connection
    let token;
    try {
      token = await this.getAuthToken(userId);
    } catch (error) {
      this.handlers.onError({
        message: 'Failed to get authentication token',
        details: error
      });
      this.scheduleReconnect();
      return;
    }
    
    // Build WebSocket URL with query parameters
    const wsUrl = this.buildWebSocketUrl(userId, token, options);
    
    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      // Create new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this.handleSocketOpen.bind(this);
      this.socket.onclose = this.handleSocketClose.bind(this);
      this.socket.onerror = this.handleSocketError.bind(this);
      this.socket.onmessage = this.handleSocketMessage.bind(this);
    } catch (error) {
      this.handlers.onError({
        message: 'Failed to establish WebSocket connection',
        details: error
      });
      this.scheduleReconnect();
    }
  }
  
  /**
   * Disconnect from the chat service
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.connected = false;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Send a message to users within proximity
   * 
   * @param {Object} message - Message to send
   * @param {string} message.content - Message text content
   * @param {string} message.regionId - ID of the region
   * @param {string} [message.tempId] - Temporary ID for tracking message status
   * @returns {Promise<Object>} Promise resolving to the sent message
   */
  async sendMessage(message) {
    if (!this.connected || !this.socket) {
      throw new Error('Not connected to chat service');
    }
    
    const messagePayload = {
      type: API.MESSAGE_TYPES.MESSAGE,
      payload: {
        ...message,
        timestamp: Date.now()
      }
    };
    
    this.socket.send(JSON.stringify(messagePayload));
    return messagePayload.payload;
  }
  
  /**
   * Update the user's location
   * 
   * @param {Object} location - New location
   * @param {number} location.latitude - Latitude coordinate
   * @param {number} location.longitude - Longitude coordinate
   * @param {number} [location.accuracy] - Location accuracy in meters
   * @returns {void}
   */
  updateLocation(location) {
    if (!this.connected || !this.socket) {
      return;
    }
    
    const locationPayload = {
      type: API.MESSAGE_TYPES.LOCATION_UPDATE,
      payload: {
        ...location,
        timestamp: Date.now()
      }
    };
    
    this.socket.send(JSON.stringify(locationPayload));
  }
  
  /**
   * Update typing status
   * 
   * @param {boolean} isTyping - Whether the user is typing
   * @param {string} regionId - ID of the region
   * @returns {void}
   */
  updateTypingStatus(isTyping, regionId) {
    if (!this.connected || !this.socket) {
      return;
    }
    
    const typingPayload = {
      type: API.MESSAGE_TYPES.TYPING,
      payload: {
        isTyping,
        regionId,
        timestamp: Date.now()
      }
    };
    
    this.socket.send(JSON.stringify(typingPayload));
  }
  
  /**
   * Fetch nearby users
   * 
   * @param {Object} location - User's location
   * @param {number} location.latitude - Latitude coordinate
   * @param {number} location.longitude - Longitude coordinate
   * @param {number} [radius=150] - Search radius in meters
   * @returns {Promise<Array>} Promise resolving to array of nearby users
   */
  async fetchNearbyUsers(location, radius = 150) {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Valid location required');
    }
    
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: radius.toString()
    });
    
    try {
      const response = await authFetch(
        `${API.BASE_URL}/users/nearby?${params.toString()}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch nearby users: ${errorData.message || response.statusText}`
        );
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      throw error;
    }
  }
  
  /**
   * Get authentication token for WebSocket connection
   * 
   * @param {string} userId - Current user's ID
   * @returns {Promise<string>} Promise resolving to auth token
   * @private
   */
  async getAuthToken(userId) {
    try {
      const response = await authFetch(
        `${API.BASE_URL}/chat/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get chat token: ${errorData.message || response.statusText}`
        );
      }
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }
  
  /**
   * Build WebSocket URL with authentication and parameters
   * 
   * @param {string} userId - Current user's ID
   * @param {string} token - Authentication token
   * @param {Object} options - Connection options
   * @returns {string} WebSocket URL
   * @private
   */
  buildWebSocketUrl(userId, token, options = {}) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBase = API.WEBSOCKET_URL.startsWith('/')
      ? `${wsProtocol}//${window.location.host}${API.WEBSOCKET_URL}`
      : API.WEBSOCKET_URL;
    
    const params = new URLSearchParams({
      userId,
      token,
      ...options.location && {
        latitude: options.location.latitude.toString(),
        longitude: options.location.longitude.toString()
      },
      ...options.radius && { radius: options.radius.toString() }
    });
    
    return `${wsBase}?${params.toString()}`;
  }
  
  /**
   * Handle WebSocket open event
   * 
   * @param {Event} event - WebSocket open event
   * @private
   */
  handleSocketOpen(event) {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.handlers.onConnect(event);
  }
  
  /**
   * Handle WebSocket close event
   * 
   * @param {CloseEvent} event - WebSocket close event
   * @private
   */
  handleSocketClose(event) {
    this.connected = false;
    this.handlers.onDisconnect(event);
    
    // Schedule reconnect if not intentionally closed
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   * 
   * @param {Event} event - WebSocket error event
   * @private
   */
  handleSocketError(event) {
    this.handlers.onError({
      message: 'WebSocket error',
      details: event
    });
  }
  
  /**
   * Handle incoming WebSocket messages
   * 
   * @param {MessageEvent} event - WebSocket message event
   * @private
   */
  handleSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case API.MESSAGE_TYPES.MESSAGE:
          this.handlers.onMessage(data.payload);
          break;
        
        case API.MESSAGE_TYPES.USER_JOINED:
          this.handlers.onUserJoined(data.payload);
          break;
        
        case API.MESSAGE_TYPES.USER_LEFT:
          this.handlers.onUserLeft(data.payload);
          break;
        
        case API.MESSAGE_TYPES.LOCATION_UPDATE:
          this.handlers.onLocationUpdate(data.payload);
          break;
        
        case API.MESSAGE_TYPES.TYPING:
          this.handlers.onTypingStatusChange(data.payload);
          break;
        
        case API.MESSAGE_TYPES.ERROR:
          this.handlers.onError(data.payload);
          break;
        
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Schedule a reconnection attempt
   * 
   * @private
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts += 1;
    
    // Exponential backoff with jitter
    const baseDelay = TIMING.RECONNECT_INTERVAL;
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(
      baseDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      maxDelay
    );
    
    // Add jitter (±20%)
    const jitter = (Math.random() * 0.4 - 0.2) * delay;
    const finalDelay = delay + jitter;
    
    this.reconnectTimer = setTimeout(() => {
      // Reconnect with same user ID and handlers
      this.connect();
    }, finalDelay);
  }
}

// Export singleton instance
export default new ProximityChatService(); 