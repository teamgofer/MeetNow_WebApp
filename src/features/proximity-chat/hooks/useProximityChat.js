import { useState, useEffect, useCallback } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';

/**
 * Custom hook that provides an abstracted interface to the proximity chat
 * 
 * This hook manages the connection to the proximity chat system and provides
 * a simplified API for components to interact with it.
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.userId] - The current user's ID
 * @param {Object} [options.initialLocation] - Initial location {lat, lng}
 * @param {boolean} [options.autoConnect=false] - Whether to connect automatically
 * @returns {Object} Chat interface methods and state
 */
export const useProximityChat = ({ 
  userId,
  initialLocation,
  autoConnect = false
} = {}) => {
  const {
    isConnected,
    messages,
    nearbyUsers,
    connect,
    disconnect,
    updateLocation,
    sendMessage,
    isLoading,
    error
  } = useProximityChatContext();
  
  // Local state for tracking if connection has been attempted
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  
  /**
   * Initialize the chat connection
   */
  const initializeChat = useCallback(async (location) => {
    if (!userId) {
      console.error('Cannot initialize chat: User ID is required');
      return;
    }
    
    const locationToUse = location || initialLocation;
    if (!locationToUse) {
      console.error('Cannot initialize chat: Location is required');
      return;
    }
    
    await connect(userId, locationToUse);
    setHasAttemptedConnection(true);
  }, [userId, initialLocation, connect]);
  
  /**
   * Shut down the chat connection
   */
  const shutdownChat = useCallback(() => {
    disconnect();
    setHasAttemptedConnection(false);
  }, [disconnect]);
  
  /**
   * Send a text message in the proximity chat
   */
  const sendTextMessage = useCallback((text, options = {}) => {
    if (!text.trim()) return;
    
    sendMessage({
      text,
      ...options
    });
  }, [sendMessage]);
  
  /**
   * Update the user's current location
   */
  const setCurrentLocation = useCallback((location) => {
    if (!location || !location.lat || !location.lng) {
      console.error('Invalid location object:', location);
      return;
    }
    
    updateLocation(location);
  }, [updateLocation]);
  
  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && userId && initialLocation && !isConnected && !hasAttemptedConnection) {
      initializeChat();
    }
    
    // Cleanup on unmount
    return () => {
      if (isConnected) {
        shutdownChat();
      }
    };
  }, [
    autoConnect, userId, initialLocation, isConnected, 
    hasAttemptedConnection, initializeChat, shutdownChat
  ]);
  
  return {
    isConnected,
    messages,
    nearbyUsers,
    isLoading,
    error,
    
    // Methods
    initialize: initializeChat,
    shutdown: shutdownChat,
    sendMessage: sendTextMessage,
    updateLocation: setCurrentLocation
  };
};

export default useProximityChat; 