import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';

import { CHAT_EVENTS } from '../../constants';
import { ProximityChatProvider, useProximityChatContext } from '../../context/ProximityChatContext';
import chatSocketService from '../../services/chatSocketService';

// Mock services
jest.mock('../../services/chatSocketService', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(),
  sendMessage: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

// Test component that uses the context
const TestConsumer = () => {
  const context = useProximityChatContext();

  return (
    <div>
      <div data-testid="connection-status">
        {context.isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="message-count">{context.messages.length}</div>
      <div data-testid="nearby-users-count">{Object.keys(context.nearbyUsers).length}</div>
      <div data-testid="current-user-id">{context.currentUserId || 'No user'}</div>
      <div data-testid="error">{context.error ? context.error.message : 'No error'}</div>
      <button
        data-testid="connect-button"
        onClick={() => context.connect('wss://test.com', 'user123')}
      >
        Connect
      </button>
      <button data-testid="disconnect-button" onClick={() => context.disconnect()}>
        Disconnect
      </button>
      <button
        data-testid="send-message-button"
        onClick={() => context.sendMessage({ content: 'Test message' })}
      >
        Send Message
      </button>
      <button
        data-testid="update-location-button"
        onClick={() => context.updateUserLocation({ latitude: 37.7749, longitude: -122.4194 })}
      >
        Update Location
      </button>
    </div>
  );
};

describe('ProximityChatContext', () => {
  // Stores event handlers registered with the service
  const eventHandlers = {};

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the service's on function to store handlers for testing
    chatSocketService.on.mockImplementation((event, handler) => {
      eventHandlers[event] = handler;
      return { event, handler }; // Return an identifier for off
    });

    chatSocketService.off.mockImplementation(identifier => {
      if (identifier?.event) {
        delete eventHandlers[identifier.event];
      }
    });

    chatSocketService.isConnected.mockReturnValue(false);
  });

  const renderWithProvider = (initialProps = {}) => {
    return render(
      <ProximityChatProvider {...initialProps}>
        <TestConsumer />
      </ProximityChatProvider>
    );
  };

  it('should provide default values', () => {
    renderWithProvider();

    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    expect(screen.getByTestId('nearby-users-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-user-id')).toHaveTextContent('No user');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('should connect to chat service', () => {
    renderWithProvider();

    // Click the connect button
    fireEvent.click(screen.getByTestId('connect-button'));

    // Check that the service was called
    expect(chatSocketService.connect).toHaveBeenCalledWith('wss://test.com');
  });

  it('should update connection status when connected', () => {
    renderWithProvider();

    // Click the connect button
    fireEvent.click(screen.getByTestId('connect-button'));

    // Simulate connect event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Status should now be connected
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    expect(screen.getByTestId('current-user-id')).toHaveTextContent('user123');
  });

  it('should disconnect from chat service', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Then disconnect
    fireEvent.click(screen.getByTestId('disconnect-button'));

    // Check that the service was called
    expect(chatSocketService.disconnect).toHaveBeenCalled();

    // Simulate disconnect event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.DISCONNECT]) {
        eventHandlers[CHAT_EVENTS.DISCONNECT]();
      }
    });

    // Status should now be disconnected
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
  });

  it('should send messages', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Send a message
    fireEvent.click(screen.getByTestId('send-message-button'));

    // Check that the service was called
    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      type: 'message',
      content: 'Test message',
      senderId: 'user123',
    });
  });

  it('should update user location', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Update location
    fireEvent.click(screen.getByTestId('update-location-button'));

    // Check that a location update message was sent
    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      type: 'location_update',
      location: { latitude: 37.7749, longitude: -122.4194 },
      senderId: 'user123',
    });
  });

  it('should handle incoming messages', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Simulate an incoming message
    act(() => {
      if (eventHandlers[CHAT_EVENTS.MESSAGE]) {
        eventHandlers[CHAT_EVENTS.MESSAGE]({
          id: 'msg1',
          type: 'message',
          content: 'Hello',
          senderId: 'user456',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Message count should be updated
    expect(screen.getByTestId('message-count')).toHaveTextContent('1');
  });

  it('should handle user join events', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Simulate a user join event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.USER_JOIN]) {
        eventHandlers[CHAT_EVENTS.USER_JOIN]({
          userId: 'user456',
          name: 'Jane',
          location: { latitude: 37.775, longitude: -122.4195 },
        });
      }
    });

    // Nearby users count should be updated
    expect(screen.getByTestId('nearby-users-count')).toHaveTextContent('1');
  });

  it('should handle user leave events', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Add a user first
    act(() => {
      if (eventHandlers[CHAT_EVENTS.USER_JOIN]) {
        eventHandlers[CHAT_EVENTS.USER_JOIN]({
          userId: 'user456',
          name: 'Jane',
          location: { latitude: 37.775, longitude: -122.4195 },
        });
      }
    });

    // Simulate a user leave event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.USER_LEAVE]) {
        eventHandlers[CHAT_EVENTS.USER_LEAVE]({
          userId: 'user456',
        });
      }
    });

    // Nearby users count should be updated
    expect(screen.getByTestId('nearby-users-count')).toHaveTextContent('0');
  });

  it('should handle location update events', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Add a user first
    act(() => {
      if (eventHandlers[CHAT_EVENTS.USER_JOIN]) {
        eventHandlers[CHAT_EVENTS.USER_JOIN]({
          userId: 'user456',
          name: 'Jane',
          location: { latitude: 37.775, longitude: -122.4195 },
        });
      }
    });

    // Simulate a location update event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.LOCATION_UPDATE]) {
        eventHandlers[CHAT_EVENTS.LOCATION_UPDATE]({
          userId: 'user456',
          location: { latitude: 37.7751, longitude: -122.4196 },
        });
      }
    });

    // The user's location should be updated (can't test this directly with our TestConsumer component)
    // But if it handles the event without error, that's a success
    expect(screen.getByTestId('nearby-users-count')).toHaveTextContent('1');
  });

  it('should handle typing status events', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Add a user first
    act(() => {
      if (eventHandlers[CHAT_EVENTS.USER_JOIN]) {
        eventHandlers[CHAT_EVENTS.USER_JOIN]({
          userId: 'user456',
          name: 'Jane',
          location: { latitude: 37.775, longitude: -122.4195 },
        });
      }
    });

    // Simulate a typing start event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.TYPING_START]) {
        eventHandlers[CHAT_EVENTS.TYPING_START]({
          userId: 'user456',
          name: 'Jane',
        });
      }
    });

    // Simulate a typing stop event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.TYPING_STOP]) {
        eventHandlers[CHAT_EVENTS.TYPING_STOP]({
          userId: 'user456',
        });
      }
    });

    // If we didn't crash, the test passes (can add a better way to check typing status if needed)
  });

  it('should handle errors', () => {
    renderWithProvider();

    // Simulate an error event
    act(() => {
      if (eventHandlers[CHAT_EVENTS.ERROR]) {
        eventHandlers[CHAT_EVENTS.ERROR](new Error('Test error'));
      }
    });

    // Error should be shown
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('should clear messages when disconnected', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // Add a message
    act(() => {
      if (eventHandlers[CHAT_EVENTS.MESSAGE]) {
        eventHandlers[CHAT_EVENTS.MESSAGE]({
          id: 'msg1',
          type: 'message',
          content: 'Hello',
          senderId: 'user456',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Check that we have a message
    expect(screen.getByTestId('message-count')).toHaveTextContent('1');

    // Then disconnect
    fireEvent.click(screen.getByTestId('disconnect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.DISCONNECT]) {
        eventHandlers[CHAT_EVENTS.DISCONNECT]();
      }
    });

    // Messages should be cleared
    expect(screen.getByTestId('message-count')).toHaveTextContent('0');
  });

  it('should not attempt to send messages when disconnected', () => {
    renderWithProvider();

    // Try to send a message without connecting
    fireEvent.click(screen.getByTestId('send-message-button'));

    // The service should not be called
    expect(chatSocketService.sendMessage).not.toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderWithProvider();

    // Connect
    fireEvent.click(screen.getByTestId('connect-button'));

    // Check that we registered event listeners
    expect(chatSocketService.on).toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Check that we unregistered event listeners
    expect(chatSocketService.off).toHaveBeenCalled();
    expect(chatSocketService.disconnect).toHaveBeenCalled();
  });

  it('should update chat settings', () => {
    renderWithProvider();

    // We can't directly test this with our TestConsumer component
    // But we can verify it doesn't throw an error

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // This would normally be called by a child component
    const context = screen.getByTestId('connect-button').__reactProps$;
    const updateChatSettings = context.onClick().updateChatSettings;

    act(() => {
      updateChatSettings({ proximityRadius: 20 });
    });

    // If we didn't crash, the test passes
  });

  it('should handle setting typing status', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // This would normally be called by a child component
    const context = screen.getByTestId('connect-button').__reactProps$;
    const setTypingStatus = context.onClick().setTypingStatus;

    act(() => {
      setTypingStatus(true);
    });

    // Check that typing start message was sent
    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      type: 'typing_start',
      senderId: 'user123',
    });

    // Reset mocks
    chatSocketService.sendMessage.mockClear();

    act(() => {
      setTypingStatus(false);
    });

    // Check that typing stop message was sent
    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      type: 'typing_stop',
      senderId: 'user123',
    });
  });

  it('should handle region entry time tracking', () => {
    renderWithProvider();

    // Connect first
    fireEvent.click(screen.getByTestId('connect-button'));
    act(() => {
      if (eventHandlers[CHAT_EVENTS.CONNECT]) {
        eventHandlers[CHAT_EVENTS.CONNECT]();
      }
    });

    // This would normally be called by a child component
    const context = screen.getByTestId('connect-button').__reactProps$;
    const updateRegionEntryTime = context.onClick().updateRegionEntryTime;

    // Record entry time for a region
    act(() => {
      updateRegionEntryTime('region-1');
    });

    // If we didn't crash, the test passes
    // We can't directly check the stored time with our TestConsumer component
  });
});
