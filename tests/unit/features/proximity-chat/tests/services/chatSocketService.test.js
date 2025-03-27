import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chatSocketService } from '../../services/chatSocketService';
import { CHAT_EVENTS } from '../../constants';

// Mock WebSocket
const mockWebSocket = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn()
};

// Mock window.WebSocket
global.WebSocket = vi.fn(() => mockWebSocket);

describe('chatSocketService', () => {
  let originalConsoleError;
  
  beforeEach(() => {
    originalConsoleError = console.error;
    // Mock console.error to avoid test output noise
    console.error = vi.fn();
    
    // Reset service state between tests
    chatSocketService.disconnect();
    
    // Reset all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  describe('connect', () => {
    it('should establish WebSocket connection', async () => {
      const url = 'ws://test.com';
      const options = { sessionId: 'test-session' };
      
      await chatSocketService.connect(url, options);
      
      expect(WebSocket).toHaveBeenCalledWith(url);
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
    
    it('should use the provided URL', async () => {
      const url = 'ws://custom.com';
      await chatSocketService.connect(url);
      
      expect(WebSocket).toHaveBeenCalledWith(url);
    });
    
    it('should not create multiple connections if already connected', async () => {
      const url = 'ws://test.com';
      
      await chatSocketService.connect(url);
      await chatSocketService.connect(url);
      
      expect(WebSocket).toHaveBeenCalledTimes(1);
    });
    
    it('should emit error event when connection fails', async () => {
      const errorHandler = vi.fn();
      chatSocketService.onError(errorHandler);
      
      mockWebSocket.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'error') {
          handler(new Error('Connection failed'));
        }
      });
      
      try {
        await chatSocketService.connect('ws://test.com');
      } catch (error) {
        expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      }
    });
  });
  
  describe('disconnect', () => {
    it('should close the WebSocket connection', async () => {
      await chatSocketService.connect('ws://test.com');
      chatSocketService.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
    
    it('should do nothing if not connected', () => {
      chatSocketService.disconnect();
      
      expect(mockWebSocket.close).not.toHaveBeenCalled();
    });
  });
  
  describe('sendMessage', () => {
    it('should send messages through WebSocket', async () => {
      await chatSocketService.connect('ws://test.com');
      
      const message = { type: 'test', data: { foo: 'bar' } };
      chatSocketService.sendMessage(message);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
    
    it('should queue messages when not connected', () => {
      const message = { type: 'test', data: { foo: 'bar' } };
      chatSocketService.sendMessage(message);
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
    
    it('should do nothing for null or undefined messages', async () => {
      await chatSocketService.connect('ws://test.com');
      
      chatSocketService.sendMessage(null);
      chatSocketService.sendMessage(undefined);
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });
  
  describe('on/off (event handling)', () => {
    it('should register and unregister event handlers', () => {
      const handler = vi.fn();
      chatSocketService.onMessage(handler);
      chatSocketService.offMessage(handler);
      
      // Simulate a message event
      const messageEvent = { data: JSON.stringify({ type: 'test', data: {} }) };
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should handle messages according to their type', async () => {
      const messageHandler = vi.fn();
      chatSocketService.onMessage(messageHandler);
      
      const message = { type: 'test', data: { foo: 'bar' } };
      
      // Simulate receiving a message
      mockWebSocket.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          handler({ data: JSON.stringify(message) });
        }
      });
      
      await chatSocketService.connect('ws://test.com');
      
      expect(messageHandler).toHaveBeenCalledWith(message);
    });
    
    it('should handle invalid JSON gracefully', async () => {
      const errorHandler = vi.fn();
      chatSocketService.onError(errorHandler);
      
      mockWebSocket.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          handler({ data: 'invalid json' });
        }
      });
      
      await chatSocketService.connect('ws://test.com');
      
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
  
  describe('auto-reconnect', () => {
    it('should attempt to reconnect when connection is closed unexpectedly', async () => {
      await chatSocketService.connect('ws://test.com');
      
      // Simulate unexpected close
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'close')[1]({ code: 1006 });
      
      expect(WebSocket).toHaveBeenCalledTimes(2);
    });
    
    it('should not reconnect when explicitly disconnected', async () => {
      await chatSocketService.connect('ws://test.com');
      chatSocketService.disconnect();
      
      // Simulate close after disconnect
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'close')[1]({ code: 1000 });
      
      expect(WebSocket).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(chatSocketService.isConnected()).toBe(false);
    });
    
    it('should return true when connected', async () => {
      await chatSocketService.connect('ws://test.com');
      
      // Simulate successful connection
      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'open')[1]();
      
      expect(chatSocketService.isConnected()).toBe(true);
    });
    
    it('should return false after disconnecting', async () => {
      await chatSocketService.connect('ws://test.com');
      chatSocketService.disconnect();
      
      expect(chatSocketService.isConnected()).toBe(false);
    });
  });
}); 