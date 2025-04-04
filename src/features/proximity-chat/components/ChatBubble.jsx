import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { formatRelativeTime } from '../utils/dateUtils';

/**
 * ChatBubble component displays a chat indicator on the map that shows
 * activity at a specific location. It can be expanded to show recent messages
 * and can pulse to indicate new message activity.
 *
 * @param {Object} props Component props
 * @param {Array} props.messages Recent messages at this location
 * @param {number} props.messageCount Total message count
 * @param {Object} props.location Coordinates of this chat bubble
 * @param {boolean} props.isHighActivity Whether there is high chat activity here
 * @param {boolean} props.isActive Whether this bubble is currently selected
 * @param {Function} props.onJoinChat Callback when user wants to join this chat
 * @param {number} props.maxPreviewMessages Maximum number of message previews to show
 */
const ChatBubble = ({
  messages = [],
  messageCount = 0,
  location,
  isHighActivity = false,
  isActive = false,
  onJoinChat,
  maxPreviewMessages = 3,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const recentMessages = messages.slice(0, maxPreviewMessages);

  // Show animation when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setHasNewMessages(true);
      const timer = setTimeout(() => setHasNewMessages(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleJoinClick = e => {
    e.stopPropagation();
    if (onJoinChat) {
      onJoinChat(location);
    }
  };

  return (
    <div
      className={`
        chat-bubble 
        ${isExpanded ? 'expanded' : ''} 
        ${isHighActivity ? 'high-activity' : ''}
        ${isActive ? 'active' : ''}
      `}
      onClick={handleClick}
    >
      {(hasNewMessages || isHighActivity) && <div className="pulse-animation" />}

      <div className="bubble-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        {messageCount > 0 && (
          <div className="message-count">{messageCount > 99 ? '99+' : messageCount}</div>
        )}
      </div>

      {isExpanded && (
        <div className="bubble-content">
          <div className="bubble-header">
            <span>{messageCount} messages</span>
            <span>
              {location && `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
            </span>
          </div>

          {recentMessages.length > 0 ? (
            <div className="message-preview">
              {recentMessages.map((message, index) => (
                <div key={message.id || index} className="preview-message">
                  <span className="preview-username">
                    {message.isAnonymous ? 'Anonymous' : message.sender.username}:
                  </span>
                  {message.text.length > 30 ? `${message.text.substring(0, 30)}...` : message.text}
                  <small> • {formatRelativeTime(message.timestamp)}</small>
                </div>
              ))}

              {messageCount > maxPreviewMessages && (
                <div className="more-messages">
                  {messageCount - maxPreviewMessages} more messages...
                </div>
              )}

              <button className="join-chat-button" onClick={handleJoinClick}>
                Join Chat
              </button>
            </div>
          ) : (
            <div className="message-preview">
              <div className="preview-message">No recent messages</div>
              <button className="join-chat-button" onClick={handleJoinClick}>
                Start Chat Here
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ChatBubble.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      text: PropTypes.string.isRequired,
      sender: PropTypes.shape({
        id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
      }).isRequired,
      timestamp: PropTypes.instanceOf(Date).isRequired,
      isAnonymous: PropTypes.bool,
    })
  ),
  messageCount: PropTypes.number,
  location: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
  }),
  isHighActivity: PropTypes.bool,
  isActive: PropTypes.bool,
  onJoinChat: PropTypes.func,
  maxPreviewMessages: PropTypes.number,
};

export default ChatBubble;
