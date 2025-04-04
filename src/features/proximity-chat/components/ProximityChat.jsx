import React, { useEffect, useState, useRef } from 'react';

import { useAuth } from '../../../context/AuthContext';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import ErrorMessage from '../../common/ErrorMessage';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useProximityChatContext } from '../context/ProximityChatContext';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ChatSettings from './ChatSettings';
import NearbyUsers from './NearbyUsers';
import styles from './ProximityChat.module.css';

/**
 * Main container component for the proximity chat feature
 */
const ProximityChat = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();
  const {
    isConnected,
    messages,
    nearbyUsers,
    error,
    isLoading,
    initialize,
    sendMessage,
    setTypingStatus,
    updateRadius,
    cleanup,
  } = useProximityChatContext();
  const { isMobile } = useBreakpoint();
  const messagesEndRef = useRef(null);

  // Initialize proximity chat on component mount
  useEffect(() => {
    if (user?.id) {
      initialize({
        sessionId: user.id,
        radius: 100, // Default radius in meters
      });
    }

    // Clean up on unmount
    return () => {
      cleanup();
    };
  }, [user, initialize, cleanup]);

  // Handle message submission
  const handleSendMessage = content => {
    if (content.trim()) {
      sendMessage(content);
    }
  };

  // Handle typing status change
  const handleTypingChange = isTyping => {
    setTypingStatus(isTyping);
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // Handle radius change from settings
  const handleRadiusChange = radius => {
    updateRadius(radius);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // If still loading, show spinner
  if (isLoading) {
    return <LoadingSpinner message="Connecting to nearby chat..." />;
  }

  // If there's an error, show error message
  if (error) {
    return <ErrorMessage message={error} retryAction={() => initialize()} />;
  }

  return (
    <div className={`${styles.chatContainer} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>No messages yet. Start a conversation!</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={styles.message}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>{msg.sender}</span>
                <span className={styles.messageTime}>{msg.time}</span>
              </div>
              <div className={styles.messageContent}>{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.messageInputContainer}>
        <textarea
          className={styles.messageInput}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ProximityChat;
