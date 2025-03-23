import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getChatMessages, getChatSettings } from '../services/chatService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/locationUtils';
import { playNotificationSound } from '../utils/audioUtils';
import { 
  getUnreadMessages, 
  updateMessageReceipt, 
  updateMessagesReceipts, 
  ReceiptStatus,
  createReceiptUpdateMessage 
} from '../utils/readReceiptUtils';
import { chatSocketService } from '../services/chatSocketService';
import { locationService } from '../services/locationService';
import messageHistoryService from '../services/messageHistoryService';

// Initial state
const initialState = {
  isConnected: false,
  messages: [],
  nearbyUsers: [],
  currentUserId: null,
  userLocation: null,
  typingUsers: {},
  chatSettings: {
    maxDistance: 1000, // meters
    refreshRate: 30, // seconds
    messageTimeout: 12, // hours
    anonymousMode: false,
    notifications: true,
    proximityRadius: 100,
    showTimestamps: true,
    autoScroll: true,
    locationSharing: {
      isEnabled: true,
      precisionLevel: 'exact',
      sharingSchedule: 'always',
      customSchedule: {
        startTime: '09:00',
        endTime: '21:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      },
      autoDisableWhenInactive: true,
      inactivityTimeout: 30,
      excludedUsers: []
    }
  },
  isLoading: false,
  error: null,
  enteredRegions: {}, // Track when user entered each region
  loadingHistory: false,
  reachedEndOfHistory: {} // Track which regions have no more history
};

// Create the context
const ProximityChatContext = createContext(initialState);

// Reducer to handle state updates
function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload,
      };
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUserId: action.payload,
      };
    case 'SET_USER_LOCATION':
      return {
        ...state,
        userLocation: action.payload,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE': {
      // Play sound for new messages (if not from current user)
      if (action.payload.userId !== state.currentUserId) {
        playNotificationSound('newMessage');
      } else {
        playNotificationSound('messageSent');
      }
      
      // Add receipt information if it's the current user's message
      let message = action.payload;
      if (message.userId === state.currentUserId) {
        message = updateMessageReceipt(message, ReceiptStatus.SENT, state.currentUserId);
      }
      
      return {
        ...state,
        messages: [...state.messages, message],
      };
    }
    case 'UPDATE_MESSAGE': {
      // Find and update a specific message
      const index = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      
      if (index === -1) return state;
      
      const updatedMessages = [...state.messages];
      updatedMessages[index] = action.payload;
      
      return {
        ...state,
        messages: updatedMessages,
      };
    }
    case 'UPDATE_MESSAGE_RECEIPTS': {
      // Update receipt status for specific messages
      const { messageIds, status, userId } = action.payload;
      
      // If no message IDs provided, don't update anything
      if (!messageIds || !messageIds.length) return state;
      
      const updatedMessages = state.messages.map(message => {
        if (messageIds.includes(message.id)) {
          return updateMessageReceipt(message, status, userId);
        }
        return message;
      });
      
      return {
        ...state,
        messages: updatedMessages,
      };
    }
    case 'SET_NEARBY_USERS':
      // Check if there are new nearby users that weren't there before
      const newUsers = action.payload.filter(user => 
        !state.nearbyUsers.some(existingUser => existingUser.id === user.id)
      );
      
      // Play sound if new users appear nearby
      if (newUsers.length > 0 && state.nearbyUsers.length > 0) {
        playNotificationSound('userNearby');
      }
      
      return {
        ...state,
        nearbyUsers: action.payload,
      };
    case 'SET_TYPING_STATUS':
      // Play typing sound if someone starts typing (and wasn't already typing)
      const wasTyping = state.typingUsers[action.payload.userId];
      if (action.payload.isTyping && !wasTyping && action.payload.userId !== state.currentUserId) {
        playNotificationSound('typing');
      }
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: action.payload.isTyping,
        },
      };
    case 'SET_CHAT_SETTINGS':
      return {
        ...state,
        chatSettings: {
          ...state.chatSettings,
          ...action.payload,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
        currentUserId: state.currentUserId, // Keep the user ID
      };
    case 'UPDATE_LOCATION_SHARING':
      return {
        ...state,
        chatSettings: {
          ...state.chatSettings,
          locationSharing: {
            ...state.chatSettings.locationSharing,
            ...action.payload
          }
        }
      };
    case 'SET_ENTERED_REGION':
      return {
        ...state,
        enteredRegions: {
          ...state.enteredRegions,
          [action.payload.regionId]: action.payload.timestamp
        }
      };
    case 'SET_LOADING_HISTORY':
      return {
        ...state,
        loadingHistory: action.payload
      };
    case 'SET_REACHED_END_OF_HISTORY':
      return {
        ...state,
        reachedEndOfHistory: {
          ...state.reachedEndOfHistory,
          [action.payload.regionId]: action.payload.reachedEnd
        }
      };
    case 'ADD_HISTORICAL_MESSAGES':
      return {
        ...state,
        messages: [...action.payload, ...state.messages]
      };
    default:
      return state;
  }
}

