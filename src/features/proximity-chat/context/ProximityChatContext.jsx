import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
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
import { LocationService } from '../services/LocationService';
import messageHistoryService from '../services/messageHistoryService';
import { WebSocketService } from '../services/WebSocketService';
import { MessageService } from '../services/MessageService';
import { FEATURES, INTEGRATION } from '../constants';
import { ErrorBoundary } from '../components/ErrorBoundary';
import PerformanceMonitor from '../../../utils/PerformanceMonitor';

// Initial state
const initialState = {
  isConnected: false,
  messages: [],
  nearbyUsers: [],
  sessionId: null,
  userLocation: null,
  typingUsers: {},
  chatSettings: {
    radius: 500, // default radius in meters
    anonymousMode: true, // default to anonymous for all users
    notifications: true,
    locationPrecision: 'exact', // 'exact', 'approximate', 'area'
  },
  isLoading: false,
  error: null,
  enteredRegions: {}, // Track when user entered each region
  loadingHistory: false,
  reachedEndOfHistory: {} // Track which regions have no more history
};

// Create the context
const ProximityChatContext = createContext(initialState);

// Action types
const ActionTypes = {
  SET_CONNECTED: 'SET_CONNECTED',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_NEARBY_USERS: 'UPDATE_NEARBY_USERS',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_TYPING_STATUS: 'SET_TYPING_STATUS',
  UPDATE_CHAT_SETTINGS: 'UPDATE_CHAT_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  SET_ENTERED_REGION: 'SET_ENTERED_REGION',
  SET_LOADING_HISTORY: 'SET_LOADING_HISTORY',
  SET_REACHED_END_OF_HISTORY: 'SET_REACHED_END_OF_HISTORY',
  ADD_HISTORICAL_MESSAGES: 'ADD_HISTORICAL_MESSAGES',
  UPDATE_LOCATION_SHARING: 'UPDATE_LOCATION_SHARING',
};

// Reducer to handle state updates
const chatReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CONNECTED:
      return {
        ...state,
        isConnected: action.payload,
        error: action.payload ? null : state.error,
      };
    case ActionTypes.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case ActionTypes.UPDATE_NEARBY_USERS:
      return {
        ...state,
        nearbyUsers: action.payload,
      };
    case ActionTypes.SET_USER_LOCATION:
      return {
        ...state,
        userLocation: action.payload,
      };
    case ActionTypes.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.payload,
      };
    case ActionTypes.SET_TYPING_STATUS:
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.sessionId]: action.payload.isTyping,
        },
      };
    case ActionTypes.UPDATE_CHAT_SETTINGS:
      return {
        ...state,
        chatSettings: {
          ...state.chatSettings,
          ...action.payload,
        },
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case ActionTypes.RESET_STATE:
      return {
        ...initialState,
        sessionId: state.sessionId,
        chatSettings: state.chatSettings,
      };
    case ActionTypes.SET_ENTERED_REGION:
      return {
        ...state,
        enteredRegions: {
          ...state.enteredRegions,
          [action.payload.regionId]: action.payload.timestamp
        }
      };
    case ActionTypes.SET_LOADING_HISTORY:
      return {
        ...state,
        loadingHistory: action.payload
      };
    case ActionTypes.SET_REACHED_END_OF_HISTORY:
      return {
        ...state,
        reachedEndOfHistory: {
          ...state.reachedEndOfHistory,
          [action.payload.regionId]: action.payload.reachedEnd
        }
      };
    case ActionTypes.ADD_HISTORICAL_MESSAGES:
      return {
        ...state,
        messages: [...action.payload, ...state.messages]
      };
    case ActionTypes.UPDATE_LOCATION_SHARING:
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
    default:
      return state;
  }
};

// Custom error handler
const handleProximityChatError = (error, errorInfo) => {
  console.error('ProximityChat Error:', error, errorInfo);
  
  // Based on integration settings, handle the error appropriately
  switch (INTEGRATION.ERROR_HANDLING) {
    case 'log':
      console.error('ProximityChat Error:', error);
      break;
    case 'alert':
      if (process.env.NODE_ENV !== 'production') {
        alert(`ProximityChat Error: ${error.message}`);
      }
      break;
    case 'silent':
    default:
      // Just log to internal error tracking, don't alert user
      break;
  }
  
  // You could also send to an error tracking service here
};

