import EmojiPicker from 'emoji-picker-react';
import React, { useState, useRef, useEffect } from 'react';

import { UI } from '../constants';
import { useProximityChatContext } from '../context/ProximityChatContext';
import styles from '../styles/ChatMessageInput.module.css';

/**
 * Input component for sending messages in the proximity chat
 *
 * @param {Object} props - Component props
 * @param {string} [props.placeholder] - Custom placeholder text
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const ChatMessageInput = ({ placeholder = UI.MESSAGE_PLACEHOLDER, className = '', style = {} }) => {
  const { sendMessage, setTypingStatus, isConnected, typingUsers, currentRegion } =
    useProximityChatContext();

  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Handle typing status
  useEffect(() => {
    // When message is not empty, indicate typing
    const isTyping = message.trim().length > 0;

    // Debounce to prevent excessive updates
    const typingTimeout = setTimeout(() => {
      setTypingStatus(isTyping);
    }, 500);

    return () => {
      clearTimeout(typingTimeout);
    };
  }, [message, setTypingStatus]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.id !== 'emoji-button'
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format active typing users string
  const formatTypingUsers = () => {
    const typingUsersList = Object.values(typingUsers || {})
      .filter(user => user?.name)
      .map(user => user.name);

    if (typingUsersList.length === 0) {
      return '';
    }

    if (typingUsersList.length === 1) {
      return `${typingUsersList[0]} is typing...`;
    }

    if (typingUsersList.length <= UI.MAX_VISIBLE_TYPING) {
      return `${typingUsersList.join(', ')} are typing...`;
    }

    return `${typingUsersList.length} people are typing...`;
  };

  // Handle sending a message
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !isConnected || !currentRegion) {
      return;
    }

    sendMessage({
      content: trimmedMessage,
      regionId: currentRegion.id,
    });

    // Clear input after sending
    setMessage('');

    // Focus back on the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle key presses (Enter to send)
  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiClick = emojiData => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);

    // Focus back on input after selecting emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`${styles.container} ${className}`} style={style}>
      {/* Typing indicator */}
      <div className={styles.typingIndicator}>{formatTypingUsers()}</div>

      {/* Connection status */}
      {!isConnected && <div className={styles.connectionStatus}>Reconnecting...</div>}

      <div className={styles.inputContainer}>
        {/* Text input */}
        <textarea
          ref={inputRef}
          className={styles.input}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={UI.MAX_MESSAGE_LENGTH}
          disabled={!isConnected}
        />

        {/* Emoji picker button */}
        <button
          id="emoji-button"
          className={styles.emojiButton}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={!isConnected}
          aria-label="Insert emoji"
        >
          <span role="img" aria-label="emoji">
            😊
          </span>
        </button>

        {/* Send button */}
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className={styles.emojiPickerContainer}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder="Search emoji..."
            width="100%"
            height="250px"
          />
        </div>
      )}

      {/* Character counter */}
      <div className={styles.charCounter}>
        {message.length}/{UI.MAX_MESSAGE_LENGTH}
      </div>
    </div>
  );
};

export default ChatMessageInput;
