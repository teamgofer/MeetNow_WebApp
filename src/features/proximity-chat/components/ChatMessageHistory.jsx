import React, { useEffect, useRef } from 'react';
import useMessageHistory from '../hooks/useMessageHistory';
import MessageHistoryHeader from './MessageHistoryHeader';
import MessageList from './MessageList';
import styles from '../styles/ChatMessageHistory.module.css';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

/**
 * Component for displaying previous messages in a chat region
 * 
 * @param {Object} props - Component props
 * @param {string} [props.regionName] - Name of the region
 * @param {Object} props.regionTimeInfo - Information about when user entered the region
 * @param {Date} props.regionTimeInfo.enteredAt - When the user entered the region
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const ChatMessageHistory = ({ 
  regionName, 
  regionTimeInfo,
  className = '',
  style = {}
}) => {
  const renderStartTimeRef = useRef(Date.now());
  
  // Don't render if no region time info
  if (!regionTimeInfo) {
    PerformanceMonitor.trackOperationTiming('chat_message_history_init', 0, {
      success: false,
      reason: 'no_region_time_info'
    });
    return null;
  }
  
  // Use region name from time info if not provided directly
  const displayName = regionName || regionTimeInfo.regionName || 'Unknown Region';
  
  // Load message history for this region
  const {
    historyMessages,
    loading,
    error,
    hasMoreMessages,
    loadBeforeArrival,
    loadOlderMessages
  } = useMessageHistory({ 
    regionId: regionTimeInfo.regionId,
    autoLoad: true,
    markAsReadOnUnmount: true
  });
  
  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('chat_message_history_init', duration, {
      success: true,
      hasRegionName: !!regionName,
      hasRegionTimeInfo: !!regionTimeInfo,
      displayName,
      regionId: regionTimeInfo.regionId
    });
  }, [regionName, regionTimeInfo, displayName]);
  
  // Load messages when component mounts or when region/time changes
  useEffect(() => {
    if (regionTimeInfo && regionTimeInfo.enteredAt) {
      const startTime = Date.now();
      loadBeforeArrival(regionTimeInfo.enteredAt.getTime());
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('load_before_arrival', duration, {
        success: true,
        messageCount: historyMessages.length,
        regionId: regionTimeInfo.regionId,
        regionName: displayName,
        enteredAt: regionTimeInfo.enteredAt,
        hasMoreMessages
      });
    }
  }, [regionTimeInfo, loadBeforeArrival, historyMessages.length, displayName, hasMoreMessages]);
  
  // Handle loading more messages
  const handleLoadMore = (oldestMessageTimestamp) => {
    const startTime = Date.now();
    loadOlderMessages(oldestMessageTimestamp);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('load_older_messages', duration, {
      success: true,
      messageCount: historyMessages.length,
      regionId: regionTimeInfo.regionId,
      regionName: displayName,
      oldestTimestamp: oldestMessageTimestamp,
      hasMoreMessages
    });
  };
  
  // Track error state
  useEffect(() => {
    if (error) {
      PerformanceMonitor.trackError('chat_message_history', error, {
        regionId: regionTimeInfo.regionId,
        regionName: displayName,
        messageCount: historyMessages.length
      });
    }
  }, [error, regionTimeInfo.regionId, displayName, historyMessages.length]);
  
  // Track loading state
  useEffect(() => {
    if (loading) {
      PerformanceMonitor.trackOperationTiming('message_history_loading', 0, {
        success: true,
        regionId: regionTimeInfo.regionId,
        regionName: displayName,
        messageCount: historyMessages.length,
        hasMoreMessages
      });
    }
  }, [loading, regionTimeInfo.regionId, displayName, historyMessages.length, hasMoreMessages]);
  
  // Show loading state
  if (loading && historyMessages.length === 0) {
    return (
      <div 
        className={`${styles.chatMessageHistory} ${className}`}
        style={style}
      >
        <div className={styles.loadingContainer}>
          <p>Loading message history...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !loading) {
    return (
      <div 
        className={`${styles.chatMessageHistory} ${className}`}
        style={style}
      >
        <div className={styles.errorContainer}>
          <p>Error loading message history: {error.message}</p>
          <button 
            className={styles.retryButton}
            onClick={() => loadBeforeArrival(regionTimeInfo.enteredAt.getTime())}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Show empty state
  if (historyMessages.length === 0 && !loading) {
    PerformanceMonitor.trackOperationTiming('empty_message_history', 0, {
      success: true,
      regionId: regionTimeInfo.regionId,
      regionName: displayName,
      state: 'empty'
    });
    
    return (
      <div 
        className={`${styles.chatMessageHistory} ${className}`}
        style={style}
      >
        <div className={styles.emptyContainer}>
          <p>No previous messages in this area.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`${styles.chatMessageHistory} ${className}`} 
      style={style}
    >
      {/* History header showing region and message count */}
      <MessageHistoryHeader 
        regionName={displayName}
        messageCount={historyMessages.length}
        enteredAreaTime={regionTimeInfo.enteredAt}
      />
      
      {/* Message list with history messages */}
      <MessageList 
        messages={historyMessages}
        isHistory={true}
        hasMore={hasMoreMessages}
        onLoadMore={(messages) => {
          if (messages.length > 0) {
            const oldestMessage = messages[messages.length - 1];
            handleLoadMore(new Date(oldestMessage.timestamp).getTime());
          }
        }}
      />
    </div>
  );
};

export default ChatMessageHistory; 