import React, { useEffect, useState, useRef } from 'react';

import { DEFAULTS } from '../constants';
import { LocationService } from '../services/locationService';
import { MessageService } from '../services/MessageService';
import { ProximityChatService } from '../services/ProximityChatService';
import { WebSocketService } from '../services/WebSocketService';

const TestPage = () => {
  // Service references
  const proximityChatServiceRef = useRef(null);

  // UI State
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(`test-user-${Math.floor(Math.random() * 10000)}`);
  const [radius, setRadius] = useState(DEFAULTS.CHAT_RADIUS);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize services
  useEffect(() => {
    const webSocketService = new WebSocketService();
    const locationService = new LocationService();
    const messageService = new MessageService();

    const proximityChatService = new ProximityChatService({
      webSocketService,
      locationService,
      messageService,
    });

    proximityChatServiceRef.current = proximityChatService;

    // Register event handlers
    const unsubscribeMessages = proximityChatService.onMessages(handleMessages);
    const unsubscribeNearbyUsers = proximityChatService.onNearbyUsers(handleNearbyUsers);
    const unsubscribeConnectionStatus =
      proximityChatService.onConnectionStatus(handleConnectionStatus);
    const unsubscribeError = proximityChatService.onError(handleError);

    return () => {
      // Clean up on unmount
      if (proximityChatService) {
        proximityChatService.cleanup();
      }

      unsubscribeMessages();
      unsubscribeNearbyUsers();
      unsubscribeConnectionStatus();
      unsubscribeError();
    };
  }, []);

  // Event handlers
  const handleMessages = newMessages => {
    setMessages(prevMessages => {
      // Find messages that are not already in the list
      const uniqueMessages = newMessages.filter(
        newMsg => !prevMessages.some(existingMsg => existingMsg.id === newMsg.id)
      );

      // Add new messages to the existing ones
      return [...prevMessages, ...uniqueMessages].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
    });
  };

  const handleNearbyUsers = users => {
    setNearbyUsers(users);
  };

  const handleConnectionStatus = status => {
    setIsConnected(status);
  };

  const handleError = err => {
    console.error('Proximity chat error:', err);
    setError(typeof err === 'object' ? err.message : err);

    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // Action handlers
  const handleConnect = async () => {
    try {
      await proximityChatServiceRef.current.initialize({
        sessionId,
        radius,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await proximityChatServiceRef.current.cleanup();
    } catch (error) {
      handleError(error);
    }
  };

  const handleSendMessage = async e => {
    e.preventDefault();

    if (!newMessage.trim() || !isConnected) return;

    try {
      await proximityChatServiceRef.current.sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateRadius = async () => {
    try {
      await proximityChatServiceRef.current.updateRadius(radius);
    } catch (error) {
      handleError(error);
    }
  };

  const handleMessageChange = e => {
    setNewMessage(e.target.value);

    // Handle typing status
    if (!isTyping) {
      setIsTyping(true);
      proximityChatServiceRef.current.setTypingStatus(true);

      // Reset typing status after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false);
        proximityChatServiceRef.current.setTypingStatus(false);
      }, 3000);
    }
  };

  return (
    <div className="test-page">
      <h1>Proximity Chat Test</h1>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="control-panel">
        <div className="connection-controls">
          <input
            type="text"
            placeholder="Session ID"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            disabled={isConnected}
          />

          <input
            type="number"
            placeholder="Radius (meters)"
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            min={DEFAULTS.CHAT_RADIUS / 2}
            max={DEFAULTS.MAX_CHAT_RADIUS}
          />

          {!isConnected ? (
            <button onClick={handleConnect} disabled={!sessionId}>
              Connect
            </button>
          ) : (
            <>
              <button onClick={handleUpdateRadius}>Update Radius</button>
              <button onClick={handleDisconnect}>Disconnect</button>
            </>
          )}
        </div>

        <div className="status-panel">
          <p>
            Status:{' '}
            <span className={isConnected ? 'connected' : 'disconnected'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          <p>Nearby Users: {nearbyUsers.length}</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="message-list">
          {messages.length === 0 && <p className="no-messages">No messages yet.</p>}

          {messages.map(msg => (
            <div
              key={msg.id || msg.timestamp}
              className={`message ${msg.sessionId === sessionId ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="sender-id">
                  {msg.sessionId === sessionId ? 'You' : msg.sessionId}
                </span>
                <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleMessageChange}
            disabled={!isConnected}
          />
          <button type="submit" disabled={!isConnected || !newMessage.trim()}>
            Send
          </button>
        </form>
      </div>

      <div className="nearby-users-panel">
        <h2>Nearby Users</h2>
        {nearbyUsers.length === 0 ? (
          <p>No users nearby.</p>
        ) : (
          <ul>
            {nearbyUsers.map(user => (
              <li key={user.sessionId}>
                <span className="user-id">{user.sessionId}</span>
                <span className="distance">{user.distance}m away</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .test-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .control-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .connection-controls {
          display: flex;
          gap: 10px;
        }

        input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        button {
          padding: 8px 16px;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .status-panel {
          text-align: right;
        }

        .connected {
          color: green;
          font-weight: bold;
        }

        .disconnected {
          color: red;
          font-weight: bold;
        }

        .chat-container {
          display: flex;
          flex-direction: column;
          height: 400px;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }

        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          background-color: #f9f9f9;
        }

        .no-messages {
          text-align: center;
          color: #757575;
          margin-top: 20px;
        }

        .message {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 4px;
          max-width: 70%;
        }

        .sent {
          align-self: flex-end;
          background-color: #e3f2fd;
          margin-left: auto;
        }

        .received {
          align-self: flex-start;
          background-color: #ffffff;
          border: 1px solid #eeeeee;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.8em;
          color: #757575;
        }

        .message-content {
          word-break: break-word;
        }

        .message-form {
          display: flex;
          padding: 10px;
          background-color: #ffffff;
        }

        .message-form input {
          flex: 1;
          margin-right: 10px;
        }

        .nearby-users-panel {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .nearby-users-panel h2 {
          margin-top: 0;
          font-size: 1.2em;
        }

        .nearby-users-panel ul {
          list-style: none;
          padding: 0;
        }

        .nearby-users-panel li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eeeeee;
        }

        .nearby-users-panel li:last-child {
          border-bottom: none;
        }

        .user-id {
          font-weight: bold;
        }

        .distance {
          color: #757575;
        }
      `}</style>
    </div>
  );
};

export default TestPage;