// Provider component
export function ProximityChatProvider({ children, userId }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Set the current user ID when it's provided
  useEffect(() => {
    if (userId) {
      dispatch({ type: 'SET_CURRENT_USER', payload: userId });
    }
  }, [userId]);
  
  // Initialize the WebSocket connection
  const { 
    sendMessage, 
    lastMessage, 
    connectionStatus, 
    connect, 
    disconnect 
  } = useWebSocket();
  
  // Use the geolocation hook
  const { 
    position, 
    error: locationError, 
    startTracking, 
    stopTracking 
  } = useGeolocation();
  
  // Handle WebSocket connection status changes
  useEffect(() => {
    const isConnected = connectionStatus === 'OPEN';
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
    
    // Play connection/disconnection sounds
    if (isConnected) {
      playNotificationSound('connected');
    } else if (connectionStatus === 'CLOSED' && state.isConnected) {
      playNotificationSound('disconnected');
    }
  }, [connectionStatus, state.isConnected]);
  
  // Handle location updates
  useEffect(() => {
    if (position) {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      dispatch({ type: 'SET_USER_LOCATION', payload: location });
      
      // Send location update to server if connected
      if (state.isConnected && state.currentUserId) {
        sendMessage({
          type: 'UPDATE_LOCATION',
          payload: {
            userId: state.currentUserId,
            location,
            settings: state.chatSettings,
          },
        });
      }
    }
    
    if (locationError) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Location error: ${locationError.message}` 
      });
    }
  }, [position, locationError, state.isConnected, state.currentUserId, state.chatSettings, sendMessage]);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const data = JSON.parse(lastMessage.data);
      
      switch (data.type) {
        case 'NEW_MESSAGE':
          dispatch({ type: 'ADD_MESSAGE', payload: data.payload });
          
          // Automatically mark as delivered if it's not our own message
          if (data.payload.userId !== state.currentUserId) {
            const receiptUpdate = createReceiptUpdateMessage(
              data.payload.id, 
              ReceiptStatus.DELIVERED,
              state.currentUserId
            );
            sendMessage(receiptUpdate);
          }
          break;
        case 'NEARBY_USERS':
          dispatch({ type: 'SET_NEARBY_USERS', payload: data.payload });
          break;
        case 'TYPING_STATUS':
          dispatch({ 
            type: 'SET_TYPING_STATUS', 
            payload: data.payload
          });
          break;
        case 'RECEIPT_UPDATE':
          // Handle receipt updates from other users
          dispatch({
            type: 'UPDATE_MESSAGE_RECEIPTS',
            payload: {
              messageIds: [data.payload.messageId],
              status: data.payload.status,
              userId: data.payload.userId
            }
          });
          break;
        case 'ERROR':
          dispatch({ type: 'SET_ERROR', payload: data.payload });
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [lastMessage, state.currentUserId, sendMessage]);
  
  // Fetch messages and settings when connected
  useEffect(() => {
    const fetchInitialData = async () => {
      if (state.isConnected && state.currentUserId) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          // Fetch chat settings
          const settings = await getChatSettings(state.currentUserId);
          dispatch({ type: 'SET_CHAT_SETTINGS', payload: settings });
          
          // Fetch messages
          const messages = await getChatMessages(state.currentUserId);
          dispatch({ type: 'SET_MESSAGES', payload: messages });
        } catch (error) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: `Failed to fetch initial data: ${error.message}` 
          });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    
    fetchInitialData();
  }, [state.isConnected, state.currentUserId]);
  
  // Connect to chat functionality
  const connectToChat = useCallback(() => {
    if (!state.currentUserId) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Cannot connect: User ID is required' 
      });
      return;
    }
    
    connect();
    startTracking(state.chatSettings.refreshRate);
  }, [connect, startTracking, state.currentUserId, state.chatSettings.refreshRate]);
  
  // Disconnect from chat
  const disconnectFromChat = useCallback(() => {
    disconnect();
    stopTracking();
    dispatch({ type: 'RESET_STATE' });
  }, [disconnect, stopTracking]);
  
  // Update user location manually (for testing or forcing updates)
  const updateLocation = useCallback(() => {
    startTracking(state.chatSettings.refreshRate, true); // Force an immediate update
  }, [startTracking, state.chatSettings.refreshRate]);
  
  // Send a message
  const sendChatMessage = useCallback((content, metadata = {}) => {
    if (!state.isConnected || !state.currentUserId || !state.userLocation) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Cannot send message: Not connected or missing user info' 
      });
      return;
    }
    
    const message = {
      id: `msg_${Date.now()}_${state.currentUserId.substring(0, 6)}`,
      userId: state.currentUserId,
      content,
      timestamp: new Date().toISOString(),
      location: state.userLocation,
      metadata,
    };
    
    sendMessage({
      type: 'NEW_MESSAGE',
      payload: message,
    });
    
    // Optimistically add to local state
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    
    return message;
  }, [state.isConnected, state.currentUserId, state.userLocation, sendMessage]);
  
  // Update typing status
  const updateTypingStatus = useCallback((isTyping) => {
    if (!state.isConnected || !state.currentUserId) return;
    
    sendMessage({
      type: 'TYPING_STATUS',
      payload: {
        userId: state.currentUserId,
        isTyping,
      },
    });
  }, [state.isConnected, state.currentUserId, sendMessage]);
  
  // Update chat settings
  const updateChatSettings = useCallback((settings) => {
    dispatch({ type: 'SET_CHAT_SETTINGS', payload: settings });
    
    // If connected, send the updated settings to the server
    if (state.isConnected && state.currentUserId) {
      sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          userId: state.currentUserId,
          settings,
        },
      });
    }
    
    // If refresh rate changed and tracking is active, restart tracking
    if (settings.refreshRate && state.isConnected) {
      stopTracking();
      startTracking(settings.refreshRate);
    }
  }, [state.isConnected, state.currentUserId, sendMessage, startTracking, stopTracking]);
  
  // Get nearby messages filtered by distance
  const getNearbyMessages = useCallback(() => {
    if (!state.userLocation) return [];
    
    return state.messages.filter(message => {
      if (!message.location) return false;
      
      const distance = calculateDistance(
        state.userLocation.latitude,
        state.userLocation.longitude,
        message.location.latitude,
        message.location.longitude
      );
      
      return distance <= state.chatSettings.maxDistance;
    });
  }, [state.messages, state.userLocation, state.chatSettings.maxDistance]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback((messageIds = null) => {
    if (!state.isConnected || !state.currentUserId) return;
    
    // If no message IDs provided, find all unread messages not from the current user
    const idsToMark = messageIds || 
      getUnreadMessages(state.messages, state.currentUserId)
        .map(message => message.id);
    
    if (!idsToMark.length) return;
    
    // Update locally
    dispatch({
      type: 'UPDATE_MESSAGE_RECEIPTS',
      payload: {
        messageIds: idsToMark,
        status: ReceiptStatus.READ,
        userId: state.currentUserId
      }
    });
    
    // Send to server
    idsToMark.forEach(id => {
      const receiptUpdate = createReceiptUpdateMessage(
        id, 
        ReceiptStatus.READ,
        state.currentUserId
      );
      sendMessage(receiptUpdate);
    });
  }, [state.isConnected, state.currentUserId, state.messages, sendMessage]);
  
  // Update location sharing
  const updateLocationSharing = async (locationSettings) => {
    if (!state.currentUserId) return;
    
    try {
      dispatch({ 
        type: 'UPDATE_LOCATION_SHARING', 
        payload: locationSettings 
      });
      
      // If location sharing is disabled, update presence
      if (!locationSettings.isEnabled && state.isConnected) {
        const message = {
          type: 'UPDATE_PRESENCE',
          payload: {
            userId: state.currentUserId,
            isLocationSharingEnabled: false
          }
        };
        
        sendMessage(JSON.stringify(message));
      }
      
      // If it was re-enabled, update presence with new location
      if (locationSettings.isEnabled && state.userLocation && state.isConnected) {
        updateUserLocation(state.userLocation);
      }
      
      // Also update the server with new settings
      await updateChatSettings({
        ...state.chatSettings,
        locationSharing: locationSettings
      });
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Failed to update location sharing: ${error.message}` 
      });
    }
  };
  
  // Track when user enters a region
  const trackRegionEntry = useCallback((regionId) => {
    if (!state.enteredRegions[regionId]) {
      dispatch({
        type: 'SET_ENTERED_REGION',
        payload: {
          regionId,
          timestamp: new Date()
        }
      });
    }
  }, [state.enteredRegions]);
  
  // Get the timestamp when user entered a region
  const getRegionEntryTime = useCallback((regionId) => {
    return state.enteredRegions[regionId] || null;
  }, [state.enteredRegions]);
  
  // Load message history for a region
  const loadMessageHistory = useCallback(async (regionId) => {
    if (state.loadingHistory) return;
    
    try {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: true });
      
      const entryTime = getRegionEntryTime(regionId);
      const messages = await messageHistoryService.loadMessageHistory(regionId);
      
      if (messages.length > 0) {
        dispatch({
          type: 'ADD_HISTORICAL_MESSAGES',
          payload: messages
        });
      }
      
      return messages;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to load message history: ${error.message}`
      });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: false });
    }
  }, [state.loadingHistory, getRegionEntryTime]);
  
  // Load messages that were sent before the user entered the region
  const loadMessagesBeforeArrival = useCallback(async (regionId) => {
    const entryTime = getRegionEntryTime(regionId);
    if (!entryTime) return [];
    
    try {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: true });
      
      const messages = await messageHistoryService.loadMessagesBeforeArrival(
        regionId,
        entryTime
      );
      
      if (messages.length > 0) {
        dispatch({
          type: 'ADD_HISTORICAL_MESSAGES',
          payload: messages
        });
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to load previous messages:', error);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: false });
    }
  }, [getRegionEntryTime]);
  
  // Load older messages (scrollback)
  const loadOlderMessages = useCallback(async (regionId, oldestTimestamp) => {
    if (state.loadingHistory || 
        (state.reachedEndOfHistory[regionId] && state.reachedEndOfHistory[regionId] === true)) {
      return [];
    }
    
    try {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: true });
      
      const olderMessages = await messageHistoryService.loadOlderMessages(
        regionId,
        oldestTimestamp
      );
      
      if (olderMessages.length > 0) {
        dispatch({
          type: 'ADD_HISTORICAL_MESSAGES',
          payload: olderMessages
        });
      } else {
        dispatch({
          type: 'SET_REACHED_END_OF_HISTORY',
          payload: {
            regionId,
            reachedEnd: true
          }
        });
      }
      
      return olderMessages;
    } catch (error) {
      console.error('Failed to load older messages:', error);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING_HISTORY', payload: false });
    }
  }, [state.loadingHistory, state.reachedEndOfHistory]);
  
  // Reset history end status when changing regions
  const resetHistoryStatus = useCallback((regionId) => {
    if (state.reachedEndOfHistory[regionId]) {
      dispatch({
        type: 'SET_REACHED_END_OF_HISTORY',
        payload: {
          regionId,
          reachedEnd: false
        }
      });
    }
  }, [state.reachedEndOfHistory]);
  
  // Context value
  const contextValue = {
    isConnected: state.isConnected,
    messages: state.messages,
    nearbyUsers: state.nearbyUsers,
    currentUserId: state.currentUserId,
    userLocation: state.userLocation,
    typingUsers: state.typingUsers,
    chatSettings: state.chatSettings,
    isLoading: state.isLoading,
    error: state.error,
    connect,
    disconnect,
    sendMessage,
    updateLocation,
    updateChatSettings,
    setTypingStatus: updateTypingStatus,
    markMessageAsRead: markMessagesAsRead,
    updateLocationSharing,
    trackRegionEntry,
    getRegionEntryTime,
    loadMessageHistory,
    loadMessagesBeforeArrival,
    loadOlderMessages,
    resetHistoryStatus,
    markMessagesAsRead
  };
  
  return (
    <ProximityChatContext.Provider value={contextValue}>
      {children}
    </ProximityChatContext.Provider>
  );
}

ProximityChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
  userId: PropTypes.string,
};

// Custom hook to use the context
export function useProximityChatContext() {
  const context = useContext(ProximityChatContext);
  if (context === undefined) {
    throw new Error('useProximityChatContext must be used within a ProximityChatProvider');
  }
  return context;
}

export default ProximityChatContext; 