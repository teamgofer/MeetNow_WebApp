import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import useProximityChatSettings from '../hooks/useProximityChatSettings';
import useTypingIndicator from '../hooks/useTypingIndicator';
import { createLiveRegionProps, createDescribedByProps, generateAccessibleId } from '../utils/accessibilityUtils';

/**
 * ChatInput component allows users to type and send messages in the proximity chat.
 * It includes features like auto-expanding text area, typing indicators, and
 * anonymous mode indicator.
 * 
 * @param {Object} props Component props
 * @param {Function} props.onSendMessage Callback when a message is sent
 * @param {boolean} props.disabled Whether the input is disabled
 * @param {string} props.placeholderText Custom placeholder text
 * @param {boolean} props.showAnonymousIndicator Whether to show anonymous mode indicator
 */
const ChatInput = ({
  onSendMessage,
  disabled = false,
  placeholderText = 'Type a message...',
  showAnonymousIndicator = true
}) => {
  const { chatSettings, updateTypingStatus } = useProximityChatContext();
  const { handleTypingChange, handleSubmit, typingUsers } = useTypingIndicator();
  const { anonymousMode } = useProximityChatSettings();
  
  const [message, setMessage] = useState('');
  const textAreaRef = useRef(null);
  const inputDisabled = disabled || !chatSettings.isConnected;
  const charCountId = useRef(generateAccessibleId('char-count')).current;
  const inputStatusId = useRef(generateAccessibleId('input-status')).current;
  
  // Handle textarea auto-height
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = '20px'; // Reset height
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [message]);

  // Debounce typing status updates
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (message.trim().length > 0) {
        updateTypingStatus(true);
      } else {
        updateTypingStatus(false);
      }
    }, 300);
    
    return () => clearTimeout(timerId);
  }, [message, updateTypingStatus]);

  // Reset typing status when component unmounts
  useEffect(() => {
    return () => {
      updateTypingStatus(false);
    };
  }, [updateTypingStatus]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= 500) {
      setMessage(newValue);
    }
    handleTypingChange(e);
  };

  const handleKeyDown = (e) => {
    // Send message on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !inputDisabled) {
      try {
        await onSendMessage(trimmedMessage);
        setMessage('');
        handleSubmit();
        
        // Reset textarea height
        if (textAreaRef.current) {
          textAreaRef.current.style.height = '20px';
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Update status for screen readers
        const statusElement = document.getElementById(inputStatusId);
        if (statusElement) {
          statusElement.textContent = 'Failed to send message. Please try again.';
        }
      } finally {
        // Focus back on input after sending
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }
    }
  };
  
  // Display typing indicator text
  const renderTypingIndicator = () => {
    if (!typingUsers || typingUsers.length === 0) return null;
    
    const count = typingUsers.length;
    let text = '';
    
    if (count === 1) {
      text = `${typingUsers[0].username || 'Someone'} is typing...`;
    } else if (count === 2) {
      text = `${typingUsers[0].username || 'Someone'} and ${typingUsers[1].username || 'someone'} are typing...`;
    } else {
      text = `${count} people are typing...`;
    }
    
    return (
      <div className="typing-indicator">
        <span className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </span>
        <span className="typing-text">{text}</span>
      </div>
    );
  };
  
  const charactersRemaining = 500 - message.length;
  const isNearLimit = charactersRemaining <= 20;
  const isAtLimit = charactersRemaining === 0;
  
  const characterCountText = `${charactersRemaining} characters remaining`;
  
  // Generate accessibility props
  const statusProps = createLiveRegionProps(true, 'polite');
  
  return (
    <div className="chat-input-container">
      <div className="chat-input-form">
        {typingUsers && typingUsers.length > 0 && renderTypingIndicator()}
        
        <div className="input-container">
          {showAnonymousIndicator && anonymousMode && (
            <div className="anonymous-badge" title="Anonymous Mode">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                <line x1="19" y1="8" x2="23" y2="12"></line>
                <line x1="23" y1="8" x2="19" y2="12"></line>
              </svg>
            </div>
          )}
          
          <textarea
            ref={textAreaRef}
            className="message-input"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={inputDisabled ? 'Chat unavailable...' : placeholderText}
            disabled={inputDisabled}
            rows="1"
            aria-label="Type a message"
            aria-multiline="true"
            aria-describedby={`${charCountId} ${inputStatusId}`}
            aria-required="true"
          />
          
          <button
            className={`send-button ${!message.trim() || inputDisabled ? 'disabled' : ''}`}
            onClick={handleSendMessage}
            disabled={!message.trim() || inputDisabled}
            aria-label="Send message"
            aria-disabled={!message.trim() || inputDisabled}
          >
            <span className="sr-only">Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        
        {chatSettings.isConnected === false && (
          <div className="connection-status error">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Not connected. Trying to reconnect...</span>
          </div>
        )}
      </div>
      
      <div className="input-feedback-container">
        <div 
          id={charCountId}
          className={`character-counter ${isNearLimit ? 'near-limit' : ''} ${isAtLimit ? 'at-limit' : ''}`}
          aria-live={isNearLimit ? 'polite' : 'off'}
        >
          {characterCountText}
        </div>
        
        <div 
          id={inputStatusId}
          className="input-status sr-only"
          {...statusProps}
        >
          {inputDisabled ? 'Chat unavailable...' : ''}
        </div>
      </div>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholderText: PropTypes.string,
  showAnonymousIndicator: PropTypes.bool
};

export default ChatInput; 