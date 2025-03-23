import chatSocketService from '../../services/chatSocketService';
import { CHAT_EVENTS } from '../../constants';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.listeners = {};
    
    // Auto connect after creation (simulating browser behavior)
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.listeners.open) {
        this.listeners.open.forEach(callback => callback());
      }
    }, 0);
  }
  
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  send(data) {
    this.lastSentData = data;
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.listeners.close) {
      this.listeners.close.forEach(callback => callback());
    }
  }
  
  // Helper methods for testing
  simulateMessage(data) {
    if (this.listeners.message) {
      const event = { data };
      this.listeners.message.forEach(callback => callback(event));
    }
  }
  
  simulateError() {
    if (this.listeners.error) {
      this.listeners.error.forEach(callback => callback());
    }
  }
  
  simulateClose(code = 1000, reason = '') {
    this.readyState = WebSocket.CLOSED;
    if (this.listeners.close) {
      const event = { code, reason };
      this.listeners.close.forEach(callback => callback(event));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket;
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

describe('chatSocketService', () => {
  let originalConsoleError;
  
  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;
    // Mock console.error to avoid test output noise
    console.error = jest.fn();
    
    // Reset service state between tests
    chatSocketService.disconnect();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('connect', () => {
    it('should establish WebSocket connection', done => {
      const onConnect = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.CONNECT, onConnect);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        expect(onConnect).toHaveBeenCalled();
        done();
      }, 10);
    });
    
    it('should use the provided URL', () => {
      const url = 'wss://example.com/chat';
      chatSocketService.connect(url);
      
      // @ts-ignore - accessing private property for testing
      expect(chatSocketService.socket.url).toBe(url);
    });
    
    it('should not create multiple connections if already connected', done => {
      const onConnect = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.CONNECT, onConnect);
      chatSocketService.connect('wss://example.com/chat');
      
      // Try to connect again
      chatSocketService.connect('wss://example.com/chat2');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        expect(onConnect).toHaveBeenCalledTimes(1);
        // @ts-ignore - accessing private property for testing
        expect(chatSocketService.socket.url).toBe('wss://example.com/chat');
        done();
      }, 10);
    });
    
    it('should emit error event when connection fails', done => {
      const onError = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.ERROR, onError);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateError();
        expect(onError).toHaveBeenCalled();
        done();
      }, 10);
    });
  });
  
  describe('disconnect', () => {
    it('should close the WebSocket connection', done => {
      const onDisconnect = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.DISCONNECT, onDisconnect);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        chatSocketService.disconnect();
        expect(onDisconnect).toHaveBeenCalled();
        done();
      }, 10);
    });
    
    it('should do nothing if not connected', () => {
      // Should not throw error
      expect(() => chatSocketService.disconnect()).not.toThrow();
    });
  });
  
  describe('sendMessage', () => {
    it('should send messages through WebSocket', done => {
      const message = { type: 'message', content: 'Hello' };
      
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        chatSocketService.sendMessage(message);
        
        // @ts-ignore - accessing private property for testing
        expect(chatSocketService.socket.lastSentData).toBe(JSON.stringify(message));
        done();
      }, 10);
    });
    
    it('should queue messages when not connected', done => {
      const message1 = { type: 'message', content: 'Hello' };
      const message2 = { type: 'message', content: 'World' };
      
      // Send before connecting
      chatSocketService.sendMessage(message1);
      chatSocketService.sendMessage(message2);
      
      // Then connect
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect and process queue
      setTimeout(() => {
        // Last sent message should be message2
        // @ts-ignore - accessing private property for testing
        expect(chatSocketService.socket.lastSentData).toBe(JSON.stringify(message2));
        done();
      }, 20);
    });
    
    it('should do nothing for null or undefined messages', done => {
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        chatSocketService.sendMessage(null);
        chatSocketService.sendMessage(undefined);
        
        // @ts-ignore - accessing private property for testing
        expect(chatSocketService.socket.lastSentData).toBeUndefined();
        done();
      }, 10);
    });
  });
  
  describe('on/off (event handling)', () => {
    it('should register and unregister event handlers', done => {
      const onMessage = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.MESSAGE, onMessage);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateMessage(JSON.stringify({ type: 'message', content: 'Hello' }));
        
        expect(onMessage).toHaveBeenCalledTimes(1);
        
        // Unregister handler
        chatSocketService.off(CHAT_EVENTS.MESSAGE, onMessage);
        
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateMessage(JSON.stringify({ type: 'message', content: 'World' }));
        
        // Should still be called only once
        expect(onMessage).toHaveBeenCalledTimes(1);
        
        done();
      }, 10);
    });
    
    it('should handle messages according to their type', done => {
      const onMessage = jest.fn();
      const onUserJoin = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.MESSAGE, onMessage);
      chatSocketService.on(CHAT_EVENTS.USER_JOIN, onUserJoin);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateMessage(JSON.stringify({ type: 'message', content: 'Hello' }));
        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onUserJoin).not.toHaveBeenCalled();
        
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateMessage(JSON.stringify({ type: 'user_join', userId: '123' }));
        expect(onMessage).toHaveBeenCalledTimes(1);
        expect(onUserJoin).toHaveBeenCalledTimes(1);
        
        done();
      }, 10);
    });
    
    it('should handle invalid JSON gracefully', done => {
      const onMessage = jest.fn();
      const onError = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.MESSAGE, onMessage);
      chatSocketService.on(CHAT_EVENTS.ERROR, onError);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateMessage('invalid json');
        
        expect(onMessage).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
        
        done();
      }, 10);
    });
  });
  
  describe('auto-reconnect', () => {
    it('should attempt to reconnect when connection is closed unexpectedly', done => {
      const onDisconnect = jest.fn();
      const onConnect = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.DISCONNECT, onDisconnect);
      chatSocketService.on(CHAT_EVENTS.CONNECT, onConnect);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // Simulate unexpected close
        // @ts-ignore - accessing private property for testing
        chatSocketService.socket.simulateClose(1006, 'Connection lost');
        
        expect(onDisconnect).toHaveBeenCalledTimes(1);
        
        // Should attempt to reconnect
        setTimeout(() => {
          expect(onConnect).toHaveBeenCalledTimes(2); // Initial + reconnect
          done();
        }, 50); // Reconnect delay
      }, 10);
    });
    
    it('should not reconnect when explicitly disconnected', done => {
      const onConnect = jest.fn();
      
      chatSocketService.on(CHAT_EVENTS.CONNECT, onConnect);
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        // Explicitly disconnect
        chatSocketService.disconnect();
        
        // Wait to ensure no reconnect happens
        setTimeout(() => {
          expect(onConnect).toHaveBeenCalledTimes(1); // Only initial connect
          done();
        }, 50); // Reconnect delay
      }, 10);
    });
  });
  
  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(chatSocketService.isConnected()).toBe(false);
    });
    
    it('should return true when connected', done => {
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        expect(chatSocketService.isConnected()).toBe(true);
        done();
      }, 10);
    });
    
    it('should return false after disconnecting', done => {
      chatSocketService.connect('wss://example.com/chat');
      
      // Allow the mock WebSocket to connect
      setTimeout(() => {
        chatSocketService.disconnect();
        expect(chatSocketService.isConnected()).toBe(false);
        done();
      }, 10);
    });
  });
}); 