// Provider component
export function ProximityChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const renderStartTimeRef = React.useRef(Date.now());
  
  // Track context initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('proximity_chat_context_init', duration, {
      hasInitialState: !!state,
      hasWebSocketService: !!chatSocketService,
      hasLocationService: !!LocationService,
      hasMessageService: !!messageHistoryService
    });
  }, []);
  
  // Check if the feature is enabled
  const isFeatureEnabled = useMemo(() => FEATURES.PROXIMITY_CHAT_ENABLED, []);
  
  // If feature is disabled, render children without the provider
  if (!isFeatureEnabled) {
    return <>{children}</>;
  }
  
  // Initialize services
  const webSocketService = useMemo(() => new WebSocketService(), []);
  const locationService = useMemo(() => new LocationService(), []);
  const messageService = useMemo(() => new MessageService(), []);

  // Generate a session ID if we don't have one
  useEffect(() => {
    if (!state.sessionId) {
      const newSessionId = `anon_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      dispatch({ type: ActionTypes.SET_SESSION_ID, payload: newSessionId });
      
      // Store it in localStorage for session persistence across page reloads
      try {
        localStorage.setItem('proximityChatSessionId', newSessionId);
      } catch (e) {
        console.warn('Failed to store session ID in localStorage', e);
      }
    }
  }, [state.sessionId]);

  // Set up WebSocket connection
  useEffect(() => {
    // Set up WebSocket event handlers
    const handleConnectionStatus = (isConnected) => {
      dispatch({ type: ActionTypes.SET_CONNECTED, payload: isConnected });
    };
    
    const handleMessage = (message) => {
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: message });
    };
    
    const handleNearbyUsers = (users) => {
      dispatch({ type: ActionTypes.UPDATE_NEARBY_USERS, payload: users });
    };
    
    const handleTypingStatus = (sessionId, isTyping) => {
      dispatch({ 
        type: ActionTypes.SET_TYPING_STATUS, 
        payload: { sessionId, isTyping } 
      });
    };
    
    const handleError = (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    };
    
    // Register event handlers
    webSocketService.onConnectionStatus(handleConnectionStatus);
    webSocketService.onMessage(handleMessage);
    webSocketService.onNearbyUsersUpdate(handleNearbyUsers);
    webSocketService.onTypingStatus(handleTypingStatus);
    webSocketService.onError(handleError);
    
    // Clean up event handlers when component unmounts
    return () => {
      webSocketService.offConnectionStatus(handleConnectionStatus);
      webSocketService.offMessage(handleMessage);
      webSocketService.offNearbyUsersUpdate(handleNearbyUsers);
      webSocketService.offTypingStatus(handleTypingStatus);
      webSocketService.offError(handleError);
    };
  }, [webSocketService]);

  // Connect to chat when we have a session ID and location
  useEffect(() => {
    if (state.sessionId && state.userLocation && !state.isConnected) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      webSocketService.connect(state.userLocation, { 
        sessionId: state.sessionId
      }).then(() => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }).catch(error => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      });
    }
  }, [state.sessionId, state.userLocation, state.isConnected, webSocketService]);
  
  // Get user location when component mounts
  useEffect(() => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    locationService.getCurrentLocation()
      .then(location => {
        dispatch({ type: ActionTypes.SET_USER_LOCATION, payload: location });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      })
      .catch(error => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      });
      
    // Set up periodic location updates
    const locationInterval = setInterval(() => {
      if (state.isConnected) {
        locationService.getCurrentLocation()
          .then(location => {
            dispatch({ type: ActionTypes.SET_USER_LOCATION, payload: location });
            webSocketService.updateLocation(location);
          })
          .catch(error => {
            console.error('Failed to update location:', error);
          });
      }
    }, 60000); // Update every minute
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(locationInterval);
    };
  }, [locationService, webSocketService, state.isConnected]);

  // Connection functions
  const connect = useCallback(async () => {
    if (!state.userLocation) {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const location = await locationService.getCurrentLocation();
        dispatch({ type: ActionTypes.SET_USER_LOCATION, payload: location });
        
        // Now that we have a location, the useEffect will trigger the connection
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    } else if (!state.isConnected) {
      // If we already have a location but are not connected
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      try {
        await webSocketService.connect(state.userLocation, { 
          sessionId: state.sessionId
        });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }
  }, [state.userLocation, state.isConnected, state.sessionId, locationService, webSocketService]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, [webSocketService]);

  // Send a message
  const sendMessage = useCallback((content) => {
    if (!state.isConnected || !state.userLocation || !state.sessionId) {
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Cannot send message: Not connected or missing location/session' 
      });
      return;
    }
    
    const message = {
      id: `msg_${Date.now()}_${state.sessionId.substring(0, 8)}`,
      sessionId: state.sessionId,
      content,
      timestamp: new Date().toISOString(),
      location: state.userLocation,
      isAnonymous: state.chatSettings.anonymousMode,
    };
    
    webSocketService.sendMessage(message);
  }, [state.isConnected, state.userLocation, state.sessionId, state.chatSettings.anonymousMode, webSocketService]);

  // Update location manually
  const updateLocation = useCallback(async () => {
    const startTime = Date.now();
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const location = await locationService.getCurrentLocation();
      dispatch({ type: ActionTypes.SET_USER_LOCATION, payload: location });
      
      if (state.isConnected) {
        webSocketService.updateLocation(location);
      }
      
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('location_update', duration, {
        success: true,
        hasLocation: !!location,
        isConnected: state.isConnected
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('location_update', duration, {
        success: false,
        error: error.message
      });
    }
  }, [locationService, webSocketService, state.isConnected]);

  // Set typing status
  const setTypingStatus = useCallback((isTyping) => {
    const startTime = Date.now();
    if (state.isConnected && state.sessionId) {
      webSocketService.setTypingStatus(state.sessionId, isTyping);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('typing_status_update', duration, {
        success: true,
        isTyping,
        hasSessionId: !!state.sessionId
      });
    }
  }, [webSocketService, state.isConnected, state.sessionId]);

  // Update chat settings
  const updateChatSettings = useCallback((newSettings) => {
    const startTime = Date.now();
    dispatch({ type: ActionTypes.UPDATE_CHAT_SETTINGS, payload: newSettings });
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_settings_update', duration, {
      success: true,
      hasNewSettings: !!newSettings,
      settingsKeys: Object.keys(newSettings)
    });
  }, []);

  // Get nearby messages filtered by distance
  const getNearbyMessages = useCallback(() => {
    const startTime = Date.now();
    if (!state.userLocation) return [];
    
    const messages = state.messages.filter(message => {
      if (!message.location) return false;
      
      const distance = calculateDistance(
        state.userLocation.latitude,
        state.userLocation.longitude,
        message.location.latitude,
        message.location.longitude
      );
      
      return distance <= state.chatSettings.maxDistance;
    });
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('nearby_messages_filter', duration, {
      success: true,
      totalMessages: state.messages.length,
      filteredCount: messages.length,
      hasUserLocation: !!state.userLocation
    });
    
    return messages;
  }, [state.messages, state.userLocation, state.chatSettings.maxDistance]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback((messageIds = null) => {
    if (!state.isConnected || !state.sessionId) return;
    
    // If no message IDs provided, find all unread messages not from the current user
    const idsToMark = messageIds || 
      getUnreadMessages(state.messages, state.sessionId)
        .map(message => message.id);
    
    if (!idsToMark.length) return;
    
    // Update locally
    dispatch({
      type: 'UPDATE_MESSAGE_RECEIPTS',
      payload: {
        messageIds: idsToMark,
        status: ReceiptStatus.READ,
        userId: state.sessionId
      }
    });
    
    // Send to server
    idsToMark.forEach(id => {
      const receiptUpdate = createReceiptUpdateMessage(
        id, 
        ReceiptStatus.READ,
        state.sessionId
      );
      sendMessage(receiptUpdate);
    });
  }, [state.isConnected, state.sessionId, state.messages, sendMessage]);
  
  // Update location sharing
  const updateLocationSharing = async (locationSettings) => {
    if (!state.sessionId) return;
    
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
            userId: state.sessionId,
            isLocationSharingEnabled: false
          }
        };
        
        sendMessage(JSON.stringify(message));
      }
      
      // If it was re-enabled, update presence with new location
      if (locationSettings.isEnabled && state.userLocation && state.isConnected) {
        updateLocation();
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
    sessionId: state.sessionId,
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
    setTypingStatus,
    markMessageAsRead: markMessagesAsRead,
    updateLocationSharing,
    trackRegionEntry,
    getRegionEntryTime,
    loadMessageHistory,
    loadMessagesBeforeArrival,
    loadOlderMessages,
    resetHistoryStatus,
    markMessagesAsRead,
    getNearbyMessages
  };
  
  return (
    <ErrorBoundary onError={handleProximityChatError} fallback={<>{children}</>}>
      <ProximityChatContext.Provider value={contextValue}>
        {children}
      </ProximityChatContext.Provider>
    </ErrorBoundary>
  );
}

ProximityChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
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