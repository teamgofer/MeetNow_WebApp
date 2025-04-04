import { useState, useEffect, useCallback, useRef } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import { TIMING } from '../constants';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import { useProximityChatContext } from '../context/ProximityChatContext';

import { useMessageHistory } from './useMessageHistory';
import { useTypingIndicator } from './useTypingIndicator';

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
export const useProximityChat = ({ userId, initialLocation, autoConnect = false } = {}) => {
  const {
    isConnected,
    messages,
    nearbyUsers,
    connect,
    disconnect,
    updateLocation,
    sendMessage,
    isLoading,
    error,
  } = useProximityChatContext();

  // Local state for tracking if connection has been attempted
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const renderStartTimeRef = useRef(Date.now());

  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', renderDuration, {
      success: true,
      action: 'initialize',
      userId,
      hasLocation: !!initialLocation,
      autoConnect,
    });

    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [userId, initialLocation, autoConnect]);

  /**
   * Initialize the chat connection
   */
  const initializeChat = useCallback(
    async location => {
      const startTime = Date.now();

      try {
        if (!userId) {
          throw new Error('Cannot initialize chat: User ID is required');
        }

        const locationToUse = location || initialLocation;
        if (!locationToUse) {
          throw new Error('Cannot initialize chat: Location is required');
        }

        await connect(userId, locationToUse);
        setHasAttemptedConnection(true);

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: true,
          action: 'connect',
          userId,
          location: locationToUse,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: false,
          action: 'connect',
          userId,
          error: error.message,
        });
        throw error;
      }
    },
    [userId, initialLocation, connect]
  );

  /**
   * Shut down the chat connection
   */
  const shutdownChat = useCallback(() => {
    const startTime = Date.now();

    try {
      disconnect();
      setHasAttemptedConnection(false);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
        success: true,
        action: 'disconnect',
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
        success: false,
        action: 'disconnect',
        error: error.message,
      });
      throw error;
    }
  }, [disconnect]);

  /**
   * Send a text message in the proximity chat
   */
  const sendTextMessage = useCallback(
    async (text, options = {}) => {
      const startTime = Date.now();

      try {
        if (!text.trim()) return;

        await sendMessage({
          text,
          ...options,
        });

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: true,
          action: 'sendMessage',
          messageLength: text.length,
          hasOptions: Object.keys(options).length > 0,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: false,
          action: 'sendMessage',
          messageLength: text.length,
          error: error.message,
        });
        throw error;
      }
    },
    [sendMessage]
  );

  /**
   * Update the user's current location
   */
  const setCurrentLocation = useCallback(
    location => {
      const startTime = Date.now();

      try {
        if (!location?.lat || !location.lng) {
          throw new Error('Invalid location object');
        }

        updateLocation(location);

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: true,
          action: 'updateLocation',
          location,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: false,
          action: 'updateLocation',
          error: error.message,
        });
        throw error;
      }
    },
    [updateLocation]
  );

  // Auto-connect effect
  useEffect(() => {
    const startTime = Date.now();

    if (autoConnect && userId && initialLocation && !isConnected && !hasAttemptedConnection) {
      initializeChat();

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
        success: true,
        action: 'autoConnect',
        userId,
        hasLocation: !!initialLocation,
      });
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        const cleanupStartTime = Date.now();
        shutdownChat();

        const duration = Date.now() - cleanupStartTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChat', duration, {
          success: true,
          action: 'cleanup',
        });
      }
    };
  }, [
    autoConnect,
    userId,
    initialLocation,
    isConnected,
    hasAttemptedConnection,
    initializeChat,
    shutdownChat,
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
    updateLocation: setCurrentLocation,
  };
};

export default useProximityChat;
