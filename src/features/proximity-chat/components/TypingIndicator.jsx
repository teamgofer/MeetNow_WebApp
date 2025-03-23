import React from 'react';
import useTypingIndicator from '../hooks/useTypingIndicator';

/**
 * Component that displays when users are typing in the chat
 * 
 * Features:
 * - Shows animated typing dots
 * - Displays names of typing users (up to a limit)
 * - Shows count when many users are typing
 * 
 * @param {Object} props
 * @param {Array} props.typingUsers - Array of users who are typing (optional)
 * @param {number} props.maxUsersToShow - Maximum number of usernames to display
 * @param {string} props.position - Position of the indicator (top, bottom)
 */
const TypingIndicator = ({ 
  typingUsers: externalTypingUsers,
  maxUsersToShow = 2,
  position = 'bottom'
}) => {
  // If external typing users are provided, use those, otherwise use from hook
  const { typingUsers: hookTypingUsers } = useTypingIndicator();
  const typingUsers = externalTypingUsers || hookTypingUsers;
  
  // Don't render if no one is typing
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }
  
  // Count of typing users
  const typingCount = typingUsers.length;
  
  // Generate message text based on who is typing
  const getTypingMessage = () => {
    if (typingCount === 0) return '';
    
    if (typingCount === 1) {
      const user = typingUsers[0];
      return `${user.isAnonymous ? 'Someone' : user.username} is typing`;
    }
    
    if (typingCount <= maxUsersToShow) {
      const names = typingUsers.map(user => 
        user.isAnonymous ? 'Someone' : user.username
      );
      const lastUser = names.pop();
      return `${names.join(', ')} and ${lastUser} are typing`;
    }
    
    return `${typingCount} people are typing`;
  };
  
  return (
    <div className={`typing-indicator ${position}`}>
      <div className="typing-animation">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">{getTypingMessage()}</span>
    </div>
  );
};

export default TypingIndicator; 