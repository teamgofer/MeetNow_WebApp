/**
 * Mock WebSocket server for proximity chat testing
 * This server simulates the backend WebSocket service for local development and testing
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const crypto = require('crypto');

class ProximityChatMockServer {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.server = null;
    this.wss = null;
    
    // In-memory storage
    this.connectedClients = new Map(); // sessionId -> WebSocket
    this.userLocations = new Map();    // sessionId -> location
    this.messages = [];                // message history
    this.typingStatus = new Map();     // sessionId -> isTyping
    
    // Configuration
    this.proximityRadius = options.proximityRadius || 200; // meters
    this.messageExpiryTime = options.messageExpiryTime || 3600000; // 1 hour
    this.verbose = options.verbose || false;
  }

  /**
   * Start the mock server
   * @returns {Promise<void>} Resolves when server is started
   */
  start() {
    return new Promise((resolve) => {
      this.server = http.createServer();
      this.wss = new WebSocket.Server({ server: this.server });
      
      this.wss.on('connection', this._handleConnection.bind(this));
      
      this.server.listen(this.port, () => {
        console.log(`Proximity chat mock server running on port ${this.port}`);
        resolve();
      });
      
      // Set up periodic cleanup
      this._startCleanupInterval();
    });
  }

  /**
   * Stop the mock server
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.wss) {
      this.wss.clients.forEach(client => {
        client.close();
      });
      
      this.wss.close();
    }
    
    if (this.server) {
      this.server.close();
      console.log('Proximity chat mock server stopped');
    }
  }

  /**
   * Get mock authentication token
   * @param {Object} location - User location
   * @param {string} sessionId - User session ID
   * @returns {string} Authentication token
   */
  generateAuthToken(location, sessionId) {
    // In a real system, this would validate credentials and generate a real token
    // For testing, we just create a simple hash
    const data = JSON.stringify({ location, sessionId, timestamp: Date.now() });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify mock token
   * @param {string} token - Token to verify
   * @returns {boolean} Whether token is valid
   */
  verifyToken(token) {
    // In testing, we accept any token
    return true;
  }

  /**
   * Handle new WebSocket connection
   * @private
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} req - HTTP request
   */
  _handleConnection(ws, req) {
    // Parse connection parameters
    const queryParams = url.parse(req.url, true).query;
    const token = queryParams.token;
    
    if (!token || !this.verifyToken(token)) {
      this._sendError(ws, 'Invalid authentication token');
      ws.close(4001, 'Authentication failed');
      return;
    }
    
    // Generate a session ID if not provided (in real system would be from token)
    const sessionId = queryParams.sessionId || `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Store client reference
    this.connectedClients.set(sessionId, ws);
    
    this._log(`Client connected: ${sessionId}`);
    
    // Set up message handler
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this._handleMessage(sessionId, message);
      } catch (err) {
        this._sendError(ws, 'Invalid message format');
      }
    });
    
    // Set up close handler
    ws.on('close', () => {
      this._handleDisconnect(sessionId);
    });
    
    // Set up error handler
    ws.on('error', (error) => {
      this._log(`WebSocket error for ${sessionId}:`, error);
      this._handleDisconnect(sessionId);
    });
    
    // Notify client of successful connection
    this._sendToClient(sessionId, {
      type: 'connection_status',
      data: {
        connected: true,
        sessionId
      }
    });
  }

  /**
   * Handle incoming message
   * @private
   * @param {string} sessionId - Client session ID
   * @param {Object} message - Message object
   */
  _handleMessage(sessionId, message) {
    this._log(`Received message from ${sessionId}:`, message);
    
    switch (message.type) {
      case 'location_update':
        this._handleLocationUpdate(sessionId, message.data);
        break;
        
      case 'message':
        this._handleChatMessage(sessionId, message.data);
        break;
        
      case 'typing_status':
        this._handleTypingStatus(sessionId, message.data);
        break;
        
      default:
        const ws = this.connectedClients.get(sessionId);
        if (ws) {
          this._sendError(ws, `Unknown message type: ${message.type}`);
        }
    }
  }

  /**
   * Handle location update
   * @private
   * @param {string} sessionId - Client session ID
   * @param {Object} location - Location data
   */
  _handleLocationUpdate(sessionId, location) {
    // Store user location
    this.userLocations.set(sessionId, {
      ...location,
      timestamp: Date.now()
    });
    
    // Notify user of nearby users
    this._notifyNearbyUsers(sessionId);
  }

  /**
   * Handle chat message
   * @private
   * @param {string} sessionId - Client session ID
   * @param {Object} messageData - Message data
   */
  _handleChatMessage(sessionId, messageData) {
    const userLocation = this.userLocations.get(sessionId);
    
    if (!userLocation) {
      const ws = this.connectedClients.get(sessionId);
      if (ws) {
        this._sendError(ws, 'No location available, cannot send message');
      }
      return;
    }
    
    // Create message object
    const message = {
      id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: sessionId,
      content: messageData.content,
      timestamp: messageData.timestamp || new Date().toISOString(),
      location: userLocation,
      isAnonymous: messageData.isAnonymous || false,
      expiresAt: Date.now() + this.messageExpiryTime,
    };
    
    // Store message
    this.messages.push(message);
    
    // Broadcast to nearby users
    this._broadcastToNearbyUsers(sessionId, {
      type: 'message',
      data: message
    });
  }

  /**
   * Handle typing status update
   * @private
   * @param {string} sessionId - Client session ID
   * @param {Object} data - Typing status data
   */
  _handleTypingStatus(sessionId, data) {
    const isTyping = data.isTyping || false;
    
    // Update typing status
    this.typingStatus.set(sessionId, {
      isTyping,
      timestamp: Date.now()
    });
    
    // Broadcast to nearby users
    this._broadcastToNearbyUsers(sessionId, {
      type: 'typing_status',
      data: {
        sessionId,
        isTyping
      }
    });
  }

  /**
   * Handle client disconnect
   * @private
   * @param {string} sessionId - Client session ID
   */
  _handleDisconnect(sessionId) {
    this._log(`Client disconnected: ${sessionId}`);
    
    // Broadcast to nearby users that this user has left
    this._broadcastToNearbyUsers(sessionId, {
      type: 'user_left',
      data: {
        sessionId
      }
    });
    
    // Clean up client data
    this.connectedClients.delete(sessionId);
    this.userLocations.delete(sessionId);
    this.typingStatus.delete(sessionId);
  }

  /**
   * Calculate distance between two points
   * @private
   * @param {Object} location1 - First location
   * @param {Object} location2 - Second location
   * @returns {number} Distance in meters
   */
  _calculateDistance(location1, location2) {
    // Haversine formula to calculate distance between two points
    const toRadians = (degrees) => degrees * Math.PI / 180;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRadians(location1.latitude);
    const φ2 = toRadians(location2.latitude);
    const Δφ = toRadians(location2.latitude - location1.latitude);
    const Δλ = toRadians(location2.longitude - location1.longitude);
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Get nearby users for a client
   * @private
   * @param {string} sessionId - Client session ID
   * @returns {Array} Array of nearby users
   */
  _getNearbyUsers(sessionId) {
    const userLocation = this.userLocations.get(sessionId);
    
    if (!userLocation) {
      return [];
    }
    
    const nearbyUsers = [];
    
    for (const [otherSessionId, otherLocation] of this.userLocations.entries()) {
      // Skip the user themselves
      if (otherSessionId === sessionId) continue;
      
      // Calculate distance
      const distance = this._calculateDistance(userLocation, otherLocation);
      
      // Add user if within radius
      if (distance <= this.proximityRadius) {
        nearbyUsers.push({
          sessionId: otherSessionId,
          distance: Math.round(distance),
          location: {
            // Only share approximate location for privacy
            latitude: Number(otherLocation.latitude.toFixed(3)),
            longitude: Number(otherLocation.longitude.toFixed(3))
          },
          // If they're typing, include that status
          isTyping: this.typingStatus.get(otherSessionId)?.isTyping || false
        });
      }
    }
    
    return nearbyUsers;
  }

  /**
   * Notify a client of nearby users
   * @private
   * @param {string} sessionId - Client session ID
   */
  _notifyNearbyUsers(sessionId) {
    const ws = this.connectedClients.get(sessionId);
    
    if (!ws) return;
    
    const nearbyUsers = this._getNearbyUsers(sessionId);
    
    this._sendToClient(sessionId, {
      type: 'nearby_users',
      data: nearbyUsers
    });
    
    // Also notify the nearby users about this user
    for (const nearbyUser of nearbyUsers) {
      this._sendToClient(nearbyUser.sessionId, {
        type: 'user_entered',
        data: {
          sessionId,
          distance: nearbyUser.distance,
          // Only share approximate location for privacy
          location: {
            latitude: Number(this.userLocations.get(sessionId).latitude.toFixed(3)),
            longitude: Number(this.userLocations.get(sessionId).longitude.toFixed(3))
          }
        }
      });
    }
  }

  /**
   * Broadcast message to all users near a specific user
   * @private
   * @param {string} sessionId - Source user ID
   * @param {Object} payload - Message payload
   */
  _broadcastToNearbyUsers(sessionId, payload) {
    const userLocation = this.userLocations.get(sessionId);
    
    if (!userLocation) return;
    
    // Find all clients within radius
    for (const [otherSessionId, otherLocation] of this.userLocations.entries()) {
      // Skip sending to self (handled separately)
      if (otherSessionId === sessionId) continue;
      
      // Calculate distance
      const distance = this._calculateDistance(userLocation, otherLocation);
      
      // Send message if within radius
      if (distance <= this.proximityRadius) {
        this._sendToClient(otherSessionId, payload);
      }
    }
    
    // Also send to the source client for confirmation
    if (payload.type === 'message') {
      this._sendToClient(sessionId, payload);
    }
  }

  /**
   * Send message to specific client
   * @private
   * @param {string} sessionId - Client session ID
   * @param {Object} payload - Message payload
   */
  _sendToClient(sessionId, payload) {
    const ws = this.connectedClients.get(sessionId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(payload));
      } catch (err) {
        this._log(`Error sending to client ${sessionId}:`, err);
      }
    }
  }

  /**
   * Send error message to client
   * @private
   * @param {WebSocket} ws - WebSocket client
   * @param {string} message - Error message
   */
  _sendError(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message
          }
        }));
      } catch (err) {
        this._log('Error sending error message:', err);
      }
    }
  }

  /**
   * Start periodic cleanup interval
   * @private
   */
  _startCleanupInterval() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredMessages();
      this._cleanupStaleTypingStatus();
    }, 60000);
  }

  /**
   * Clean up expired messages
   * @private
   */
  _cleanupExpiredMessages() {
    const now = Date.now();
    const initialCount = this.messages.length;
    
    this.messages = this.messages.filter(message => message.expiresAt > now);
    
    const removedCount = initialCount - this.messages.length;
    if (removedCount > 0) {
      this._log(`Cleaned up ${removedCount} expired messages`);
    }
  }

  /**
   * Clean up stale typing status
   * @private
   */
  _cleanupStaleTypingStatus() {
    const now = Date.now();
    let cleanupCount = 0;
    
    // Typing status should time out after 10 seconds
    for (const [sessionId, status] of this.typingStatus.entries()) {
      if (status.isTyping && now - status.timestamp > 10000) {
        status.isTyping = false;
        cleanupCount++;
        
        // Notify nearby users
        this._broadcastToNearbyUsers(sessionId, {
          type: 'typing_status',
          data: {
            sessionId,
            isTyping: false
          }
        });
      }
    }
    
    if (cleanupCount > 0) {
      this._log(`Reset ${cleanupCount} stale typing statuses`);
    }
  }

  /**
   * Log message if verbose is enabled
   * @private
   * @param {...any} args - Arguments to log
   */
  _log(...args) {
    if (this.verbose) {
      console.log('[ProximityChat Mock Server]', ...args);
    }
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  const server = new ProximityChatMockServer({ verbose: true });
  server.start()
    .then(() => {
      console.log('Server started successfully. Press Ctrl+C to stop.');
    })
    .catch(err => {
      console.error('Failed to start server:', err);
    });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = ProximityChatMockServer; 