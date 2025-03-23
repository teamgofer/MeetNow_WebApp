import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import MessageItem from './MessageItem';
import { mapKeyboardActions, getFocusableElements, focusElement } from '../utils/accessibilityUtils';
import { isMessageExpired, groupMessagesByDate, formatMessageDate } from '../utils/timeUtils';
import { TIMING } from '../constants';
import styles from '../styles/MessageList.module.css';

/**
 * Component for displaying a list of chat messages
 * 
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects to display
 * @param {boolean} [props.isHistory=false] - Whether these are historical messages
 * @param {boolean} [props.hasMore=false] - Whether more messages can be loaded
 * @param {Function} [props.onLoadMore] - Callback when user scrolls to load more
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const MessageList = ({
  messages = [],
  isHistory = false,
  hasMore = false,
  onLoadMore = null,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const { currentUserId } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const messageRefs = useRef([]);
  const messagesEndRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastScrollHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  
  // Store refs for each message to enable keyboard navigation
  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages.length]);
  
  // Group messages by date for display
  const messagesByDate = groupMessagesByDate(messages);
  
  // Auto-scroll to bottom on new messages (if not in history mode)
  useEffect(() => {
    if (
      !isHistory && 
      containerRef.current && 
      messages.length > 0
    ) {
      const container = containerRef.current;
      const { scrollHeight, clientHeight, scrollTop } = container;
      const isScrolledNearBottom = 
        scrollTop + clientHeight >= scrollHeight - 100;
      
      // Only auto-scroll if user was already near the bottom
      if (isScrolledNearBottom) {
        container.scrollTop = scrollHeight;
      }
    }
  }, [messages.length, isHistory]);
  
  // Handler for scrolling to load more messages
  const handleScroll = (e) => {
    if (isHistory && hasMore && onLoadMore && !isLoadingMore) {
      const { scrollTop } = e.target;
      
      // When user scrolls near the top, load more messages
      if (scrollTop < 50) {
        setIsLoadingMore(true);
        
        // Store current scroll position for restoration
        lastScrollHeightRef.current = e.target.scrollHeight;
        lastScrollTopRef.current = scrollTop;
        
        // Call the load more callback
        onLoadMore(messages);
        
        // Reset loading state after a delay
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1000);
      }
    }
  };
  
  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (
      isHistory && 
      containerRef.current && 
      lastScrollHeightRef.current > 0
    ) {
      const container = containerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - lastScrollHeightRef.current;
      
      if (heightDifference > 0) {
        container.scrollTop = lastScrollTopRef.current + heightDifference;
        lastScrollHeightRef.current = newScrollHeight;
      }
    }
  }, [messages.length, isHistory]);
  
  // Filter expired messages and messages from blocked users
  const filteredMessages = messages.filter(message => {
    // Skip expired messages
    if (isMessageExpired(message.timestamp)) {
      return false;
    }
    
    // Show messages from the current user
    if (message.senderId === currentUserId) {
      return true;
    }
    
    // Skip messages from blocked users
    if (isUserBlocked(message.senderId)) {
      return false;
    }
    
    return true;
  });
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages]);
  
  // Group messages by sender for continuations
  const messageGroups = filteredMessages.reduce((groups, message, index) => {
    const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
    
    // Check if this is a continuation from the same sender
    const isContinuation = prevMessage 
      && prevMessage.senderId === message.senderId
      && (new Date(message.timestamp) - new Date(prevMessage.timestamp)) < 60000; // 1 minute
    
    return [
      ...groups,
      {
        ...message,
        isContinuation
      }
    ];
  }, []);
  
  // Handle keyboard navigation
  const handleMessageKeyboardNavigation = mapKeyboardActions({
    up: () => {
      const newIndex = Math.max(0, focusedIndex - 1);
      setFocusedIndex(newIndex);
      focusElement(messageRefs.current[newIndex]);
    },
    down: () => {
      const newIndex = Math.min(messageGroups.length - 1, focusedIndex + 1);
      setFocusedIndex(newIndex);
      focusElement(messageRefs.current[newIndex]);
    },
    first: () => {
      setFocusedIndex(0);
      focusElement(messageRefs.current[0]);
    },
    last: () => {
      const lastIndex = messageGroups.length - 1;
      setFocusedIndex(lastIndex);
      focusElement(messageRefs.current[lastIndex]);
    },
    escape: () => {
      setFocusedIndex(-1);
    }
  });
  
  // Set up keyboard listeners for the message list
  useEffect(() => {
    const listElement = containerRef.current;
    if (listElement) {
      listElement.addEventListener('keydown', handleMessageKeyboardNavigation);
      return () => {
        listElement.removeEventListener('keydown', handleMessageKeyboardNavigation);
      };
    }
  }, [handleMessageKeyboardNavigation]);
  
  return (
    <div
      ref={containerRef}
      className={`${styles.messageList} ${className}`}
      style={style}
      onScroll={handleScroll}
    >
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className={styles.loadingMoreIndicator}>
          <div className={styles.spinner} />
          <span>Loading more messages...</span>
        </div>
      )}
      
      {/* No more messages indicator */}
      {isHistory && !hasMore && messages.length > 0 && (
        <div className={styles.noMoreMessages}>
          <span>No more messages</span>
        </div>
      )}
      
      {/* Empty state */}
      {messages.length === 0 && !isLoadingMore && (
        <div className={styles.emptyState}>
          <span>{isHistory ? 'No message history' : 'No messages yet'}</span>
        </div>
      )}
      
      {/* Messages grouped by date */}
      {Object.entries(messagesByDate).map(([dateString, messagesForDate]) => (
        <div key={dateString} className={styles.dateGroup}>
          <div className={styles.dateHeader}>
            <span>{formatMessageDate(dateString)}</span>
          </div>
          
          <div className={styles.messagesForDate}>
            {messagesForDate.map((message) => (
              <MessageItem
                key={message.id || message.tempId || message.timestamp}
                message={message}
                currentUserId={currentUserId}
                showAvatar={true}
                showTimestamp={true}
                isContinuation={false}
                isRead={false}
                onMessageAction={() => {}}
                onFocus={() => setFocusedIndex(messageGroups.indexOf(message))}
                isFocused={focusedIndex === messageGroups.indexOf(message)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      senderId: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
      sender: PropTypes.shape({
        username: PropTypes.string.isRequired,
        avatarUrl: PropTypes.string,
        avatarColor: PropTypes.string,
        isAnonymous: PropTypes.bool
      }).isRequired,
      isRead: PropTypes.bool
    })
  ),
  isHistory: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object
};

export default MessageList; 