import React, { useState, useEffect, useRef } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { LocationService } from '../services/locationService';
import { MessageService } from '../services/MessageService';
import { ProximityChatService } from '../services/ProximityChatService';
import { distanceConstants, DEFAULTS } from '../constants';

import './ProximityChatTestPage.css';

const ProximityChatTestPage = () => {
  // Services
  const webSocketServiceRef = useRef(null);
  const locationServiceRef = useRef(null);
  const messageServiceRef = useRef(null);
  const proximityChatServiceRef = useRef(null);
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [chatRadius, setChatRadius] = useState(DEFAULTS.CHAT_RADIUS);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(`user-${Date.now().toString(36)}`);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Initialize services
  useEffect(() => {
    webSocketServiceRef.current = new WebSocketService();
    locationServiceRef.current = new LocationService();
    messageServiceRef.current = new MessageService();
    
    proximityChatServiceRef.current = new ProximityChatService({
      webSocketService: webSocketServiceRef.current,
      locationService: locationServiceRef.current,
      messageService: messageServiceRef.current
    });
    
    // Register event handlers
    const handleMessages = (newMessages) => {
      setMessages(prev => {
        // Combine and deduplicate messages based on id
        const combined = [...prev, ...newMessages];
        const unique = combined.filter((message, index, self) => 
          index === self.findIndex(m => m.id === message.id)
        );
        
        // Sort by timestamp
        return unique.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
    };
    
    const handleNearbyUsers = (users) => {
      setNearbyUsers(users);
    };
    
    const handleConnectionStatus = (status) => {
      setIsConnected(status);
      setIsLoading(false);
    };
    
    const handleError = (err) => {
      console.error('Proximity chat error:', err);
      setError(typeof err === 'string' ? err : (err.message || 'Unknown error'));
      setIsLoading(false);
    };
    
    const handleLocationChange = (newLocation) => {
      setLocation(newLocation);
    };
    
    proximityChatServiceRef.current.onMessages(handleMessages);
    proximityChatServiceRef.current.onNearbyUsers(handleNearbyUsers);
    proximityChatServiceRef.current.onConnectionStatus(handleConnectionStatus);
    proximityChatServiceRef.current.onError(handleError);
    locationServiceRef.current.onLocationChange(handleLocationChange);
    
    // Cleanup function
    return () => {
      if (proximityChatServiceRef.current) {
        proximityChatServiceRef.current.cleanup();
      }
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await proximityChatServiceRef.current.initialize({
        sessionId,
        radius: chatRadius
      });
    } catch (err) {
      setError(err.message || 'Failed to connect');
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await proximityChatServiceRef.current.cleanup();
    } catch (err) {
      setError(err.message || 'Failed to disconnect');
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await proximityChatServiceRef.current.sendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };
  
  const handleRadiusChange = async (e) => {
    const newRadius = parseInt(e.target.value, 10);
    setChatRadius(newRadius);
    
    if (isConnected) {
      try {
        await proximityChatServiceRef.current.updateRadius(newRadius);
      } catch (err) {
        setError(err.message || 'Failed to update radius');
      }
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="proximity-chat-test-page">
      <h1>Proximity Chat Test</h1>
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="connection-controls">
        <div className="connection-form">
          <div className="form-group">
            <label htmlFor="session-id">Session ID:</label>
            <input
              id="session-id"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={isConnected}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="chat-radius">Chat Radius (meters):</label>
            <input
              id="chat-radius"
              type="range"
              min={distanceConstants.MIN_DISTANCE}
              max={distanceConstants.MAX_DISTANCE}
              step={distanceConstants.DISTANCE_STEP}
              value={chatRadius}
              onChange={handleRadiusChange}
            />
            <span>{chatRadius}m</span>
          </div>
          
          <div className="connection-buttons">
            {!isConnected ? (
              <button 
                onClick={handleConnect} 
                disabled={isLoading || !sessionId.trim()}
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button 
                onClick={handleDisconnect} 
                disabled={isLoading}
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
          </div>
        </div>
        
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="nearby-users-panel">
          <h2>Nearby Users ({nearbyUsers.length})</h2>
          <ul className="nearby-users-list">
            {nearbyUsers.length > 0 ? (
              nearbyUsers.map((user) => (
                <li key={user.sessionId} className="nearby-user">
                  <div className="user-avatar"></div>
                  <div className="user-info">
                    <span className="user-id">{user.sessionId}</span>
                    <span className="user-distance">{user.distance}m away</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="no-users">No nearby users</li>
            )}
          </ul>
        </div>
        
        <div className="chat-panel">
          <div className="messages-container">
            {messages.length > 0 ? (
              <ul className="messages-list">
                {messages.map((message, index) => (
                  <li 
                    key={message.id || index} 
                    className={`message ${message.sessionId === sessionId ? 'sent' : 'received'}`}
                  >
                    <div className="message-header">
                      <span className="message-sender">{message.sessionId}</span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </li>
                ))}
                <div ref={messagesEndRef} />
              </ul>
            ) : (
              <div className="no-messages">
                {isConnected ? 'No messages yet' : 'Connect to start chatting'}
              </div>
            )}
          </div>
          
          <div className="message-input-container">
            <textarea
              className="message-input"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
            />
            <button 
              className="send-button" 
              onClick={handleSendMessage}
              disabled={!isConnected || !newMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      {location && (
        <div className="location-info">
          <h3>Your Location</h3>
          <p>Latitude: {location.latitude.toFixed(6)}</p>
          <p>Longitude: {location.longitude.toFixed(6)}</p>
          <p>Accuracy: {location.accuracy}m</p>
          <p>Last Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default ProximityChatTestPage; 