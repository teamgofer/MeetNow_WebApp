import PropTypes from 'prop-types';
import React, { useRef, useEffect, useState } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import { TIMING } from '../constants';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import { useProximityChatContext } from '../context/ProximityChatContext';
import styles from '../styles/MessageList.module.css';
import {
  mapKeyboardActions,
  getFocusableElements,
  focusElement,
} from '../utils/accessibilityUtils';
import { isMessageExpired, groupMessagesByDate, formatMessageDate } from '../utils/timeUtils';

import MessageItem from './MessageItem';

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
  style = {},
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
  const renderStartTimeRef = useRef(Date.now());

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('message_list_init', duration, {
      success: true,
      messageCount: messages.length,
      isHistory,
      hasMore,
      hasCurrentUserId: !!currentUserId,
    });
  }, [messages.length, isHistory, hasMore, currentUserId]);

  // Store refs for each message to enable keyboard navigation
  useEffect(() => {
    const startTime = Date.now();
    messageRefs.current = messageRefs.current.slice(0, messages.length);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_list_refs_update', duration, {
      success: true,
      messageCount: messages.length,
      isHistory,
      hasMore,
      action: 'update_refs',
    });
  }, [messages.length, isHistory, hasMore]);

  // Group messages by date for display
  useEffect(() => {
    const startTime = Date.now();
    const messagesByDate = groupMessagesByDate(messages);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_list_group_by_date', duration, {
      success: true,
      messageCount: messages.length,
      dateGroups: Object.keys(messagesByDate).length,
      isHistory,
      action: 'group_by_date',
    });
  }, [messages.length, isHistory]);

  // Auto-scroll to bottom on new messages (if not in history mode)
  useEffect(() => {
    if (!isHistory && containerRef.current && messages.length > 0) {
      const startTime = Date.now();
      const container = containerRef.current;
      const { scrollHeight, clientHeight, scrollTop } = container;
      const isScrolledNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      // Only auto-scroll if user was already near the bottom
      if (isScrolledNearBottom) {
        container.scrollTop = scrollHeight;

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('message_list_auto_scroll', duration, {
          success: true,
          messageCount: messages.length,
          isHistory,
          action: 'auto_scroll',
          scrollHeight,
          clientHeight,
          scrollTop,
          isScrolledNearBottom,
        });
      }
    }
  }, [messages.length, isHistory]);

  // Handler for scrolling to load more messages
  const handleScroll = e => {
    if (isHistory && hasMore && onLoadMore && !isLoadingMore) {
      const startTime = Date.now();
      const { scrollTop } = e.target;

      // When user scrolls near the top, load more messages
      if (scrollTop < 50) {
        setIsLoadingMore(true);

        // Store current scroll position for restoration
        lastScrollHeightRef.current = e.target.scrollHeight;
        lastScrollTopRef.current = scrollTop;

        // Call the load more callback
        onLoadMore(messages);

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('message_list_load_more', duration, {
          success: true,
          messageCount: messages.length,
          isHistory,
          action: 'load_more',
          scrollTop,
          isLoadingMore: true,
        });

        // Reset loading state after a delay
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1000);
      }
    }
  };

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (isHistory && containerRef.current && lastScrollHeightRef.current > 0) {
      const startTime = Date.now();
      const container = containerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - lastScrollHeightRef.current;

      if (heightDifference > 0) {
        container.scrollTop = lastScrollTopRef.current + heightDifference;
        lastScrollHeightRef.current = newScrollHeight;

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('message_list_restore_scroll', duration, {
          success: true,
          messageCount: messages.length,
          isHistory,
          action: 'restore_scroll',
          heightDifference,
          newScrollHeight,
        });
      }
    }
  }, [messages.length, isHistory]);

  // Filter expired messages and messages from blocked users
  const filteredMessages = messages.filter(message => {
    const startTime = Date.now();

    // Skip expired messages
    if (isMessageExpired(message.timestamp)) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_filter', duration, {
        success: true,
        messageId: message.id,
        action: 'filter',
        reason: 'expired',
      });
      return false;
    }

    // Show messages from the current user
    if (message.senderId === currentUserId) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_filter', duration, {
        success: true,
        messageId: message.id,
        action: 'filter',
        reason: 'current_user',
      });
      return true;
    }

    // Skip messages from blocked users
    if (isUserBlocked(message.senderId)) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_filter', duration, {
        success: true,
        messageId: message.id,
        action: 'filter',
        reason: 'blocked',
      });
      return false;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_list_filter', duration, {
      success: true,
      messageId: message.id,
      action: 'filter',
      reason: 'included',
    });
    return true;
  });

  // Track message filtering performance
  useEffect(() => {
    const startTime = Date.now();
    const filteredCount = filteredMessages.length;
    const duration = Date.now() - startTime;

    PerformanceMonitor.trackOperationTiming('message_list_filter_summary', duration, {
      success: true,
      totalMessages: messages.length,
      filteredMessages: filteredCount,
      isHistory,
      action: 'filter_summary',
    });
  }, [messages.length, filteredMessages.length, isHistory]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      const startTime = Date.now();
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_scroll_to_bottom', duration, {
        success: true,
        messageCount: messages.length,
        isHistory,
        action: 'scroll_to_bottom',
      });
    }
  }, [filteredMessages, isHistory]);

  // Group messages by sender for continuations
  useEffect(() => {
    const startTime = Date.now();
    const groupedMessages = filteredMessages.reduce((groups, message) => {
      const key = message.senderId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(message);
      return groups;
    }, {});

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_list_group_by_sender', duration, {
      success: true,
      messageCount: messages.length,
      senderGroups: Object.keys(groupedMessages).length,
      isHistory,
      action: 'group_by_sender',
    });
  }, [filteredMessages.length, isHistory]);

  // Handle keyboard navigation
  const handleMessageKeyboardNavigation = mapKeyboardActions({
    up: () => {
      const startTime = Date.now();
      const newIndex = Math.max(0, focusedIndex - 1);
      setFocusedIndex(newIndex);
      focusElement(messageRefs.current[newIndex]);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_nav', duration, {
        success: true,
        action: 'keyboard_nav',
        direction: 'up',
        newIndex,
      });
    },
    down: () => {
      const startTime = Date.now();
      const newIndex = Math.min(Object.keys(groupedMessages).length - 1, focusedIndex + 1);
      setFocusedIndex(newIndex);
      focusElement(messageRefs.current[newIndex]);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_nav', duration, {
        success: true,
        action: 'keyboard_nav',
        direction: 'down',
        newIndex,
      });
    },
    first: () => {
      const startTime = Date.now();
      setFocusedIndex(0);
      focusElement(messageRefs.current[0]);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_nav', duration, {
        success: true,
        action: 'keyboard_nav',
        direction: 'first',
      });
    },
    last: () => {
      const startTime = Date.now();
      const lastIndex = Object.keys(groupedMessages).length - 1;
      setFocusedIndex(lastIndex);
      focusElement(messageRefs.current[lastIndex]);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_nav', duration, {
        success: true,
        action: 'keyboard_nav',
        direction: 'last',
      });
    },
    escape: () => {
      const startTime = Date.now();
      setFocusedIndex(-1);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_nav', duration, {
        success: true,
        action: 'keyboard_nav',
        direction: 'escape',
      });
    },
  });

  // Set up keyboard listeners for the message list
  useEffect(() => {
    const startTime = Date.now();
    const listElement = containerRef.current;
    if (listElement) {
      listElement.addEventListener('keydown', handleMessageKeyboardNavigation);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_keyboard_setup', duration, {
        success: true,
        action: 'keyboard_setup',
      });

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
      role="log"
      aria-live={isHistory ? 'off' : 'polite'}
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
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateHeader}>
            <span>{formatMessageDate(new Date(date))}</span>
          </div>

          {Object.entries(groupedMessages).map(([senderId, senderMessages]) => (
            <div key={senderId} className={styles.messageGroup}>
              {senderMessages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  ref={el => (messageRefs.current[index] = el)}
                  message={message}
                  isHistory={isHistory}
                  showSender={index === 0}
                  isLastInGroup={index === senderMessages.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      senderId: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ),
  isHistory: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default MessageList;
