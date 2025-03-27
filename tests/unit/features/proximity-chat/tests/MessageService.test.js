import { MessageService } from '../services/MessageService';
import { API_ENDPOINTS } from '../constants';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock fetch implementation for testing
 */
const mockFetchResponses = {
  success: {
    ok: true,
    json: async () => ({ data: 'mock data' }),
    status: 200,
    statusText: 'OK'
  },
  notFound: {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: async () => ({ error: 'Resource not found' })
  },
  serverError: {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: async () => ({ error: 'Server error' })
  },
  networkError: new Error('Network request failed')
};

// Mock implementation of global fetch
global.fetch = vi.fn();

/**
 * Unit tests for the MessageService class
 */
describe('MessageService', () => {
  let messageService;
  let originalFetch;
  let mockLocalStorage;
  let mockWebSocket;
  let originalConsoleError;
  
  // Setup mock data
  const mockMessages = [
    {
      id: 'msg1',
      content: 'Hello!',
      sessionId: 'user1',
      timestamp: '2023-06-15T10:30:00Z'
    },
    {
      id: 'msg2',
      content: 'How are you?',
      sessionId: 'user2',
      timestamp: '2023-06-15T10:31:00Z'
    }
  ];
  
  const mockSuccessResponse = {
    success: true,
    messages: mockMessages
  };
  
  const mockSingleMessageResponse = {
    success: true,
    message: mockMessages[0]
  };
  
  beforeEach(() => {
    originalConsoleError = console.error;
    // Mock console.error to avoid test output noise
    console.error = vi.fn();
    
    // Save original fetch
    originalFetch = global.fetch;
    
    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url, options) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });
    });
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('mock-access-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    };
    
    // Create a new instance for each test
    messageService = new MessageService();
  });
  
  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  describe('getMessages', () => {
    it('should fetch messages with correct URL and parameters', async () => {
      const options = {
        sessionId: 'test-session',
        location: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        radius: 200,
        limit: 20,
        before: '2023-06-15T12:00:00Z'
      };
      
      await messageService.getMessages(options);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const [url, fetchOptions] = global.fetch.mock.calls[0];
      
      // Check URL
      expect(url).toContain(API_ENDPOINTS.MESSAGES);
      
      // Check query parameters
      expect(url).toContain(`sessionId=${options.sessionId}`);
      expect(url).toContain(`latitude=${options.location.latitude}`);
      expect(url).toContain(`longitude=${options.location.longitude}`);
      expect(url).toContain(`radius=${options.radius}`);
      expect(url).toContain(`limit=${options.limit}`);
      expect(url).toContain(`before=${encodeURIComponent(options.before)}`);
      
      // Check headers
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
      expect(fetchOptions.headers['Authorization']).toBe('Bearer mock-access-token');
    });
    
    it('should return messages from the response', async () => {
      const result = await messageService.getMessages({ sessionId: 'test-session' });
      
      expect(result).toEqual(mockMessages);
    });
    
    it('should handle errors', async () => {
      // Mock fetch to return an error
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      });
      
      await expect(messageService.getMessages({ sessionId: 'test-session' }))
        .rejects.toThrow('Failed to fetch messages');
    });
    
    it('should handle empty options', async () => {
      await messageService.getMessages();
      
      const [url] = global.fetch.mock.calls[0];
      
      // Should only have the ? with no additional params
      expect(url).toBe(`${API_ENDPOINTS.MESSAGES}?`);
    });
  });
  
  describe('sendMessage', () => {
    it('should send message with correct URL and body', async () => {
      // Mock fetch specifically for this test
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSingleMessageResponse)
        });
      });
      
      const message = {
        content: 'Hello world!',
        sessionId: 'test-session',
        location: {
          latitude: 34.0522,
          longitude: -118.2437
        }
      };
      
      await messageService.sendMessage(message);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const [url, fetchOptions] = global.fetch.mock.calls[0];
      
      // Check URL
      expect(url).toBe(API_ENDPOINTS.MESSAGES);
      
      // Check method
      expect(fetchOptions.method).toBe('POST');
      
      // Check body
      const body = JSON.parse(fetchOptions.body);
      expect(body).toEqual(message);
      
      // Check headers
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
      expect(fetchOptions.headers['Authorization']).toBe('Bearer mock-access-token');
    });
    
    it('should return the sent message from the response', async () => {
      // Mock fetch specifically for this test
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSingleMessageResponse)
        });
      });
      
      const result = await messageService.sendMessage({
        content: 'Test message',
        sessionId: 'test-session'
      });
      
      expect(result).toEqual(mockMessages[0]);
    });
    
    it('should throw error if content is missing', async () => {
      await expect(messageService.sendMessage({
        sessionId: 'test-session'
      })).rejects.toThrow('Message content is required');
    });
    
    it('should throw error if sessionId is missing', async () => {
      await expect(messageService.sendMessage({
        content: 'Hello'
      })).rejects.toThrow('Session ID is required');
    });
    
    it('should handle API errors', async () => {
      // Mock fetch to return an error
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      });
      
      await expect(messageService.sendMessage({
        content: 'Test message',
        sessionId: 'test-session'
      })).rejects.toThrow('Failed to send message');
    });
  });
  
  describe('deleteMessage', () => {
    it('should send delete request with correct URL and body', async () => {
      // Mock fetch specifically for this test
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      const messageId = 'msg1';
      await messageService.deleteMessage(messageId);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const [url, fetchOptions] = global.fetch.mock.calls[0];
      
      // Check URL
      expect(url).toBe(`${API_ENDPOINTS.MESSAGES}/${messageId}`);
      
      // Check method
      expect(fetchOptions.method).toBe('DELETE');
      
      // Check headers
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
      expect(fetchOptions.headers['Authorization']).toBe('Bearer mock-access-token');
    });
    
    it('should handle API errors', async () => {
      // Mock fetch to return an error
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      });
      
      await expect(messageService.deleteMessage('msg1'))
        .rejects.toThrow('Failed to delete message');
    });
  });
  
  describe('reportMessage', () => {
    it('should send report request with correct URL and body', async () => {
      // Mock fetch specifically for this test
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      const messageId = 'msg123';
      const sessionId = 'test-session';
      const reason = 'inappropriate content';
      
      await messageService.reportMessage(messageId, sessionId, reason);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const [url, fetchOptions] = global.fetch.mock.calls[0];
      
      // Check URL
      expect(url).toBe(`${API_ENDPOINTS.MESSAGES}/${messageId}/report`);
      
      // Check method
      expect(fetchOptions.method).toBe('POST');
      
      // Check body
      const body = JSON.parse(fetchOptions.body);
      expect(body).toEqual({ sessionId, reason });
    });
    
    it('should throw error if messageId is missing', async () => {
      await expect(messageService.reportMessage(null, 'test-session', 'spam'))
        .rejects.toThrow('Message ID is required');
    });
    
    it('should handle API errors', async () => {
      // Mock fetch to return an error
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      });
      
      await expect(messageService.reportMessage('msg123', 'test-session', 'spam'))
        .rejects.toThrow('Failed to report message');
    });
  });
  
  describe('_getHeaders', () => {
    it('should create correct headers with authentication token', () => {
      const headers = messageService._getHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer mock-access-token');
    });
  });
  
  describe('_getAuthToken', () => {
    it('should get token from localStorage', () => {
      const token = messageService._getAuthToken();
      
      expect(token).toBe('mock-access-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('accessToken');
    });
    
    it('should return empty string if no token found', () => {
      // Mock localStorage.getItem to return null
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      
      const token = messageService._getAuthToken();
      
      expect(token).toBe('');
    });
  });
  
  describe('sendMessage', () => {
    it('should send message with correct format', async () => {
      const message = {
        content: 'Hello',
        sessionId: 'test-session',
        location: { latitude: 37.7749, longitude: -122.4194 },
        timestamp: new Date().toISOString()
      };
      
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: { ...message, id: '123' } })
        });
      });
      
      const result = await messageService.sendMessage(message);
      
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.MESSAGES, {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(message)
      });
      
      expect(result).toEqual({ ...message, id: '123' });
    });
    
    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      });
      
      await expect(messageService.sendMessage({
        content: 'Hello',
        sessionId: 'test-session'
      })).rejects.toThrow('Failed to send message: 500');
    });
  });
  
  describe('receiveMessage', () => {
    it('should process received messages correctly', () => {
      const message = {
        id: '123',
        content: 'Hello',
        type: 'text',
        sender: 'user1',
        timestamp: Date.now()
      };
      
      const listener = vi.fn();
      messageService.onMessage(listener);
      
      messageService._handleMessage(message);
      
      expect(listener).toHaveBeenCalledWith(message);
    });
    
    it('should handle invalid messages gracefully', () => {
      const invalidMessage = {
        content: 'Invalid message'
        // Missing required fields
      };
      
      const errorListener = vi.fn();
      messageService.onError(errorListener);
      
      messageService._handleMessage(invalidMessage);
      
      expect(errorListener).toHaveBeenCalled();
    });
  });
  
  describe('event handling', () => {
    it('should notify message listeners', () => {
      const listener = vi.fn();
      messageService.onMessage(listener);
      
      const message = {
        id: '123',
        content: 'Test message',
        type: 'text',
        sender: 'user1',
        timestamp: Date.now()
      };
      
      messageService._notifyMessage(message);
      
      expect(listener).toHaveBeenCalledWith(message);
    });
    
    it('should notify error listeners', () => {
      const listener = vi.fn();
      messageService.onError(listener);
      
      const error = new Error('Test error');
      messageService._notifyError(error);
      
      expect(listener).toHaveBeenCalledWith(error);
    });
    
    it('should remove specific listeners', () => {
      const listener = vi.fn();
      messageService.onMessage(listener);
      messageService.offMessage(listener);
      
      const message = {
        id: '123',
        content: 'Test message',
        type: 'text',
        sender: 'user1',
        timestamp: Date.now()
      };
      
      messageService._notifyMessage(message);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
  
  describe('message history', () => {
    it('should store messages in history', () => {
      const message = {
        id: '123',
        content: 'Test message',
        type: 'text',
        sender: 'user1',
        timestamp: Date.now()
      };
      
      messageService._addToHistory(message);
      
      expect(messageService.getHistory()).toContainEqual(message);
    });
    
    it('should limit history size', () => {
      const maxSize = 100;
      const messages = Array.from({ length: maxSize + 10 }, (_, i) => ({
        id: `msg${i}`,
        content: `Message ${i}`,
        type: 'text',
        sender: 'user1',
        timestamp: Date.now() + i
      }));
      
      messages.forEach(msg => messageService._addToHistory(msg));
      
      expect(messageService.getHistory().length).toBeLessThanOrEqual(maxSize);
    });
  });
  
  describe('message validation', () => {
    it('should validate message format', () => {
      const validMessage = {
        content: 'Valid message',
        type: 'text',
        metadata: { timestamp: Date.now() }
      };
      
      expect(() => messageService._validateMessage(validMessage)).not.toThrow();
    });
    
    it('should reject invalid message types', () => {
      const invalidMessage = {
        content: 'Invalid type',
        type: 'invalid',
        metadata: { timestamp: Date.now() }
      };
      
      expect(() => messageService._validateMessage(invalidMessage)).toThrow();
    });
    
    it('should require message content', () => {
      const emptyMessage = {
        content: '',
        type: 'text',
        metadata: { timestamp: Date.now() }
      };
      
      expect(() => messageService._validateMessage(emptyMessage)).toThrow();
    });
  });
}); 