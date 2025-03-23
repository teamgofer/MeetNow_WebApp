import React from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { formatMessageTime } from '../utils/timeUtils';
import { UI } from '../constants';
import styles from '../styles/ChatMessage.module.css';

/**
 * Component for displaying an individual chat message
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message data object
 * @param {boolean} [props.isHistory=false] - Whether this is a historical message
 * @param {boolean} [props.animate=false] - Whether to animate the message appearance
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const ChatMessage = ({
  message,
  isHistory = false,
  animate = false,
  className = '',
  style = {}
}) => {
  const { currentUserId } = useProximityChatContext();
  
  // Handle missing message data
  if (!message || !message.content) {
    return null;
  }
  
  // Determine if message is from current user
  const isCurrentUser = message.userId === currentUserId;
  
  // Determine message type
  const isSystemMessage = message.type === 'system';
  
  // Format the message time
  const formattedTime = formatMessageTime(message.timestamp);
  
  // Generate CSS classes based on message type
  const messageClasses = [
    styles.chatMessage,
    className,
    isCurrentUser ? styles.self : styles.other,
    isSystemMessage ? styles.system : '',
    isHistory ? styles.history : '',
    animate ? styles.animate : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={messageClasses}
      style={style}
      data-timestamp={message.timestamp}
      data-message-id={message.id}
    >
      {/* Message sender avatar (only show for other users) */}
      {!isCurrentUser && !isSystemMessage && (
        <div className={styles.avatar}>
          {message.user?.avatar ? (
            <img 
              src={message.user.avatar} 
              alt={`${message.user.name}'s avatar`}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarInitial}>
              {message.user?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      )}
      
      <div className={styles.messageContent}>
        {/* Message sender name (only for other users) */}
        {!isCurrentUser && !isSystemMessage && (
          <div className={styles.userName}>
            {message.user?.name || 'Unknown User'}
          </div>
        )}
        
        {/* Message bubble with text content */}
        <div className={styles.messageBubble}>
          {message.content}
        </div>
        
        {/* Message metadata */}
        <div className={styles.messageMetadata}>
          {/* Message timestamp */}
          <span className={styles.messageTime}>
            {formattedTime}
          </span>
          
          {/* Read status (only for current user) */}
          {isCurrentUser && message.isRead && (
            <span className={styles.readStatus}>
              Read
            </span>
          )}
          
          {/* Delivery status (only for current user) */}
          {isCurrentUser && (
            <span className={styles.deliveryStatus}>
              {message.status === 'sending' ? 'Sending...' : 
               message.status === 'sent' ? 'Sent' : 
               message.status === 'delivered' ? 'Delivered' : 
               message.status === 'error' ? 'Error' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 