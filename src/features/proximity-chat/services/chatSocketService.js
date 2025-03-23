/**
 * Chat Socket Service
 * 
 * Manages WebSocket connections for the proximity chat feature.
 * Handles connection, messages, reconnection, and event handling.
 */

import { CHAT_EVENTS, TIMING } from '../constants';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.url = null;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.intentionalDisconnect = false;
  }

  /**
   * Connect to the WebSocket server
   * 
   * @param {string} url - WebSocket server URL
   * @returns {boolean} Whether connection was initiated
   */
  connect(url) {
    // Don't connect if already connected
    if (this.isConnected()) {
      return false;
    }

    // Store URL for reconnection
    this.url = url;
    
    // Clear the intentional disconnect flag
    this.intentionalDisconnect = false;
    
    try {
      // Create a new WebSocket
      this.socket = new WebSocket(url);
      
      // Set up event handlers
      this.socket.addEventListener('open', this.handleOpen.bind(this));
      this.socket.addEventListener('message', this.handleMessage.bind(this));
      this.socket.addEventListener('close', this.handleClose.bind(this));
      this.socket.addEventListener('error', this.handleError.bind(this));
      
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.emitEvent(CHAT_EVENTS.ERROR, error);
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (!this.socket) {
      return;
    }
    
    // Set intentional disconnect flag to prevent auto-reconnect
    this.intentionalDisconnect = true;
    
    // Clear reconnect timer if any
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close the connection
    this.socket.close();
    this.socket = null;
    
    // Reset reconnect counter
    this.reconnectAttempts = 0;
    
    // Emit disconnect event
    this.emitEvent(CHAT_EVENTS.DISCONNECT);
  }

  /**
   * Send a message to the server
   * 
   * @param {Object} message - Message to send
   */
  sendMessage(message) {
    if (!message) {
      return;
    }
    
    // Convert to JSON string
    const messageString = JSON.stringify(message);
    
    // If connected, send immediately
    if (this.isConnected()) {
      this.socket.send(messageString);
    } else {
      // Otherwise queue for later
      this.messageQueue.push(messageString);
    }
  }

  /**
   * Register an event handler
   * 
   * @param {string} event - Event type from CHAT_EVENTS
   * @param {Function} handler - Event handler function
   * @returns {Object} Handler reference for removal
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event).add(handler);
    
    // Return reference for removal
    return { event, handler };
  }

  /**
   * Unregister an event handler
   * 
   * @param {Object} handlerRef - Handler reference from 'on' method
   */
  off(handlerRef) {
    if (!handlerRef || !handlerRef.event || !handlerRef.handler) {
      return;
    }
    
    const { event, handler } = handlerRef;
    
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  /**
   * Check if connected to the server
   * 
   * @returns {boolean} Whether currently connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    
    // Process queued messages
    this.processMessageQueue();
    
    // Emit connection event
    this.emitEvent(CHAT_EVENTS.CONNECT);
  }

  /**
   * Handle WebSocket message event
   * 
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      // Parse the message
      const message = JSON.parse(event.data);
      
      // Emit event based on message type
      if (message.type && this.eventHandlers.has(message.type)) {
        this.emitEvent(message.type, message);
      }
      
      // Always emit the generic message event
      this.emitEvent(CHAT_EVENTS.MESSAGE, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      this.emitEvent(CHAT_EVENTS.ERROR, error);
    }
  }

  /**
   * Handle WebSocket close event
   * 
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    this.socket = null;
    
    // Emit disconnect event
    this.emitEvent(CHAT_EVENTS.DISCONNECT, event);
    
    // If not intentionally disconnected, try to reconnect
    if (!this.intentionalDisconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   * 
   * @param {Event} event - WebSocket error event
   */
  handleError(event) {
    // Create an error object
    const error = new Error('WebSocket connection error');
    
    // Emit error event
    this.emitEvent(CHAT_EVENTS.ERROR, error);
    
    // Close connection if still open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    // Only process if connected
    if (!this.isConnected()) {
      return;
    }
    
    // Send all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(message);
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  attemptReconnect() {
    // Don't reconnect if intentionally disconnected
    if (this.intentionalDisconnect) {
      return;
    }
    
    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= TIMING.MAX_RECONNECTION_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    // Increment attempts
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = TIMING.RECONNECTION_DELAY * Math.pow(1.5, this.reconnectAttempts - 1);
    
    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${TIMING.MAX_RECONNECTION_ATTEMPTS})...`);
      this.connect(this.url);
    }, delay);
  }

  /**
   * Emit an event to registered handlers
   * 
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  emitEvent(event, data) {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    // Call all handlers for this event
    this.eventHandlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }
}

// Create and export singleton instance
const chatSocketService = new ChatSocketService();
export default chatSocketService; 