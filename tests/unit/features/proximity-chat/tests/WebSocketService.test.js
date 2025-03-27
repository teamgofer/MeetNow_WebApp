import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketService } from '../services/WebSocketService';
import { API_ENDPOINTS } from '../constants';
import { EventEmitter } from '../../../utils/EventEmitter';

/**
 * Mock WebSocket implementation for testing
 */
class MockWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    this.sentMessages = [];
    
    // Automatically open the connection after a small delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.emit('open', { target: this });
    }, 0);
  }
  
  send(data) {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
    return true;
  }
  
  close() {
    this.readyState = 3; // CLOSED
    this.emit('close', { code: 1000, reason: 'Normal closure', target: this });
  }
  
  // Helper to simulate incoming messages
  simulateMessage(data) {
    this.emit('message', { data: typeof data === 'object' ? JSON.stringify(data) : data });
  }
  
  // Helper to simulate errors
  simulateError(message) {
    this.emit('error', new Error(message));
  }
  
  // Helper to simulate connection close
  simulateClose(code = 1000, reason = '') {
    this.readyState = 3; // CLOSED
    this.emit('close', { code, reason, target: this });
  }
  
  // Helper to extract event listener
  addEventListener(event, listener) {
    if (event === 'open') this.onopen = listener;
    if (event === 'close') this.onclose = listener;
    if (event === 'error') this.onerror = listener;
    if (event === 'message') this.onmessage = listener;
  }
  
  removeEventListener(event, listener) {
    if (event === 'open' && this.onopen === listener) this.onopen = null;
    if (event === 'close' && this.onclose === listener) this.onclose = null;
    if (event === 'error' && this.onerror === listener) this.onerror = null;
    if (event === 'message' && this.onmessage === listener) this.onmessage = null;
  }
}

// Mock the global WebSocket
global.WebSocket = vi.fn().mockImplementation((url) => new MockWebSocket(url));

// Save original setTimeout
const originalSetTimeout = global.setTimeout;

// Add WebSocket constants
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

/**
 * Unit tests for the WebSocketService class
 */
