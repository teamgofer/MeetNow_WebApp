import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
import { TIMING } from '../constants';
import { useProximityChatContext } from '../context/ProximityChatContext';
import styles from '../styles/TypingIndicator.module.css';
import {
  mapKeyboardActions,
  getFocusableElements,
  focusElement,
} from '../utils/accessibilityUtils';

/**
 * Component for displaying typing indicators in the chat
 *
 * @param {Object} props - Component props
 * @param {Array} props.typingUsers - Array of users currently typing
 * @param {Function} props.onTypingStatusChange - Callback when typing status changes
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const TypingIndicator = ({
  typingUsers = [],
  onTypingStatusChange = null,
  className = '',
  style = {},
}) => {
  const { currentUserId } = useProximityChatContext();
  const [isVisible, setIsVisible] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const indicatorRef = useRef(null);
  const renderStartTimeRef = useRef(Date.now());

  // Track component rendering performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('component', 'TypingIndicator', renderDuration, {
      success: true,
      typingUsersCount: typingUsers.length,
      isVisible,
      action: 'render',
    });

    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [typingUsers.length, isVisible]);

  // Handle typing status updates
  useEffect(() => {
    const startTime = Date.now();
    const hasTypingUsers = typingUsers.length > 0;

    if (hasTypingUsers !== isVisible) {
      setIsVisible(hasTypingUsers);
      onTypingStatusChange(hasTypingUsers);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('component', 'TypingIndicator', duration, {
        success: true,
        typingUsersCount: typingUsers.length,
        action: 'statusUpdate',
        state: hasTypingUsers ? 'visible' : 'hidden',
      });
    }
  }, [typingUsers.length, isVisible, onTypingStatusChange]);

  // Handle animation updates
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const startTime = Date.now();
    let animationId;

    const animate = () => {
      setAnimationFrame(prev => (prev + 1) % 3);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'TypingIndicator', duration, {
      success: true,
      typingUsersCount: typingUsers.length,
      action: 'animationStart',
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        PerformanceMonitor.trackOperationTiming('component', 'TypingIndicator', 0, {
          success: true,
          typingUsersCount: typingUsers.length,
          action: 'animationStop',
        });
      }
    };
  }, [isVisible, typingUsers.length]);

  // Handle keyboard navigation
  const handleKeyboardNavigation = mapKeyboardActions({
    tab: () => {
      const focusableElements = getFocusableElements(indicatorRef.current);
      const currentIndex = focusableElements.indexOf(document.activeElement);
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusElement(focusableElements[nextIndex]);
    },
  });

  // Set up keyboard listeners
  useEffect(() => {
    const indicatorElement = indicatorRef.current;
    if (indicatorElement) {
      indicatorElement.addEventListener('keydown', handleKeyboardNavigation);
      return () => {
        indicatorElement.removeEventListener('keydown', handleKeyboardNavigation);
      };
    }
  }, [handleKeyboardNavigation]);

  if (!isVisible) {
    return null;
  }

  const indicatorClasses = [styles.typingIndicator, className].filter(Boolean).join(' ');

  const getTypingText = () => {
    const startTime = Date.now();
    let text;

    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      text =
        user.id === currentUserId
          ? 'You are typing...'
          : `${user.username || 'Someone'} is typing...`;
    } else if (typingUsers.length === 2) {
      const [user1, user2] = typingUsers;
      text = `${user1.username || 'Someone'} and ${user2.username || 'someone'} are typing...`;
    } else {
      text = `${typingUsers.length} people are typing...`;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('component', 'TypingIndicator', duration, {
      success: true,
      typingUsersCount: typingUsers.length,
      action: 'textGeneration',
    });

    return text;
  };

  return (
    <div
      ref={indicatorRef}
      className={indicatorClasses}
      style={style}
      role="status"
      aria-live="polite"
    >
      <div className={styles.dots}>
        <span className={`${styles.dot} ${animationFrame === 0 ? styles.active : ''}`} />
        <span className={`${styles.dot} ${animationFrame === 1 ? styles.active : ''}`} />
        <span className={`${styles.dot} ${animationFrame === 2 ? styles.active : ''}`} />
      </div>
      <span className={styles.text}>{getTypingText()}</span>
    </div>
  );
};

TypingIndicator.propTypes = {
  typingUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ),
  onTypingStatusChange: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TypingIndicator;
