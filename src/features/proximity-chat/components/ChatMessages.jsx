import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

const ChatMessages = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'just now';
    }
  };
  
  // Group messages by sender for better UI display
  const groupedMessages = messages.reduce((groups, message) => {
    const lastGroup = groups[groups.length - 1];
    
    // Check if we should add to the last group or create a new one
    if (
      lastGroup && 
      lastGroup.sessionId === message.sessionId &&
      // Group messages that are less than 2 minutes apart
      Math.abs(new Date(lastGroup.messages[lastGroup.messages.length - 1].timestamp) - 
               new Date(message.timestamp)) < 120000
    ) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        sessionId: message.sessionId,
        messages: [message]
      });
    }
    
    return groups;
  }, []);
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        <p>No messages yet. Be the first to say hello!</p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => {
        const isCurrentUser = group.sessionId === currentUserId;
        
        return (
          <div 
            key={`group-${groupIndex}`}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3/4 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'} rounded-lg p-1`}>
              {!isCurrentUser && (
                <div className="px-3 pt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {group.sessionId.slice(0, 8)}
                </div>
              )}
              
              <div className="space-y-1 p-2">
                {group.messages.map((message) => (
                  <div key={message.id} className="break-words">
                    <p>{message.content}</p>
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      content: PropTypes.string.isRequired,
      sessionId: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired
    })
  ).isRequired,
  currentUserId: PropTypes.string
};

ChatMessages.defaultProps = {
  messages: [],
  currentUserId: ''
};

export default ChatMessages; 