describe('WebSocketService', () => {
  let webSocketService;
  let mockLocalStorage;
  let mockWebSocket;
  let originalConsoleError;
  const mockSessionId = 'test-session-id';
  const mockLocation = { latitude: 37.7749, longitude: -122.4194 };
  const mockRadius = 1000;
  
  beforeEach(() => {
    originalConsoleError = console.error;
    // Mock console.error to avoid test output noise
    console.error = vi.fn();
    
    // Reset the mock
    vi.clearAllMocks();
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('mock-token'),
      setItem: vi.fn()
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Mock setTimeout to execute immediately for reconnection tests
    global.setTimeout = vi.fn().mockImplementation((callback) => {
      return originalSetTimeout(callback, 0);
    });
    
    // Create a new instance of the service for each test
    webSocketService = new WebSocketService();
  });
  
  afterEach(() => {
    // Restore setTimeout
    global.setTimeout = originalSetTimeout;
    
    // Restore console.error
    console.error = originalConsoleError;
    
    // Clean up service
    webSocketService.disconnect();
  });
  
  describe('connect', () => {
    it('should connect to WebSocket server with correct URL and parameters', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      expect(webSocketService.isConnected()).toBe(true);
      expect(webSocketService.sessionId).toBe(mockSessionId);
    });
    
    it('should store sessionId and connection options', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      expect(webSocketService.sessionId).toBe(mockSessionId);
      expect(webSocketService._connectionOptions).toEqual({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
    });
    
    it('should notify connection status when connected', async () => {
      const connectionListener = vi.fn();
      webSocketService.onConnectionStatus(connectionListener);
      
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      expect(connectionListener).toHaveBeenCalledWith(true);
    });
    
    it('should handle connection errors', async () => {
      // Make WebSocket constructor throw an error
      global.WebSocket.mockImplementationOnce(() => {
        throw new Error('Connection error');
      });
      
      const errorListener = vi.fn();
      webSocketService.onError(errorListener);
      
      await expect(webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      })).rejects.toThrow('Connection error');
      
      expect(errorListener).toHaveBeenCalled();
    });

    it('should establish WebSocket connection', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      expect(WebSocket).toHaveBeenCalled();
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should use the provided URL', async () => {
      const customUrl = 'ws://custom-url';
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius,
        url: customUrl
      });
      expect(WebSocket).toHaveBeenCalledWith(customUrl);
    });

    it('should not create multiple connections if already connected', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      const firstSocket = webSocketService.socket;
      
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      expect(firstSocket.close).toHaveBeenCalled();
      expect(webSocketService.socket).not.toBe(firstSocket);
    });

    it('should emit error event when connection fails', async () => {
      const errorHandler = vi.fn();
      webSocketService._errorEmitter.on('error', errorHandler);
      
      const mockError = new Error('Connection failed');
      global.WebSocket = class FailingWebSocket extends MockWebSocket {
        constructor(url) {
          super(url);
          setTimeout(() => {
            if (this.onerror) this.onerror(mockError);
          }, 0);
        }
      };
      
      await expect(webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      })).rejects.toThrow();
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('should close the WebSocket connection', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      webSocketService.disconnect();
      
      expect(webSocketService.socket.close).toHaveBeenCalled();
      expect(webSocketService.isConnected()).toBe(false);
    });
    
    it('should reset reconnection attempts', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      // Simulate some reconnection attempts
      webSocketService._reconnectAttempts = 3;
      
      webSocketService.disconnect();
      
      expect(webSocketService._reconnectAttempts).toBe(0);
    });
    
    it('should clear reconnection timer if any', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      // Setup reconnect timer
      webSocketService._reconnectTimer = setTimeout(() => {}, 1000);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      webSocketService.disconnect();
      
      expect(clearTimeoutSpy).toHaveBeenCalledWith(webSocketService._reconnectTimer);
      expect(webSocketService._reconnectTimer).toBeNull();
    });

    it('should do nothing if not connected', () => {
      webSocketService.disconnect();
      expect(mockWebSocket.close).not.toHaveBeenCalled();
    });
  });
  
  describe('isConnected', () => {
    it('should return true when socket is connected', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      expect(webSocketService.isConnected()).toBe(true);
    });
    
    it('should return false when socket is not connected', () => {
      expect(webSocketService.isConnected()).toBe(false);
    });
    
    it('should return false when socket is closed', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      webSocketService.disconnect();
      
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should return false when not connected', () => {
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      expect(webSocketService.isConnected()).toBe(true);
    });

    it('should return false after disconnecting', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      webSocketService.disconnect();
      expect(webSocketService.isConnected()).toBe(false);
    });
  });
  
  describe('sendMessage', () => {
    it('should send message with correct format', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      const message = { type: 'chat', content: 'Hello', metadata: {} };
      await webSocketService.sendMessage(message.content, message.metadata);
      
      expect(webSocketService.socket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should queue messages when not connected', async () => {
      const message = { type: 'test', data: { foo: 'bar' } };
      webSocketService.sendMessage(message);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should do nothing for null or undefined messages', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      webSocketService.sendMessage(null);
      webSocketService.sendMessage(undefined);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should throw error if not connected', async () => {
      const message = { type: 'chat', content: 'Hello', metadata: {} };
      await expect(webSocketService.sendMessage(message.content, message.metadata))
        .rejects.toThrow('Not connected to WebSocket server');
    });
  });

  describe('on/off (event handling)', () => {
    it('should register and unregister event handlers', () => {
      const handler = vi.fn();
      webSocketService.on('test', handler);
      webSocketService.off('test', handler);
      webSocketService.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle messages according to their type', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      const messageHandler = vi.fn();
      webSocketService._messageEmitter.on('message', messageHandler);
      
      const message = { type: 'chat', content: 'Hello' };
      webSocketService.socket.onmessage({ data: JSON.stringify(message) });
      
      expect(messageHandler).toHaveBeenCalledWith(message);
    });

    it('should handle invalid JSON gracefully', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      const errorHandler = vi.fn();
      webSocketService._errorEmitter.on('error', errorHandler);
      
      webSocketService.socket.onmessage({ data: 'invalid json' });
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('auto-reconnect', () => {
    it('should attempt to reconnect when connection is closed unexpectedly', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      
      mockWebSocket.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'close') {
          handler();
        }
      });

      expect(WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should not reconnect when explicitly disconnected', async () => {
      await webSocketService.connect({
        sessionId: mockSessionId,
        initialLocation: mockLocation,
        radius: mockRadius
      });
      webSocketService.disconnect();
      
      mockWebSocket.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'close') {
          handler();
        }
      });

      expect(WebSocket).toHaveBeenCalledTimes(1); // Only initial connection
    });
  });
}); 