import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';

import PerformanceMonitor from '../../../utils/PerformanceMonitor';
import { DEFAULTS, TIMING } from '../constants';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import { useProximityChatContext } from '../context/ProximityChatContext';
import useProximityChatSettings from '../hooks/useProximityChatSettings';
import useTypingIndicator from '../hooks/useTypingIndicator';
import styles from '../styles/ChatInput.module.css';
import {
  createLiveRegionProps,
  createDescribedByProps,
  generateAccessibleId,
  mapKeyboardActions,
  getFocusableElements,
  focusElement,
} from '../utils/accessibilityUtils';

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
  showAnonymousIndicator = true,
  className = '',
}) => {
  const { chatSettings, updateTypingStatus } = useProximityChatContext();
  const { handleTypingChange, handleSubmit, typingUsers } = useTypingIndicator();
  const { anonymousMode } = useProximityChatSettings();
  const { currentUserId } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();

  const [message, setMessage] = useState('');
  const textAreaRef = useRef(null);
  const inputDisabled = disabled || !chatSettings.isConnected;
  const charCountId = useRef(generateAccessibleId('char-count')).current;
  const inputStatusId = useRef(generateAccessibleId('input-status')).current;
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());
  const [characterCount, setCharacterCount] = useState(0);
  const [isNearLimit, setIsNearLimit] = useState(false);
  const [isAtLimit, setIsAtLimit] = useState(false);

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('chat_input_init', duration, {
      success: true,
      isConnected: chatSettings.isConnected,
      hasCurrentUserId: !!currentUserId,
      isAnonymousMode: anonymousMode,
      isDisabled: disabled,
      hasTypingUsers: !!typingUsers?.length,
      hasBlockedUsers: !!isUserBlocked,
    });
  }, [
    chatSettings.isConnected,
    currentUserId,
    anonymousMode,
    disabled,
    typingUsers,
    isUserBlocked,
  ]);

  // Track component rendering performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('chat_input_render', renderDuration, {
      success: true,
      disabled,
      isTyping,
      messageLength: message.length,
      characterCount,
      isNearLimit,
      isAtLimit,
      hasTypingUsers: !!typingUsers?.length,
      isAnonymousMode,
    });

    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [
    disabled,
    isTyping,
    message.length,
    characterCount,
    isNearLimit,
    isAtLimit,
    typingUsers,
    anonymousMode,
  ]);

  // Handle textarea auto-height with performance tracking
  useEffect(() => {
    if (textAreaRef.current) {
      const startTime = Date.now();
      textAreaRef.current.style.height = '20px'; // Reset height
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('chat_input_resize', duration, {
        success: true,
        scrollHeight,
        finalHeight: Math.min(scrollHeight, 120),
      });
    }
  }, [message]);

  // Debounce typing status updates with performance tracking
  useEffect(() => {
    const startTime = Date.now();
    const timerId = setTimeout(() => {
      const hasContent = message.trim().length > 0;
      updateTypingStatus(hasContent);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('chat_input_typing_status', duration, {
        success: true,
        hasContent,
        messageLength: message.length,
      });
    }, 300);

    return () => clearTimeout(timerId);
  }, [message, updateTypingStatus]);

  // Reset typing status when component unmounts
  useEffect(() => {
    return () => {
      const startTime = Date.now();
      updateTypingStatus(false);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('chat_input_cleanup', duration, {
        success: true,
        action: 'reset_typing_status',
      });
    };
  }, [updateTypingStatus]);

  // Handle typing status changes with performance tracking
  useEffect(() => {
    const startTime = Date.now();

    // Clear the previous timeout if exists
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If currently typing, set timeout to clear typing status after delay
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        updateTypingStatus(false);
      }, 3000); // Stop typing indicator after 3 seconds of inactivity
    }

    // Notify parent component about typing status change
    updateTypingStatus(isTyping);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_input_typing_change', duration, {
      success: true,
      isTyping,
      hasTimeout: !!typingTimeoutRef.current,
    });

    // Clean up timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, updateTypingStatus]);

  // Focus input on mount with performance tracking
  useEffect(() => {
    if (inputRef.current && !disabled) {
      const startTime = Date.now();
      inputRef.current.focus();
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('chat_input_focus', duration, {
        success: true,
        isDisabled: disabled,
      });
    }
  }, [disabled]);

  // Handle input changes with performance tracking
  const handleInputChange = e => {
    const startTime = Date.now();
    const newValue = e.target.value;
    setMessage(newValue);

    const newCount = newValue.length;
    setCharacterCount(newCount);

    const nearLimit = newCount >= DEFAULTS.MAX_MESSAGE_LENGTH * 0.8;
    const atLimit = newCount >= DEFAULTS.MAX_MESSAGE_LENGTH;

    setIsNearLimit(nearLimit);
    setIsAtLimit(atLimit);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_input_change', duration, {
      success: true,
      newLength: newCount,
      isNearLimit: nearLimit,
      isAtLimit: atLimit,
      hasContent: newValue.trim().length > 0,
    });
  };

  // Handle message sending with performance tracking
  const handleSendMessage = async e => {
    e.preventDefault();
    if (!message.trim() || isAtLimit) return;

    const startTime = Date.now();
    const trimmedMessage = message.trim();
    setMessage('');
    setCharacterCount(0);
    setIsNearLimit(false);
    setIsAtLimit(false);

    if (onSendMessage) {
      try {
        await onSendMessage(trimmedMessage);
        handleSubmit();

        // Reset textarea height
        if (textAreaRef.current) {
          textAreaRef.current.style.height = '20px';
        }

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('chat_input_send', duration, {
          success: true,
          messageLength: trimmedMessage.length,
          isAnonymousMode: anonymousMode,
          hasCurrentUserId: !!currentUserId,
          hasTypingUsers: !!typingUsers?.length,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        // Update status for screen readers
        const statusElement = document.getElementById(inputStatusId);
        if (statusElement) {
          statusElement.textContent = 'Failed to send message. Please try again.';
        }

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('chat_input_send_error', duration, {
          success: false,
          messageLength: trimmedMessage.length,
          error: error.message,
          isAnonymousMode: anonymousMode,
          hasCurrentUserId: !!currentUserId,
        });
      } finally {
        // Focus back on input after sending
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }
    }
  };

  // Display typing indicator text with performance tracking
  const renderTypingIndicator = () => {
    if (!typingUsers || typingUsers.length === 0) return null;

    const startTime = Date.now();
    const count = typingUsers.length;
    let text = '';

    if (count === 1) {
      text = `${typingUsers[0].username || 'Someone'} is typing...`;
    } else if (count === 2) {
      text = `${typingUsers[0].username || 'Someone'} and ${typingUsers[1].username || 'someone'} are typing...`;
    } else {
      text = `${count} people are typing...`;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_input_typing_indicator', duration, {
      success: true,
      userCount: count,
      hasUsernames: typingUsers.some(user => user.username),
    });

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

  const characterCountText = `${characterCount} characters remaining`;

  // Generate accessibility props with performance tracking
  const generateAccessibilityProps = () => {
    const startTime = Date.now();
    const props = createLiveRegionProps(true, 'polite');
    const duration = Date.now() - startTime;

    PerformanceMonitor.trackOperationTiming('chat_input_accessibility', duration, {
      success: true,
      hasStatusProps: !!props,
    });

    return props;
  };

  const statusProps = generateAccessibilityProps();

  // Handle keyboard navigation with performance tracking
  const handleKeyboardNavigation = e => {
    const startTime = Date.now();
    const result = mapKeyboardActions(e, {
      onEnter: handleSendMessage,
      onEscape: () => {
        setMessage('');
        setCharacterCount(0);
        setIsNearLimit(false);
        setIsAtLimit(false);
      },
    });

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('chat_input_keyboard', duration, {
      success: true,
      key: e.key,
      hasMessage: message.length > 0,
      isAtLimit,
      hasAction: !!result,
    });

    return result;
  };

  // Set up keyboard listeners with performance tracking
  useEffect(() => {
    const startTime = Date.now();
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keydown', handleKeyboardNavigation);
      const duration = Date.now() - startTime;

      PerformanceMonitor.trackOperationTiming('chat_input_keyboard_setup', duration, {
        success: true,
        hasInputElement: !!inputElement,
      });

      return () => {
        inputElement.removeEventListener('keydown', handleKeyboardNavigation);
      };
    }
  }, [handleKeyboardNavigation]);

  const inputClasses = [
    styles.input,
    disabled ? styles.disabled : '',
    isTyping ? styles.typing : '',
    characterCountText,
    isNearLimit ? styles.nearLimit : '',
    isAtLimit ? styles.atLimit : '',
    showAnonymousIndicator && anonymousMode ? styles.anonymousMode : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        {typingUsers && typingUsers.length > 0 && renderTypingIndicator()}

        <div className={styles.inputContainer}>
          {showAnonymousIndicator && anonymousMode && (
            <div className={styles.anonymousBadge} title="Anonymous Mode">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                <line x1="19" y1="8" x2="23" y2="12"></line>
                <line x1="23" y1="8" x2="19" y2="12"></line>
              </svg>
            </div>
          )}

          <textarea
            ref={textAreaRef}
            className={inputClasses}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyboardNavigation}
            placeholder={inputDisabled ? 'Chat unavailable...' : placeholderText}
            disabled={inputDisabled}
            rows="1"
            aria-label="Type a message"
            aria-multiline="true"
            aria-describedby={`${charCountId} ${inputStatusId}`}
          />
        </div>
        <div className={styles.characterCount}>{characterCountText}</div>
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || inputDisabled}
          className={styles.sendButton}
          aria-label="Send message"
          aria-disabled={!message.trim() || inputDisabled}
        >
          Send
        </button>
      </div>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholderText: PropTypes.string,
  showAnonymousIndicator: PropTypes.bool,
  className: PropTypes.string,
};

export default ChatInput;
