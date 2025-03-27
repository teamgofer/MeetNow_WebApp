import { EventEmitter } from '../../utils/EventEmitter';
import { API_ENDPOINTS } from '../constants';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * Service for managing WebSocket connections to the proximity chat server
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.endpoint = API_ENDPOINTS.WEBSOCKET;
    
    // Event emitters
    this._messageEmitter = new EventEmitter();
    this._nearbyUsersEmitter = new EventEmitter();
    this._connectionStatusEmitter = new EventEmitter();
    this._errorEmitter = new EventEmitter();
    
    // Reconnection state
    this._reconnectTimer = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 10;
    this._reconnectDelay = 1000; // Start with 1 second
    this._connectionOptions = null;
    
    // Bind event handlers
    this._handleOpen = this._handleOpen.bind(this);
    this._handleClose = this._handleClose.bind(this);
    this._handleError = this._handleError.bind(this);
    this._handleMessage = this._handleMessage.bind(this);

    // Initialize performance monitor
    this._monitor = PerformanceMonitor;
  }
  
  /**
   * Connect to the WebSocket server
   * @param {Object} options - Connection options
   * @param {string} options.sessionId - User's session ID
   * @param {Object} options.initialLocation - Initial user location
   * @param {number} options.radius - Chat radius in meters
   * @returns {Promise<void>} - Resolves when connected
   */
  async connect(options = {}) {
    const startTime = Date.now();
    try {
      // Store options for reconnection
      this._connectionOptions = options;
      this.sessionId = options.sessionId;
      
      // Create the WebSocket URL with query parameters
      const wsUrl = this._buildWebSocketUrl(options);
      
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }
      
      // Create new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this._handleOpen;
      this.socket.onclose = this._handleClose;
      this.socket.onerror = this._handleError;
      this.socket.onmessage = this._handleMessage;
      
      // Wait for connection to establish or fail
      return new Promise((resolve, reject) => {
        // Set timeout for connection
        const timeout = setTimeout(() => {
          const duration = Date.now() - startTime;
          this._monitor.trackError('websocket', 'connect', new Error('WebSocket connection timeout'));
          this._monitor.trackOperationTiming('websocket', 'connect', duration, {
            success: false,
            reason: 'timeout',
            sessionId: options.sessionId
          });
          reject(new Error('WebSocket connection timeout'));
          
          // Don't leave listeners around if we timeout
          if (this.socket) {
            this.socket.onopen = null;
            this.socket.onerror = null;
          }
        }, 10000); // 10 second timeout
        
        // Store original handlers
        const originalOnOpen = this.socket.onopen;
        const originalOnError = this.socket.onerror;
        
        // Connection success handler
        this.socket.onopen = (event) => {
          clearTimeout(timeout);
          const duration = Date.now() - startTime;
          this._monitor.trackOperationTiming('websocket', 'connect', duration, {
            success: true,
            sessionId: options.sessionId
          });
          // Restore original handler
          this.socket.onopen = originalOnOpen;
          this.socket.onerror = originalOnError;
          // Call the original handler if it exists
          if (originalOnOpen) originalOnOpen(event);
          resolve();
        };
        
        // Connection error handler
        this.socket.onerror = (err) => {
          clearTimeout(timeout);
          const duration = Date.now() - startTime;
          this._monitor.trackError('websocket', 'connect', err);
          this._monitor.trackOperationTiming('websocket', 'connect', duration, {
            success: false,
            reason: 'error',
            sessionId: options.sessionId
          });
          // Restore original handler
          this.socket.onopen = originalOnOpen;
          this.socket.onerror = originalOnError;
          // Call the original handler if it exists
          if (originalOnError) originalOnError(err);
          reject(err);
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'connect', error);
      this._monitor.trackOperationTiming('websocket', 'connect', duration, {
        success: false,
        reason: 'exception',
        sessionId: options.sessionId
      });
      this._notifyError(error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    const startTime = Date.now();
    try {
      // Clear any reconnection timer
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
      }
      
      // Close the socket if it exists
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      
      // Reset reconnection state
      this._reconnectAttempts = 0;
      this._connectionStatusEmitter.emit(false);

      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'disconnect', duration, {
        success: true,
        sessionId: this.sessionId
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'disconnect', error);
      this._monitor.trackOperationTiming('websocket', 'disconnect', duration, {
        success: false,
        sessionId: this.sessionId
      });
      throw error;
    }
  }
  
  /**
   * Check if connected to WebSocket server
   * @returns {boolean} - True if connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Send a message to nearby users
   * @param {string} content - Message content
   * @param {Object} metadata - Additional message metadata
   * @returns {Promise<void>}
   */
  async sendMessage(content, metadata = {}) {
    const startTime = Date.now();
    if (!this.isConnected()) {
      const error = new Error('Not connected to WebSocket server');
      this._monitor.trackError('websocket', 'sendMessage', error);
      this._monitor.trackOperationTiming('websocket', 'sendMessage', 0, {
        success: false,
        reason: 'not_connected',
        messageLength: content.length
      });
      throw error;
    }
    
    try {
      const message = {
        type: 'message',
        data: {
          content,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };
      
      this.socket.send(JSON.stringify(message));
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'sendMessage', duration, {
        success: true,
        messageLength: content.length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'sendMessage', error);
      this._monitor.trackOperationTiming('websocket', 'sendMessage', duration, {
        success: false,
        messageLength: content.length
      });
      throw error;
    }
  }
  
  /**
   * Update the user's location
   * @param {Object} location - User's location
   * @param {number} location.latitude - Latitude coordinate
   * @param {number} location.longitude - Longitude coordinate
   * @param {number} location.accuracy - Location accuracy in meters
   * @returns {Promise<void>}
   */
  async updateLocation(location) {
    if (!this.isConnected()) {
      return;
    }
    
    const locationUpdate = {
      type: 'location',
      data: {
        sessionId: this.sessionId,
        ...location,
        timestamp: location.timestamp || new Date().toISOString()
      }
    };
    
    this.socket.send(JSON.stringify(locationUpdate));
  }
  
  /**
   * Update the user's typing status
   * @param {boolean} isTyping - Whether the user is typing
   * @returns {Promise<void>}
   */
  async setTypingStatus(isTyping) {
    const startTime = Date.now();
    if (!this.isConnected()) {
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'setTypingStatus', duration, {
        success: false,
        reason: 'not_connected'
      });
      return;
    }
    
    try {
      const typingStatus = {
        type: 'typing',
        data: {
          sessionId: this.sessionId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      };
      
      this.socket.send(JSON.stringify(typingStatus));
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'setTypingStatus', duration, {
        success: true,
        isTyping
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'setTypingStatus', error);
      this._monitor.trackOperationTiming('websocket', 'setTypingStatus', duration, {
        success: false,
        isTyping
      });
      throw error;
    }
  }
  
  /**
   * Update the proximity chat radius
   * @param {number} radius - New radius in meters
   * @returns {Promise<void>}
   */
  async updateRadius(radius) {
    const startTime = Date.now();
    if (!this.isConnected()) {
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'updateRadius', duration, {
        success: false,
        reason: 'not_connected',
        newRadius: radius
      });
      return;
    }
    
    try {
      const radiusUpdate = {
        type: 'update_radius',
        data: {
          sessionId: this.sessionId,
          radius,
          timestamp: new Date().toISOString()
        }
      };
      
      this.socket.send(JSON.stringify(radiusUpdate));
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'updateRadius', duration, {
        success: true,
        newRadius: radius
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'updateRadius', error);
      this._monitor.trackOperationTiming('websocket', 'updateRadius', duration, {
        success: false,
        newRadius: radius
      });
      throw error;
    }
  }
  
  /**
   * Register a callback for incoming messages
   * @param {Function} callback - Function to call with message data
   * @returns {Function} - Function to remove the listener
   */
  onMessage(callback) {
    return this._messageEmitter.on(callback);
  }
  
  /**
   * Unregister a message callback
   * @param {Function} callback - The callback to remove
   */
  offMessage(callback) {
    this._messageEmitter.off(callback);
  }
  
  /**
   * Register a callback for nearby users updates
   * @param {Function} callback - Function to call with nearby users data
   * @returns {Function} - Function to remove the listener
   */
  onNearbyUsers(callback) {
    return this._nearbyUsersEmitter.on(callback);
  }
  
  /**
   * Unregister a nearby users callback
   * @param {Function} callback - The callback to remove
   */
  offNearbyUsers(callback) {
    this._nearbyUsersEmitter.off(callback);
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
   * Unregister a connection status callback
   * @param {Function} callback - The callback to remove
   */
  offConnectionStatus(callback) {
    this._connectionStatusEmitter.off(callback);
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
   * Build WebSocket URL with query parameters
   * @param {Object} options - Connection options
   * @returns {string} - WebSocket URL
   * @private
   */
  _buildWebSocketUrl(options) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBase = this.endpoint.startsWith('/')
      ? `${wsProtocol}//${window.location.host}${this.endpoint}`
      : this.endpoint;
    
    const params = new URLSearchParams({
      sessionId: options.sessionId,
      ...(options.initialLocation && {
        latitude: options.initialLocation.latitude.toString(),
        longitude: options.initialLocation.longitude.toString()
      }),
      ...(options.radius && {
        radius: options.radius.toString()
      })
    });
    
    return `${wsBase}?${params.toString()}`;
  }
  
  /**
   * Handle WebSocket open event
   * @param {Event} event - WebSocket event
   * @private
   */
  _handleOpen(event) {
    // Reset reconnection attempts on successful connection
    this._reconnectAttempts = 0;
    
    // Notify connection status
    this._connectionStatusEmitter.emit(true);
  }
  
  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   * @private
   */
  _handleClose(event) {
    // Notify disconnection
    this._connectionStatusEmitter.emit(false);
    
    // Track close event
    this._monitor.trackOperationTiming('websocket', 'close', 0, {
      success: true,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      reconnectAttempts: this._reconnectAttempts
    });
    
    // Attempt to reconnect if not closed cleanly and not max attempts
    if (event.code !== 1000 && event.code !== 1001) {
      this._scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param {Event} event - WebSocket error event
   * @private
   */
  _handleError(event) {
    const error = event && event.message ? event.message : 'WebSocket connection error';
    this._monitor.trackError('websocket', 'error', error);
    this._notifyError(error);
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   * @private
   */
  _handleMessage(event) {
    const startTime = Date.now();
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'message':
          this._messageEmitter.emit(message.data);
          break;
          
        case 'nearby_users':
          this._nearbyUsersEmitter.emit(message.data);
          break;
          
        case 'error':
          this._notifyError(message.data);
          break;
          
        default:
          console.warn('[WebSocketService] Unknown message type:', message.type);
      }
      
      const duration = Date.now() - startTime;
      this._monitor.trackOperationTiming('websocket', 'handleMessage', duration, {
        success: true,
        messageType: message.type
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this._monitor.trackError('websocket', 'handleMessage', error);
      this._monitor.trackOperationTiming('websocket', 'handleMessage', duration, {
        success: false
      });
      console.error('[WebSocketService] Error parsing message:', error);
      this._notifyError(`Error parsing WebSocket message: ${error.message}`);
    }
  }
  
  /**
   * Schedule a reconnection attempt with exponential backoff
   * @private
   */
  _scheduleReconnect() {
    // Clear any existing reconnect timer
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
    }
    
    // Check if max attempts reached
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this._monitor.trackError('websocket', 'reconnect', new Error('Maximum reconnection attempts reached'));
      this._notifyError('Maximum reconnection attempts reached');
      return;
    }
    
    // Increment attempt counter
    this._reconnectAttempts++;
    
    // Calculate delay with exponential backoff and jitter
    const baseDelay = this._reconnectDelay * Math.pow(1.5, this._reconnectAttempts - 1);
    const jitter = 0.2 * baseDelay; // 20% jitter
    const delay = baseDelay + (Math.random() * jitter - jitter / 2);
    
    // Track reconnection attempt
    this._monitor.trackOperationTiming('websocket', 'reconnect', delay, {
      success: false,
      attempt: this._reconnectAttempts,
      maxAttempts: this._maxReconnectAttempts
    });
    
    // Schedule reconnection
    this._reconnectTimer = setTimeout(() => {
      if (this._connectionOptions) {
        this.connect(this._connectionOptions).catch(error => {
          console.error('[WebSocketService] Reconnection failed:', error);
          // If reconnection fails, schedule another attempt
          this._scheduleReconnect();
        });
      }
    }, delay);
  }
  
  /**
   * Notify error listeners
   * @param {Error|string} error - Error to notify
   * @private
   */
  _notifyError(error) {
    console.error('[WebSocketService] Error:', error);
    this._errorEmitter.emit(error);
  }
}

export { WebSocketService };
export default WebSocketService; 