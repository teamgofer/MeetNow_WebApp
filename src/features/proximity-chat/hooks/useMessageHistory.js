/**
 * Custom hook for managing message history
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { TIMING } from '../constants';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * Hook for managing message history in the proximity chat
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.autoLoad=true] - Whether to load messages automatically
 * @param {boolean} [options.markAsReadOnUnmount=true] - Whether to mark messages as read on unmount
 * @param {number} [options.limit=50] - Maximum number of messages to load at once
 * @returns {Object} Message history state and methods
 */
const useMessageHistory = ({
  autoLoad = true,
  markAsReadOnUnmount = true,
  limit = 50
} = {}) => {
  const { currentUserId, region } = useProximityChatContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastLoadedTimestamp, setLastLoadedTimestamp] = useState(null);
  const messageCache = useRef(new Map());
  const renderStartTimeRef = useRef(Date.now());
  
  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', renderDuration, {
      success: true,
      action: 'initialize',
      autoLoad,
      limit,
      region
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [autoLoad, limit, region]);
  
  // Load messages from the server
  const loadMessages = useCallback(async (beforeTimestamp = null) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = `${region}-${beforeTimestamp || 'latest'}`;
      const cachedMessages = messageCache.current.get(cacheKey);
      
      if (cachedMessages) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
          success: true,
          action: 'loadFromCache',
          messageCount: cachedMessages.length,
          region,
          beforeTimestamp
        });
        
        setMessages(prevMessages => beforeTimestamp 
          ? [...prevMessages, ...cachedMessages]
          : cachedMessages
        );
        return;
      }
      
      // Fetch from server
      const response = await fetch(`/api/messages?region=${region}&limit=${limit}${beforeTimestamp ? `&before=${beforeTimestamp}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const newMessages = await response.json();
      
      // Update cache
      messageCache.current.set(cacheKey, newMessages);
      
      // Update state
      setMessages(prevMessages => beforeTimestamp 
        ? [...prevMessages, ...newMessages]
        : newMessages
      );
      setHasMore(newMessages.length === limit);
      setLastLoadedTimestamp(newMessages[newMessages.length - 1]?.timestamp || null);
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: true,
        action: 'loadFromServer',
        messageCount: newMessages.length,
        region,
        beforeTimestamp,
        hasMore: newMessages.length === limit
      });
    } catch (error) {
      setError(error);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: false,
        action: 'loadMessages',
        error: error.message,
        region,
        beforeTimestamp
      });
    } finally {
      setIsLoading(false);
    }
  }, [region, limit]);
  
  // Load more messages
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const startTime = Date.now();
    try {
      await loadMessages(lastLoadedTimestamp);
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: true,
        action: 'loadMore',
        region,
        lastLoadedTimestamp
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: false,
        action: 'loadMore',
        error: error.message,
        region,
        lastLoadedTimestamp
      });
      throw error;
    }
  }, [isLoading, hasMore, lastLoadedTimestamp, loadMessages, region]);
  
  // Mark messages as read
  const markAsRead = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      const unreadMessages = messages.filter(msg => 
        !msg.isRead && msg.senderId !== currentUserId
      );
      
      if (unreadMessages.length === 0) return;
      
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageIds: unreadMessages.map(msg => msg.id)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
      
      // Update messages in state and cache
      const updatedMessages = messages.map(msg => ({
        ...msg,
        isRead: msg.isRead || unreadMessages.some(unread => unread.id === msg.id)
      }));
      
      setMessages(updatedMessages);
      messageCache.current.forEach((cached, key) => {
        if (key.startsWith(region)) {
          messageCache.current.set(key, cached.map(msg => ({
            ...msg,
            isRead: msg.isRead || unreadMessages.some(unread => unread.id === msg.id)
          })));
        }
      });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: true,
        action: 'markAsRead',
        messageCount: unreadMessages.length,
        region
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
        success: false,
        action: 'markAsRead',
        error: error.message,
        region
      });
      throw error;
    }
  }, [messages, currentUserId, region]);
  
  // Auto-load messages on mount or region change
  useEffect(() => {
    if (autoLoad && region) {
      const startTime = Date.now();
      loadMessages()
        .then(() => {
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
            success: true,
            action: 'autoLoad',
            region
          });
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
            success: false,
            action: 'autoLoad',
            error: error.message,
            region
          });
        });
    }
  }, [autoLoad, region, loadMessages]);
  
  // Mark messages as read on unmount
  useEffect(() => {
    return () => {
      if (markAsReadOnUnmount) {
        const startTime = Date.now();
        markAsRead()
          .then(() => {
            const duration = Date.now() - startTime;
            PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
              success: true,
              action: 'markAsReadOnUnmount',
              region
            });
          })
          .catch(error => {
            const duration = Date.now() - startTime;
            PerformanceMonitor.trackOperationTiming('hook', 'useMessageHistory', duration, {
              success: false,
              action: 'markAsReadOnUnmount',
              error: error.message,
              region
            });
          });
      }
    };
  }, [markAsReadOnUnmount, markAsRead, region]);
  
  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    markAsRead
  };
};

export default useMessageHistory; 