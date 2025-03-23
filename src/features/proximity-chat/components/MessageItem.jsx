import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import { formatRelativeTime } from '../utils/timeUtils';
import UserBlockControls from './UserBlockControls';

/**
 * Message item component for displaying individual messages
 * in the proximity chat feature with blocked user handling
 */
const MessageItem = ({ 
  message, 
  currentUserId,
  showAvatar = true,
  showTimestamp = true,
  isContinuation = false,
  isRead = false,
  onMessageAction,
}) => {
  const { isUserBlocked } = useBlockedUsers();
  const [showActions, setShowActions] = useState(false);
  
  const isCurrentUser = message.senderId === currentUserId;
  const isBlocked = isUserBlocked(message.senderId);
  
  // Don't render messages from blocked users
  if (isBlocked && !isCurrentUser) {
    return null;
  }
  
  const toggleActions = () => {
    setShowActions(prev => !prev);
  };
  
  const handleAction = (action) => {
    if (onMessageAction) {
      onMessageAction(action, message);
    }
    setShowActions(false);
  };
  
  const handleBlock = () => {
    handleAction('block');
  };
  
  const handleUnblock = () => {
    handleAction('unblock');
  };
  
  return (
    <div 
      className={`
        message-item 
        ${isCurrentUser ? 'message-item--self' : 'message-item--other'} 
        ${isContinuation ? 'message-item--continuation' : ''}
        ${isRead ? 'message-item--read' : ''}
      `}
      id={`message-${message.id}`}
    >
      {showAvatar && !isCurrentUser && !isContinuation && (
        <div className="message-avatar">
          {message.sender.avatarUrl ? (
            <img 
              src={message.sender.avatarUrl} 
              alt={`${message.sender.username}'s avatar`} 
              className="message-avatar-img"
            />
          ) : (
            <div 
              className="message-avatar-placeholder"
              style={{ backgroundColor: message.sender.avatarColor || '#3B82F6' }}
            >
              {message.sender.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div className="message-content">
        {/* Show username for first message in a sequence from another user */}
        {!isCurrentUser && !isContinuation && (
          <div className="message-sender">
            <span className="message-username">
              {message.sender.isAnonymous ? 'Anonymous User' : message.sender.username}
            </span>
          </div>
        )}
        
        <div className="message-bubble">
          <p className="message-text">{message.content}</p>
          
          {showTimestamp && (
            <div className="message-metadata">
              <span className="message-time">
                {formatRelativeTime(message.timestamp)}
              </span>
              {isCurrentUser && isRead && (
                <span className="message-read-status" aria-label="Message read">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {!isCurrentUser && (
        <div className="message-actions">
          <button 
            className="message-actions-toggle"
            onClick={toggleActions}
            aria-label={showActions ? "Close message actions" : "Open message actions"}
            aria-expanded={showActions}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showActions && (
            <div className="message-actions-menu">
              <UserBlockControls 
                userId={message.senderId}
                username={message.sender.username}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
              />
              
              <button 
                className="message-action message-action--report"
                onClick={() => handleAction('report')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Report</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    senderId: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    sender: PropTypes.shape({
      username: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string,
      avatarColor: PropTypes.string,
      isAnonymous: PropTypes.bool
    }).isRequired
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  showAvatar: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  isContinuation: PropTypes.bool,
  isRead: PropTypes.bool,
  onMessageAction: PropTypes.func
};

export default MessageItem; 