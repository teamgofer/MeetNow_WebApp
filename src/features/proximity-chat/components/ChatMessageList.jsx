import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import ChatMessageItem from './ChatMessageItem';
import { getUnreadMessages } from '../utils/readReceiptUtils';
import '../styles/proximity-chat.css';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor';

/**
 * Component for rendering a list of chat messages with auto-scrolling and read receipts
 */
const ChatMessageList = ({ className = '' }) => {
  const { 
    messages, 
    isLoading, 
    currentUserId,
    markMessagesAsRead 
  } = useProximityChatContext();
  
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const unreadMessagesRef = useRef([]);
  const observerRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());
  
  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('chat_message_list_init', duration, {
      success: true,
      messageCount: messages.length,
      isLoading,
      hasCurrentUserId: !!currentUserId
    });
  }, [messages.length, isLoading, currentUserId]);
  
  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const startTime = Date.now();
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('chat_message_list_scroll', duration, {
        success: true,
        messageCount: messages.length,
        action: 'scroll_to_bottom'
      });
    }
  }, [messages.length]);
  
  // Create intersection observer to detect when unread messages become visible
  const setupIntersectionObserver = useCallback(() => {
    const startTime = Date.now();
    
    // Clean up previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer to detect when messages come into view
    observerRef.current = new IntersectionObserver((entries) => {
      const visibleMessageIds = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target.dataset.messageId)
        .filter(Boolean);
      
      if (visibleMessageIds.length > 0) {
        const markStartTime = Date.now();
        markMessagesAsRead(visibleMessageIds);
        
        const markDuration = Date.now() - markStartTime;
        PerformanceMonitor.trackOperationTiming('chat_message_list_mark_read', markDuration, {
          success: true,
          messageCount: visibleMessageIds.length,
          action: 'mark_read'
        });
      }
    }, {
      root: messageListRef.current,
      threshold: 0.5 // Message is considered viewed when 50% visible
    });
    
    // Observe all unread message elements
    unreadMessagesRef.current.forEach(id => {
      const element = document.querySelector(`[data-message-id="${id}"]`);
      if (element) {
        observerRef.current.observe(element);
      }
    });
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_message_list_observer_setup', duration, {
      success: true,
      unreadCount: unreadMessagesRef.current.length,
      action: 'setup_observer'
    });
  }, [markMessagesAsRead]);
  
  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    const startTime = Date.now();
    scrollToBottom();
    
    // Find all unread messages not from current user
    const unreadMsgs = getUnreadMessages(messages, currentUserId);
    unreadMessagesRef.current = unreadMsgs.map(msg => msg.id);
    
    // Set up observer for new unread messages
    if (unreadMsgs.length > 0) {
      setupIntersectionObserver();
    }
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_message_list_update', duration, {
      success: true,
      messageCount: messages.length,
      unreadCount: unreadMsgs.length,
      action: 'update_messages'
    });
    
    // Cleanup observer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, currentUserId, scrollToBottom, setupIntersectionObserver]);
  
  // Track empty state rendering
  if (messages.length === 0 && !isLoading) {
    PerformanceMonitor.trackOperationTiming('chat_message_list_empty', 0, {
      success: true,
      action: 'render_empty'
    });
    
    return (
      <div className={`chat-empty-state ${className}`}>
        <div className="empty-icon">💬</div>
        <h3 className="empty-title">No messages yet</h3>
        <p className="empty-message">
          Be the first to send a message to nearby users!
        </p>
      </div>
    );
  }
  
  // Track loading state rendering
  if (isLoading) {
    PerformanceMonitor.trackOperationTiming('chat_message_list_loading', 0, {
      success: true,
      action: 'render_loading'
    });
    
    return (
      <div className={`chat-loading-state ${className}`}>
        <div className="loading-spinner"></div>
        <p className="loading-message">Loading messages...</p>
      </div>
    );
  }
  
  // Sort messages by timestamp
  const sortStartTime = Date.now();
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  const sortDuration = Date.now() - sortStartTime;
  PerformanceMonitor.trackOperationTiming('chat_message_list_sort', sortDuration, {
    success: true,
    messageCount: messages.length,
    action: 'sort_messages'
  });
  
  return (
    <div className={`chat-message-list-container ${className}`} ref={messageListRef}>
      <div className="chat-message-list">
        {sortedMessages.map((message, index) => {
          const previousMessage = index > 0 ? sortedMessages[index - 1] : null;
          
          return (
            <div 
              key={message.id || index}
              data-message-id={message.id}
              className="message-item-container"
            >
              <ChatMessageItem
                message={message}
                previousMessage={previousMessage}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} className="message-scroll-end" />
      </div>
    </div>
  );
};

ChatMessageList.propTypes = {
  /** Additional class names */
  className: PropTypes.string,
};

export default ChatMessageList; 