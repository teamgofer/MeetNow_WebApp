import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import ChatMessageItem from './ChatMessageItem';
import { getUnreadMessages } from '../utils/readReceiptUtils';
import '../styles/proximity-chat.css';

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
  
  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Create intersection observer to detect when unread messages become visible
  const setupIntersectionObserver = useCallback(() => {
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
        markMessagesAsRead(visibleMessageIds);
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
  }, [markMessagesAsRead]);
  
  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    scrollToBottom();
    
    // Find all unread messages not from current user
    const unreadMsgs = getUnreadMessages(messages, currentUserId);
    unreadMessagesRef.current = unreadMsgs.map(msg => msg.id);
    
    // Set up observer for new unread messages
    if (unreadMsgs.length > 0) {
      setupIntersectionObserver();
    }
    
    // Cleanup observer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, currentUserId, scrollToBottom, setupIntersectionObserver]);
  
  // Render empty state if no messages
  if (messages.length === 0 && !isLoading) {
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
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`chat-loading-state ${className}`}>
        <div className="loading-spinner"></div>
        <p className="loading-message">Loading messages...</p>
      </div>
    );
  }
  
  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
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