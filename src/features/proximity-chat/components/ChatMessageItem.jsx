import React from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../utils/dateUtils';
import { formatDistance } from '../utils/locationUtils';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { isOwnMessage } from '../utils/readReceiptUtils';
import ReadReceipt from './ReadReceipt';
import '../styles/proximity-chat.css';

/**
 * Component for rendering a single chat message
 */
const ChatMessageItem = ({ 
  message, 
  previousMessage, 
  showAvatar = true, 
  showUsername = true, 
  showTimestamp = true,
  showDistance = true,
  className = '',
}) => {
  const { currentUserId, userLocation } = useProximityChatContext();
  
  // Skip rendering if message is invalid
  if (!message || !message.content) return null;
  
  // Check if message is from current user
  const isCurrentUser = isOwnMessage(message, currentUserId);
  
  // Check if we should group this with the previous message
  const shouldGroup = previousMessage && 
                     previousMessage.userId === message.userId &&
                     // Messages within 5 minutes of each other should be grouped
                     (new Date(message.timestamp) - new Date(previousMessage.timestamp)) < 5 * 60 * 1000;
  
  // Calculate distance between message and current user if both have locations
  const distance = (message.location && userLocation) ? 
    formatDistance(
      message.location.latitude, 
      message.location.longitude,
      userLocation.latitude,
      userLocation.longitude
    ) : null;

  // For anonymous messages, use a placeholder
  const username = message.metadata?.anonymous ? 'Anonymous User' : message.username || `User ${message.userId.substring(0, 6)}`;
  
  return (
    <div className={`chat-message-item ${isCurrentUser ? 'current-user' : ''} ${className}`}>
      {showAvatar && !shouldGroup && (
        <div className="message-avatar">
          {message.metadata?.anonymous ? (
            <div className="anonymous-avatar">A</div>
          ) : message.avatarUrl ? (
            <img 
              src={message.avatarUrl} 
              alt={username} 
              className="avatar-image"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/default-avatar.png'; }}
            />
          ) : (
            <div className="anonymous-avatar">{username.charAt(0)}</div>
          )}
        </div>
      )}
      
      {!showAvatar && !shouldGroup && <div className="message-avatar-spacer"></div>}
      
      <div className="message-content">
        {showUsername && !shouldGroup && (
          <div className="message-header">
            <span className="message-username">{username}</span>
            {showDistance && distance && (
              <span className="message-distance">{distance}</span>
            )}
          </div>
        )}
        
        <div className="message-bubble">
          <p className="message-text">{message.content}</p>
        </div>
        
        <div className="message-footer">
          {showTimestamp && (
            <span className="message-timestamp">{formatRelativeTime(message.timestamp)}</span>
          )}
          
          {isCurrentUser && (
            <ReadReceipt message={message} size="small" className="message-receipt" />
          )}
        </div>
      </div>
    </div>
  );
};

ChatMessageItem.propTypes = {
  /** Message data object */
  message: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
    }),
    metadata: PropTypes.object,
    receipts: PropTypes.object
  }).isRequired,
  /** Previous message in the chat (for grouping) */
  previousMessage: PropTypes.object,
  /** Whether to show the avatar */
  showAvatar: PropTypes.bool,
  /** Whether to show the username */
  showUsername: PropTypes.bool,
  /** Whether to show the timestamp */
  showTimestamp: PropTypes.bool,
  /** Whether to show the distance */
  showDistance: PropTypes.bool,
  /** Additional class names */
  className: PropTypes.string,
};

export default ChatMessageItem; 