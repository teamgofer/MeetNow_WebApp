import { useState, useEffect, useCallback, useRef } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import { TIMING } from '../constants';
import { useProximityChatContext } from '../context/ProximityChatContext';

/**
 * Custom hook for managing typing indicators in the proximity chat
 *
 * This hook tracks the current user's typing status and handles
 * updating the server when the user starts or stops typing.
 * It also tracks other users who are currently typing.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.typingTimeoutMs - Time in ms after which typing status is reset (default: 2000)
 * @param {boolean} options.enabled - Whether to enable typing indicators (default: true)
 * @returns {Object} Typing indicator state and methods
 */
const useTypingIndicator = ({ typingTimeoutMs = 2000, enabled = true } = {}) => {
  const { currentUserId } = useProximityChatContext();
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutsRef = useRef({});
  const renderStartTimeRef = useRef(Date.now());

  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', renderDuration, {
      success: true,
      action: 'initialize',
      currentUserId,
    });

    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [currentUserId]);

  /**
   * Clears any existing typing timeout
   */
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutsRef.current) {
      Object.values(typingTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      typingTimeoutsRef.current = {};
    }
  }, []);

  /**
   * Notifies that the user has started typing
   */
  const startTyping = useCallback(() => {
    if (!enabled) return;

    // Only trigger if we weren't already typing
    if (!isTyping) {
      setIsTyping(true);
    }

    // Clear any existing timeout
    clearTypingTimeout();

    // Set timeout to auto-reset typing status
    const startTime = Date.now();
    typingTimeoutsRef.current[currentUserId] = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutsRef.current[currentUserId] = null;
    }, typingTimeoutMs);
  }, [enabled, isTyping, currentUserId, clearTypingTimeout, typingTimeoutMs]);

  /**
   * Notifies that the user has stopped typing
   */
  const stopTyping = useCallback(() => {
    if (!enabled || !isTyping) return;

    setIsTyping(false);
    clearTypingTimeout();
  }, [enabled, isTyping, clearTypingTimeout]);

  /**
   * Handle input changes to trigger typing status
   *
   * @param {Event} event - Input change event
   */
  const handleInputChange = useCallback(
    event => {
      const value = event.target.value;

      if (value.trim().length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  /**
   * Handle when the input is submitted
   */
  const handleSubmit = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  // Handle typing status updates
  const handleTypingChange = useCallback((userId, isTyping) => {
    const startTime = Date.now();

    setTypingUsers(prevUsers => {
      const newUsers = isTyping
        ? [...prevUsers, { id: userId, timestamp: Date.now() }]
        : prevUsers.filter(user => user.id !== userId);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', duration, {
        success: true,
        userId,
        isTyping,
        userCount: newUsers.length,
        action: 'updateTypingStatus',
      });

      return newUsers;
    });

    // Set timeout to remove typing status
    if (isTyping) {
      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
      }

      const timeoutStartTime = Date.now();
      typingTimeoutsRef.current[userId] = setTimeout(() => {
        const timeoutDuration = Date.now() - timeoutStartTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', timeoutDuration, {
          success: true,
          userId,
          action: 'typingTimeout',
          timeout: TIMING.TYPING_TIMEOUT,
        });

        handleTypingChange(userId, false);
      }, TIMING.TYPING_TIMEOUT);
    }
  }, []);

  // Handle user typing status cleanup
  useEffect(() => {
    const startTime = Date.now();

    // Cleanup expired typing statuses
    const now = Date.now();
    setTypingUsers(prevUsers => {
      const activeUsers = prevUsers.filter(user => now - user.timestamp < TIMING.TYPING_TIMEOUT);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', duration, {
        success: true,
        totalUsers: prevUsers.length,
        activeUsers: activeUsers.length,
        action: 'cleanupExpired',
      });

      return activeUsers;
    });
  }, []);

  // Handle typing status changes
  useEffect(() => {
    const startTime = Date.now();
    const hasTypingUsers = typingUsers.length > 0;

    if (hasTypingUsers !== isTyping) {
      setIsTyping(hasTypingUsers);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', duration, {
        success: true,
        typingUsersCount: typingUsers.length,
        action: 'statusChange',
        state: hasTypingUsers ? 'typing' : 'idle',
      });
    }
  }, [typingUsers.length, isTyping]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      const startTime = Date.now();
      Object.values(typingTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useTypingIndicator', duration, {
        success: true,
        timeoutCount: Object.keys(typingTimeoutsRef.current).length,
        action: 'cleanup',
      });
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    hasTypingUsers: typingUsers.length > 0,
    typingUsersCount: typingUsers.length,
    handleInputChange,
    handleSubmit,
    startTyping,
    stopTyping,
    handleTypingChange,
  };
};

export default useTypingIndicator;
