import { LocationService } from '../../services/locationService';
import { MessageService } from '../../services/MessageService';
import { ProximityChatService } from '../../services/ProximityChatService';
import { WebSocketService } from '../../services/WebSocketService';

/**
 * Mocks for all dependencies
 */

// WebSocket mock - we'll use a simpler version for integration test
class MockWebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.onmessage = null;
    this.onclose = null;
    this.onopen = null;
    this.onerror = null;
    this.sent = [];

    // Auto-open the socket
    setTimeout(() => {
      if (this.onopen) this.onopen({ target: this });
    }, 0);
  }

  send(data) {
    this.sent.push(data);
  }

  close() {
    if (this.onclose) this.onclose({ target: this });
  }

  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'object' ? JSON.stringify(data) : data });
    }
  }
}

// Override global WebSocket
global.WebSocket = jest.fn().mockImplementation(() => new MockWebSocket());

// Mock for fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});

// Mock for geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn().mockReturnValue(123),
  clearWatch: jest.fn(),
};

// Save and restore original implementations
let originalGeolocation;
let originalWebSocket;
let originalFetch;

/**
 * Integration tests for the ProximityChatService
 */
describe('ProximityChatService Integration', () => {
  let proximityChatService;
  let webSocketService;
  let locationService;
  let messageService;

  beforeAll(() => {
    // Save original implementations
    originalGeolocation = global.navigator.geolocation;
    originalWebSocket = global.WebSocket;
    originalFetch = global.fetch;

    // Install mocks
    global.navigator.geolocation = mockGeolocation;
  });

  afterAll(() => {
    // Restore original implementations
    global.navigator.geolocation = originalGeolocation;
    global.WebSocket = originalWebSocket;
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create service instances
    webSocketService = new WebSocketService();
    locationService = new LocationService();
    messageService = new MessageService();

    // Create the integrated service
    proximityChatService = new ProximityChatService({
      webSocketService,
      locationService,
      messageService,
    });

    // Setup mock geolocation to return a default position
    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      success({
        coords: {
          latitude: 34.052235,
          longitude: -118.243683,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    });
  });

  describe('initialize', () => {
    test('should connect to WebSocket and start location tracking', async () => {
      const options = { sessionId: 'test-user', radius: 200 };

      await proximityChatService.initialize(options);

      // Verify WebSocket connection was initialized
      expect(global.WebSocket).toHaveBeenCalledWith(expect.stringContaining('proximity-chat'));

      // Verify location tracking was started
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();

      // Verify connection is established
      expect(proximityChatService.isConnected()).toBe(true);
    });

    test('should load message history on initialization', async () => {
      const mockMessages = [
        { id: 'msg1', content: 'Hello', timestamp: '2023-06-15T12:00:00Z' },
        { id: 'msg2', content: 'World', timestamp: '2023-06-15T12:05:00Z' },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      });

      const options = { sessionId: 'test-user', radius: 200 };
      const messagesSpy = jest.spyOn(proximityChatService, 'onMessages');

      await proximityChatService.initialize(options);

      // Verify message history was fetched
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.anything()
      );

      // Verify onMessages callback was triggered
      expect(messagesSpy).toHaveBeenCalledWith(mockMessages);
    });

    test('should register event handlers across services', async () => {
      const options = { sessionId: 'test-user', radius: 200 };

      const wsOnMessageSpy = jest.spyOn(webSocketService, 'onMessage');
      const wsOnNearbyUsersSpy = jest.spyOn(webSocketService, 'onNearbyUsers');
      const wsOnConnectionStatusSpy = jest.spyOn(webSocketService, 'onConnectionStatus');
      const locOnLocationChangeSpy = jest.spyOn(locationService, 'onLocationChange');

      await proximityChatService.initialize(options);

      // Verify event handlers were registered
      expect(wsOnMessageSpy).toHaveBeenCalled();
      expect(wsOnNearbyUsersSpy).toHaveBeenCalled();
      expect(wsOnConnectionStatusSpy).toHaveBeenCalled();
      expect(locOnLocationChangeSpy).toHaveBeenCalled();
    });
  });

  describe('event propagation', () => {
    beforeEach(async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });
    });

    test('should propagate WebSocket messages to onMessages handler', async () => {
      const mockMessages = [
        {
          id: 'msg123',
          content: 'Hello there!',
          sessionId: 'other-user',
          timestamp: new Date().toISOString(),
        },
      ];

      const messageListener = jest.fn();
      proximityChatService.onMessages(messageListener);

      // Simulate incoming WebSocket message
      webSocketService.socket.simulateMessage({
        type: 'message',
        data: mockMessages[0],
      });

      // Verify the message was propagated
      expect(messageListener).toHaveBeenCalledWith([mockMessages[0]]);
    });

    test('should propagate WebSocket nearby users to onNearbyUsers handler', async () => {
      const mockNearbyUsers = [
        { sessionId: 'user1', distance: 50 },
        { sessionId: 'user2', distance: 100 },
      ];

      const nearbyUsersListener = jest.fn();
      proximityChatService.onNearbyUsers(nearbyUsersListener);

      // Simulate incoming WebSocket message
      webSocketService.socket.simulateMessage({
        type: 'nearby_users',
        data: mockNearbyUsers,
      });

      // Verify the nearby users data was propagated
      expect(nearbyUsersListener).toHaveBeenCalledWith(mockNearbyUsers);
    });

    test('should propagate WebSocket connection status to onConnectionStatus handler', async () => {
      const connectionListener = jest.fn();
      proximityChatService.onConnectionStatus(connectionListener);

      // Simulate connection status change (disconnect)
      webSocketService.socket.close();

      // Verify the connection status was propagated
      expect(connectionListener).toHaveBeenCalledWith(false);
    });

    test('should update location via WebSocket when location changes', async () => {
      const newLocation = {
        latitude: 34.053235,
        longitude: -118.244683,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const sendSpy = jest.spyOn(webSocketService, 'updateLocation');

      // Simulate location change
      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success({
          coords: {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            accuracy: newLocation.accuracy,
          },
          timestamp: newLocation.timestamp,
        });
      });

      // Trigger location change
      locationService._notifyLocationChange(newLocation);

      // Verify location update was sent through WebSocket
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        })
      );
    });
  });

  describe('messaging functionality', () => {
    beforeEach(async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });
    });

    test('should send message through WebSocket and store via API', async () => {
      const messageContent = 'Hello everyone!';
      const wsSendSpy = jest.spyOn(webSocketService, 'sendMessage');
      const messageSendSpy = jest.spyOn(messageService, 'sendMessage');

      await proximityChatService.sendMessage(messageContent);

      // Verify WebSocket message was sent
      expect(wsSendSpy).toHaveBeenCalledWith(messageContent, expect.any(Object));

      // Verify API request was made
      expect(messageSendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content: messageContent,
        })
      );
    });

    test('should store typing status via WebSocket', async () => {
      const wsSendSpy = jest.spyOn(webSocketService, 'setTypingStatus');

      await proximityChatService.setTypingStatus(true);

      // Verify WebSocket message was sent
      expect(wsSendSpy).toHaveBeenCalledWith(true);
    });

    test('should load message history from API', async () => {
      const mockMessages = [
        { id: 'msg1', content: 'Hello', timestamp: '2023-06-15T12:00:00Z' },
        { id: 'msg2', content: 'World', timestamp: '2023-06-15T12:05:00Z' },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      });

      const messageListener = jest.fn();
      proximityChatService.onMessages(messageListener);

      await proximityChatService.loadMessageHistory();

      // Verify message history was fetched
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.anything()
      );

      // Verify message handler was called
      expect(messageListener).toHaveBeenCalledWith(mockMessages);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });
    });

    test('should disconnect WebSocket and stop location tracking on cleanup', async () => {
      const wsDisconnectSpy = jest.spyOn(webSocketService, 'disconnect');
      const locStopTrackingSpy = jest.spyOn(locationService, 'stopTracking');

      await proximityChatService.cleanup();

      // Verify disconnection
      expect(wsDisconnectSpy).toHaveBeenCalled();
      expect(locStopTrackingSpy).toHaveBeenCalled();
      expect(proximityChatService.isConnected()).toBe(false);
    });

    test('should remove all event listeners on cleanup', async () => {
      const wsOffMessageSpy = jest.spyOn(webSocketService, 'offMessage');
      const wsOffNearbyUsersSpy = jest.spyOn(webSocketService, 'offNearbyUsers');
      const wsOffConnectionStatusSpy = jest.spyOn(webSocketService, 'offConnectionStatus');
      const locOffLocationChangeSpy = jest.spyOn(locationService, 'offLocationChange');

      await proximityChatService.cleanup();

      // Verify event handlers were removed
      expect(wsOffMessageSpy).toHaveBeenCalled();
      expect(wsOffNearbyUsersSpy).toHaveBeenCalled();
      expect(wsOffConnectionStatusSpy).toHaveBeenCalled();
      expect(locOffLocationChangeSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should propagate initialization errors', async () => {
      // Make WebSocket connection fail
      global.WebSocket = jest.fn(() => {
        throw new Error('Connection failed');
      });

      await expect(proximityChatService.initialize({ sessionId: 'test-user' })).rejects.toThrow(
        'Connection failed'
      );
    });

    test('should propagate location errors to error handler', async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });

      const errorListener = jest.fn();
      proximityChatService.onError(errorListener);

      const testError = 'Location permission denied';
      locationService._notifyError(testError);

      expect(errorListener).toHaveBeenCalledWith(testError);
    });

    test('should propagate WebSocket errors to error handler', async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });

      const errorListener = jest.fn();
      proximityChatService.onError(errorListener);

      const testError = {
        type: 'error',
        data: {
          message: 'WebSocket error',
        },
      };

      webSocketService.socket.simulateMessage(testError);

      expect(errorListener).toHaveBeenCalledWith(testError.data.message);
    });

    test('should handle message sending failures', async () => {
      await proximityChatService.initialize({ sessionId: 'test-user' });

      // Make WebSocket.sendMessage fail
      webSocketService.sendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));

      const errorListener = jest.fn();
      proximityChatService.onError(errorListener);

      await expect(proximityChatService.sendMessage('test message')).rejects.toThrow('Send failed');

      expect(errorListener).toHaveBeenCalled();
    });
  });
});
