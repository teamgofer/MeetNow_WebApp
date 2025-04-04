import React from 'react';

import styles from '../styles/MessageHistoryHeader.module.css';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * Header component for message history section
 *
 * @param {Object} props - Component props
 * @param {string} props.regionName - Name of the region or area
 * @param {number} props.messageCount - Number of messages in history
 * @param {Date} props.enteredAreaTime - When user entered the area
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} Rendered component
 */
const MessageHistoryHeader = ({
  regionName,
  messageCount,
  enteredAreaTime,
  className = '',
  style = {},
}) => {
  if (!enteredAreaTime) {
    return null;
  }

  // Format the time user entered the area
  const timeAgo = formatRelativeTime(enteredAreaTime);

  // Format message count text
  const getMessageCountText = () => {
    if (messageCount === 0) {
      return 'No messages';
    } else if (messageCount === 1) {
      return '1 message';
    } else {
      return `${messageCount} messages`;
    }
  };

  return (
    <div className={`${styles.messageHistoryHeader} ${className}`} style={style}>
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>Previous messages in {regionName}</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.timeInfo}>
          <span className={styles.label}>You entered:</span>
          <span className={styles.time}>{timeAgo}</span>
        </div>

        <div className={styles.countInfo}>
          <span className={styles.count}>{getMessageCountText()}</span>
          <span className={styles.label}>before you arrived</span>
        </div>
      </div>
    </div>
  );
};

export default MessageHistoryHeader;
