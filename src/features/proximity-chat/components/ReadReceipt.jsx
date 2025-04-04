import PropTypes from 'prop-types';
import React from 'react';
import { FaCheck, FaCheckDouble, FaClock } from 'react-icons/fa';

import PerformanceMonitor from '../../../utils/PerformanceMonitor';
import { getReceiptStatus, ReceiptStatus, formatReceiptTime } from '../utils/readReceiptUtils';
import '../styles/proximity-chat.css';

/**
 * Component to display read receipt status for messages
 */
const ReadReceipt = ({ message, showTimestamp = false, size = 'medium', className = '' }) => {
  const renderStartTimeRef = React.useRef(Date.now());

  // Track component initialization
  React.useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('read_receipt_init', duration, {
      success: true,
      hasMessage: !!message,
      messageId: message?.id,
      userId: message?.userId,
      showTimestamp,
      size,
    });
  }, [message?.id, message?.userId, showTimestamp, size]);

  if (!message) {
    PerformanceMonitor.trackOperationTiming('read_receipt_invalid', 0, {
      success: false,
      reason: 'no_message',
    });
    return null;
  }

  // Track receipt status calculation
  const statusStartTime = Date.now();
  const status = getReceiptStatus(message);
  const statusDuration = Date.now() - statusStartTime;
  PerformanceMonitor.trackOperationTiming('read_receipt_status', statusDuration, {
    success: true,
    messageId: message.id,
    status,
    hasReceipts: !!message.receipts,
    hasReadReceipt: !!message.receipts?.read,
    hasDeliveredReceipt: !!message.receipts?.delivered,
    hasSentReceipt: !!message.receipts?.sent,
  });

  // Find appropriate timestamp based on the current status
  const getTimestamp = () => {
    const startTime = Date.now();
    let timestamp;

    if (!message.receipts) {
      timestamp = message.timestamp; // Default to message timestamp
    } else if (status === ReceiptStatus.READ && message.receipts.read) {
      timestamp = message.receipts.read.timestamp;
    } else if (status === ReceiptStatus.DELIVERED && message.receipts.delivered) {
      timestamp = message.receipts.delivered.timestamp;
    } else if (status === ReceiptStatus.SENT && message.receipts.sent) {
      timestamp = message.receipts.sent.timestamp;
    } else {
      timestamp = message.timestamp;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('read_receipt_timestamp', duration, {
      success: true,
      messageId: message.id,
      status,
      hasReceipts: !!message.receipts,
      timestampSource: message.receipts ? 'receipts' : 'message',
    });

    return timestamp;
  };

  // Map status to icon and color
  const getStatusDetails = () => {
    const startTime = Date.now();
    let details;

    switch (status) {
      case ReceiptStatus.READ:
        details = {
          icon: FaCheckDouble,
          color: 'var(--read-receipt-read, #4caf50)',
          label: 'Read',
        };
        break;
      case ReceiptStatus.DELIVERED:
        details = {
          icon: FaCheckDouble,
          color: 'var(--read-receipt-delivered, #2196f3)',
          label: 'Delivered',
        };
        break;
      case ReceiptStatus.SENT:
        details = {
          icon: FaCheck,
          color: 'var(--read-receipt-sent, #9e9e9e)',
          label: 'Sent',
        };
        break;
      case ReceiptStatus.SENDING:
      default:
        details = {
          icon: FaClock,
          color: 'var(--read-receipt-sending, #9e9e9e)',
          label: 'Sending',
        };
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('read_receipt_details', duration, {
      success: true,
      messageId: message.id,
      status,
      label: details.label,
    });

    return details;
  };

  const { icon: StatusIcon, color, label } = getStatusDetails();
  const timestamp = getTimestamp();

  // Track time formatting
  const formatStartTime = Date.now();
  const formattedTime = formatReceiptTime(timestamp);
  const formatDuration = Date.now() - formatStartTime;
  PerformanceMonitor.trackOperationTiming('read_receipt_format', formatDuration, {
    success: true,
    messageId: message.id,
    hasTimestamp: !!timestamp,
    hasFormattedTime: !!formattedTime,
  });

  // Dynamic class based on size
  const sizeClass =
    size === 'small' ? 'receipt-small' : size === 'large' ? 'receipt-large' : 'receipt-medium';

  // Track final render
  const renderStartTime = Date.now();
  const receiptElement = (
    <div
      className={`read-receipt ${sizeClass} ${className}`}
      title={`${label}${timestamp ? ` at ${formattedTime}` : ''}`}
      aria-label={`${label}${timestamp ? ` at ${formattedTime}` : ''}`}
    >
      <StatusIcon style={{ color }} className="receipt-icon" />

      {showTimestamp && formattedTime && <span className="receipt-timestamp">{formattedTime}</span>}
    </div>
  );

  const renderDuration = Date.now() - renderStartTime;
  PerformanceMonitor.trackOperationTiming('read_receipt_render', renderDuration, {
    success: true,
    messageId: message.id,
    status,
    showTimestamp,
    size,
    hasFormattedTime: !!formattedTime,
  });

  return receiptElement;
};

ReadReceipt.propTypes = {
  /** Message object containing receipt information */
  message: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    receipts: PropTypes.shape({
      sent: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string,
      }),
      delivered: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string,
      }),
      read: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string,
      }),
    }),
  }),
  /** Whether to show the timestamp next to the icon */
  showTimestamp: PropTypes.bool,
  /** Size of the receipt indicator */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Additional class names */
  className: PropTypes.string,
};

export default ReadReceipt;
