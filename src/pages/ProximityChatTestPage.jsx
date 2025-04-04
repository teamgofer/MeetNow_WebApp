import React, { useEffect, useState, useRef } from 'react';

import { LocationService } from '../features/proximity-chat/services/locationService';
import { MessageService } from '../features/proximity-chat/services/MessageService';
import { ProximityChatService } from '../features/proximity-chat/services/ProximityChatService';
import { WebSocketService } from '../features/proximity-chat/services/WebSocketService';

const ProximityChatTestPage = () => {
  // State for chat functionality
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sessionId, setSessionId] = useState(`test-user-${Math.floor(Math.random() * 1000)}`);
  const [chatRadius, setChatRadius] = useState(100);

  // State for location simulation
  const [simulatedLocation, setSimulatedLocation] = useState({
    latitude: 34.052235,
    longitude: -118.243683,
    accuracy: 10,
  });

  // Reference to the ProximityChatService instance
  const chatServiceRef = useRef(null);

  // Initialize services
  useEffect(() => {
    // Create service instances
    const webSocketService = new WebSocketService();
    const locationService = new LocationService();
    const messageService = new MessageService();

    // Create and store ProximityChatService
    const proximityChatService = new ProximityChatService({
      webSocketService,
      locationService,
      messageService,
    });

    // Override location methods for simulation
    locationService.getCurrentLocation = async () => simulatedLocation;
    locationService.startTracking = async () => {
      locationService._notifyLocationChange(simulatedLocation);
      return simulatedLocation;
    };

    // Store service in ref
    chatServiceRef.current = proximityChatService;

    // Set up event listeners
    const unsubscribeMessages = proximityChatService.onMessages(handleMessages);
    const unsubscribeNearbyUsers = proximityChatService.onNearbyUsers(handleNearbyUsers);
    const unsubscribeConnectionStatus =
      proximityChatService.onConnectionStatus(handleConnectionStatus);
    const unsubscribeError = proximityChatService.onError(handleError);

    // Clean up on unmount
    return () => {
      if (proximityChatService) {
        proximityChatService.cleanup().catch(console.error);
      }

      // Remove event listeners
      unsubscribeMessages();
      unsubscribeNearbyUsers();
      unsubscribeConnectionStatus();
      unsubscribeError();
    };
  }, [simulatedLocation]);

  // Event handlers
  const handleMessages = newMessages => {
    setMessages(prevMessages => {
      // Combine new messages with existing ones, avoiding duplicates
      const messageMap = new Map();

      // Add existing messages to map
      prevMessages.forEach(msg => messageMap.set(msg.id, msg));

      // Add new messages to map (overwrites with newer version if exists)
      newMessages.forEach(msg => messageMap.set(msg.id, msg));

      // Sort by timestamp, newest first
      return Array.from(messageMap.values()).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    });
  };

  const handleNearbyUsers = users => {
    setNearbyUsers(users);

    // Update typing users
    setTypingUsers(prevTyping => {
      // Filter out users who are no longer nearby
      const nearbyUserIds = users.map(user => user.sessionId);
      return prevTyping.filter(userId => nearbyUserIds.includes(userId));
    });
  };

  const handleConnectionStatus = status => {
    setIsConnected(status);

    if (!status) {
      // Reset state on disconnection
      setNearbyUsers([]);
      setTypingUsers([]);
    }
  };

  const handleError = err => {
    console.error('Proximity Chat Error:', err);
    setError(typeof err === 'string' ? err : err.message || 'Unknown error');

    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // User actions
  const handleConnect = async () => {
    try {
      if (!chatServiceRef.current) return;

      if (isConnected) {
        await chatServiceRef.current.cleanup();
      } else {
        await chatServiceRef.current.initialize({
          sessionId,
          radius: chatRadius,
        });
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    try {
      await chatServiceRef.current.sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateRadius = async () => {
    if (!isConnected) return;

    try {
      await chatServiceRef.current.updateRadius(chatRadius);
    } catch (err) {
      handleError(err);
    }
  };

  const handleInputChange = e => {
    setNewMessage(e.target.value);

    // Update typing status
    if (isConnected) {
      const isCurrentlyTyping = e.target.value.length > 0;

      if (isTyping !== isCurrentlyTyping) {
        setIsTyping(isCurrentlyTyping);
        chatServiceRef.current.setTypingStatus(isCurrentlyTyping).catch(handleError);
      }
    }
  };

  // Helper to format distance
  const formatDistance = meters => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Helper to format timestamp
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Update location simulation
  const shiftLocation = (lat, lng) => {
    setSimulatedLocation(prev => ({
      ...prev,
      latitude: prev.latitude + lat,
      longitude: prev.longitude + lng,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Proximity Chat Test</h1>

      {/* Connection Controls */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="text"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            placeholder="Session ID"
            className="flex-1 p-2 border rounded"
            disabled={isConnected}
          />
          <input
            type="number"
            value={chatRadius}
            onChange={e => setChatRadius(parseInt(e.target.value) || 100)}
            placeholder="Chat radius (m)"
            className="w-32 p-2 border rounded"
            min="50"
            max="5000"
          />
          {isConnected && (
            <button
              onClick={handleUpdateRadius}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update Radius
            </button>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button
            onClick={handleConnect}
            className={`px-4 py-2 rounded ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      {/* Location Simulation */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-bold mb-2">Location Simulation</h2>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span>Lat: {simulatedLocation.latitude.toFixed(6)}</span>
          <span>Lng: {simulatedLocation.longitude.toFixed(6)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-2">
          <button onClick={() => shiftLocation(0.001, 0)} className="p-2 bg-blue-200 rounded">
            North
          </button>
          <div></div>
          <button onClick={() => shiftLocation(-0.001, 0)} className="p-2 bg-blue-200 rounded">
            South
          </button>
          <button onClick={() => shiftLocation(0, -0.001)} className="p-2 bg-blue-200 rounded">
            West
          </button>
          <div></div>
          <button onClick={() => shiftLocation(0, 0.001)} className="p-2 bg-blue-200 rounded">
            East
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Each click moves approximately 100m in that direction.
        </p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
          <div className="p-2 bg-gray-100 font-bold">Messages</div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center italic">No messages yet</div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`mb-2 p-3 rounded-lg max-w-[80%] ${msg.sessionId === sessionId ? 'ml-auto bg-blue-100' : 'bg-gray-100'}`}
                >
                  <div className="font-bold text-sm">
                    {msg.sessionId === sessionId ? 'You' : msg.sessionId}
                  </div>
                  <div>{msg.content}</div>
                  <div className="text-xs text-gray-500 text-right">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ))
            )}

            {typingUsers.length > 0 && (
              <div className="text-gray-500 italic">{typingUsers.join(', ')} is typing...</div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-2 border-t flex">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-l"
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-gray-300"
              disabled={!isConnected || !newMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>

        {/* Nearby Users */}
        <div className="w-64 border rounded-lg overflow-hidden">
          <div className="p-2 bg-gray-100 font-bold">Nearby Users ({nearbyUsers.length})</div>

          <div className="overflow-y-auto p-2">
            {nearbyUsers.length === 0 ? (
              <div className="text-gray-500 text-center italic p-4">No nearby users</div>
            ) : (
              nearbyUsers.map(user => (
                <div key={user.sessionId} className="p-2 border-b last:border-b-0">
                  <div className="font-medium">{user.sessionId}</div>
                  <div className="text-sm text-gray-500">{formatDistance(user.distance)} away</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProximityChatTestPage;
