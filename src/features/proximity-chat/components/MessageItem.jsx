import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import { formatMessageTime, isMessageExpired } from '../utils/timeUtils';
import { mapKeyboardActions, getFocusableElements, focusElement } from '../utils/accessibilityUtils';
import { TIMING } from '../constants';
import styles from '../styles/MessageItem.module.css';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import UserBlockControls from './UserBlockControls';

/**
 * Component for displaying a single chat message
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object to display
 * @param {boolean} [props.isHistory=false] - Whether this is a historical message
 * @param {boolean} [props.showSender=true] - Whether to show sender info
 * @param {boolean} [props.isLastInGroup=false] - Whether this is the last message in a group
 * @param {Function} [props.onMessageAction] - Callback for message actions
 * @param {Function} [props.onFocus] - Callback when message receives focus
 * @param {boolean} [props.isFocused=false] - Whether this message is focused
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const MessageItem = React.forwardRef(({
  message,
  isHistory = false,
  showSender = true,
  isLastInGroup = false,
  onMessageAction = null,
  onFocus = null,
  isFocused = false,
  className = '',
  style = {}
}, ref) => {
  const { currentUserId } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messageRef = useRef(null);
  const menuRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());
  
  // Track message rendering performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', renderDuration, {
      success: true,
      messageId: message.id,
      isHistory,
      showSender,
      isLastInGroup,
      action: 'render'
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [message.id, isHistory, showSender, isLastInGroup]);
  
  // Track message expiration
  useEffect(() => {
    if (isMessageExpired(message.timestamp)) {
      const startTime = Date.now();
      PerformanceMonitor.trackOperationTiming('component', 'MessageItem', Date.now() - startTime, {
        success: true,
        messageId: message.id,
        action: 'expire',
        timestamp: message.timestamp
      });
    }
  }, [message.id, message.timestamp]);
  
  // Handle message hover
  const handleMouseEnter = () => {
    const startTime = Date.now();
    setIsHovered(true);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'hover',
      state: 'enter'
    });
  };
  
  const handleMouseLeave = () => {
    const startTime = Date.now();
    setIsHovered(false);
    setIsMenuOpen(false);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'hover',
      state: 'leave'
    });
  };
  
  // Handle message expansion
  const handleExpand = () => {
    const startTime = Date.now();
    setIsExpanded(!isExpanded);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'expand',
      expanded: !isExpanded
    });
  };
  
  // Handle message menu
  const handleMenuToggle = () => {
    const startTime = Date.now();
    setIsMenuOpen(!isMenuOpen);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'menu',
      state: !isMenuOpen ? 'open' : 'close'
    });
  };
  
  // Handle message actions
  const handleAction = (action) => {
    const startTime = Date.now();
    setIsMenuOpen(false);
    onMessageAction?.(action);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'messageAction',
      type: action
    });
  };
  
  // Handle focus
  const handleFocus = () => {
    const startTime = Date.now();
    onFocus?.();
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
      success: true,
      messageId: message.id,
      action: 'focus'
    });
  };
  
  // Handle keyboard navigation
  const handleKeyboardNavigation = mapKeyboardActions({
    enter: () => handleExpand(),
    space: () => handleExpand(),
    escape: () => setIsMenuOpen(false),
    tab: () => {
      const focusableElements = getFocusableElements(messageRef.current);
      const currentIndex = focusableElements.indexOf(document.activeElement);
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusElement(focusableElements[nextIndex]);
    }
  });
  
  // Set up keyboard listeners
  useEffect(() => {
    const messageElement = messageRef.current;
    if (messageElement) {
      messageElement.addEventListener('keydown', handleKeyboardNavigation);
      return () => {
        messageElement.removeEventListener('keydown', handleKeyboardNavigation);
      };
    }
  }, [handleKeyboardNavigation]);
  
  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        const startTime = Date.now();
        setIsMenuOpen(false);
        
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('component', 'MessageItem', duration, {
          success: true,
          messageId: message.id,
          action: 'clickOutside',
          target: event.target.tagName
        });
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [message.id]);
  
  // Skip rendering if message is expired
  if (isMessageExpired(message.timestamp)) {
    return null;
  }
  
  // Skip rendering if sender is blocked
  if (message.senderId !== currentUserId && isUserBlocked(message.senderId)) {
    return null;
  }
  
  const isOwnMessage = message.senderId === currentUserId;
  const messageClasses = [
    styles.message,
    isOwnMessage ? styles.ownMessage : styles.otherMessage,
    isHovered ? styles.hovered : '',
    isFocused ? styles.focused : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={messageRef}
      className={messageClasses}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      tabIndex={0}
      role="article"
      aria-label={`Message from ${message.sender.username}`}
      aria-expanded={isExpanded}
      aria-controls={`message-${message.id}-content`}
    >
      {/* Message header */}
      {showSender && (
        <div className={styles.messageHeader}>
          <div className={styles.senderInfo}>
            <span className={styles.senderName}>{message.sender.username}</span>
            <span className={styles.messageTime}>
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
          
          {/* Message actions menu */}
          {isHovered && (
            <div className={styles.messageActions}>
              <button
                className={styles.menuButton}
                onClick={handleMenuToggle}
                aria-label="Message actions"
                aria-expanded={isMenuOpen}
                aria-controls={`message-${message.id}-menu`}
              >
                <span className={styles.menuIcon}>⋮</span>
              </button>
              
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className={styles.menu}
                  id={`message-${message.id}-menu`}
                  role="menu"
                  aria-label="Message actions"
                >
                  <button
                    className={styles.menuItem}
                    onClick={() => handleAction('copy')}
                    role="menuitem"
                  >
                    Copy
                  </button>
                  {isOwnMessage && (
                    <button
                      className={styles.menuItem}
                      onClick={() => handleAction('delete')}
                      role="menuitem"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    className={styles.menuItem}
                    onClick={() => handleAction('report')}
                    role="menuitem"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Message content */}
      <div
        id={`message-${message.id}-content`}
        className={`${styles.messageContent} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleExpand}
      >
        <p className={styles.messageText}>{message.content}</p>
        {!isExpanded && message.content.length > 100 && (
          <button
            className={styles.expandButton}
            onClick={handleExpand}
            aria-label="Expand message"
          >
            Show more
          </button>
        )}
      </div>
      
      {/* Message footer */}
      {isLastInGroup && (
        <div className={styles.messageFooter}>
          <span className={styles.messageStatus}>
            {message.isRead ? 'Read' : 'Sent'}
          </span>
        </div>
      )}
    </div>
  );
});

MessageItem.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    senderId: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      username: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string,
      avatarColor: PropTypes.string,
      isAnonymous: PropTypes.bool
    }).isRequired,
    isRead: PropTypes.bool
  }).isRequired,
  isHistory: PropTypes.bool,
  showSender: PropTypes.bool,
  isLastInGroup: PropTypes.bool,
  onMessageAction: PropTypes.func,
  onFocus: PropTypes.func,
  isFocused: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
};

export default MessageItem; 