/**
 * Custom hook for managing message history
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMessageHistory, markMessagesAsRead } from '../services/messageHistoryService';
import { TIMING } from '../constants';

/**
 * Hook for loading and managing message history for a region
 * 
 * @param {Object} options - Hook options
 * @param {string} options.regionId - ID of the region to load messages for
 * @param {boolean} [options.autoLoad=true] - Whether to load messages automatically
 * @param {boolean} [options.markAsReadOnUnmount=true] - Whether to mark messages as read when unmounting
 * @returns {Object} History data and control methods
 */
const useMessageHistory = (options = {}) => {
  const {
    regionId,
    autoLoad = true,
    markAsReadOnUnmount = true
  } = options;

  const [historyMessages, setHistoryMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // Load messages that were sent before the user joined the region
  const loadBeforeArrival = useCallback(async (arrivalTime = Date.now()) => {
    if (!regionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const messages = await fetchMessageHistory(regionId, {
        before: arrivalTime,
        limit: TIMING.MESSAGE_HISTORY_LOAD_LIMIT,
        includeBeforeJoin: true
      });
      
      setHistoryMessages(messages);
      setHasMoreMessages(messages.length >= TIMING.MESSAGE_HISTORY_LOAD_LIMIT);
    } catch (err) {
      setError(err);
      console.error('Error loading message history:', err);
    } finally {
      setLoading(false);
    }
  }, [regionId]);
  
  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async (oldestMessageTimestamp) => {
    if (!regionId || !oldestMessageTimestamp) return;
    
    setLoading(true);
    
    try {
      const olderMessages = await fetchMessageHistory(regionId, {
        before: oldestMessageTimestamp,
        limit: TIMING.MESSAGE_HISTORY_LOAD_LIMIT
      });
      
      if (olderMessages.length > 0) {
        setHistoryMessages(prev => [...prev, ...olderMessages]);
      }
      
      setHasMoreMessages(olderMessages.length >= TIMING.MESSAGE_HISTORY_LOAD_LIMIT);
    } catch (err) {
      setError(err);
      console.error('Error loading older messages:', err);
    } finally {
      setLoading(false);
    }
  }, [regionId]);
  
  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!regionId || historyMessages.length === 0) return;
    
    try {
      // Get the ID of the most recent message
      const latestMessageId = historyMessages[0]?.id;
      
      if (latestMessageId) {
        await markMessagesAsRead(regionId, { upToMessageId: latestMessageId });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [regionId, historyMessages]);
  
  // Auto-load messages on mount if enabled
  useEffect(() => {
    if (autoLoad && regionId) {
      loadBeforeArrival();
    }
    
    // Mark messages as read on unmount if enabled
    return () => {
      if (markAsReadOnUnmount) {
        markAsRead();
      }
    };
  }, [autoLoad, regionId, loadBeforeArrival, markAsRead, markAsReadOnUnmount]);
  
  return {
    historyMessages,
    loading,
    error,
    hasMoreMessages,
    loadBeforeArrival,
    loadOlderMessages,
    markAsRead
  };
};

export default useMessageHistory; 