import React from 'react';
import PropTypes from 'prop-types';
import { FaCheck, FaCheckDouble, FaClock } from 'react-icons/fa';
import { getReceiptStatus, ReceiptStatus, formatReceiptTime } from '../utils/readReceiptUtils';
import '../styles/proximity-chat.css';

/**
 * Component to display read receipt status for messages
 */
const ReadReceipt = ({ message, showTimestamp = false, size = 'medium', className = '' }) => {
  if (!message) return null;
  
  const status = getReceiptStatus(message);
  
  // Find appropriate timestamp based on the current status
  const getTimestamp = () => {
    if (!message.receipts) {
      return message.timestamp; // Default to message timestamp
    }
    
    if (status === ReceiptStatus.READ && message.receipts.read) {
      return message.receipts.read.timestamp;
    }
    
    if (status === ReceiptStatus.DELIVERED && message.receipts.delivered) {
      return message.receipts.delivered.timestamp;
    }
    
    if (status === ReceiptStatus.SENT && message.receipts.sent) {
      return message.receipts.sent.timestamp;
    }
    
    return message.timestamp;
  };
  
  // Map status to icon and color
  const getStatusDetails = () => {
    switch (status) {
      case ReceiptStatus.READ:
        return {
          icon: FaCheckDouble,
          color: 'var(--read-receipt-read, #4caf50)',
          label: 'Read'
        };
      case ReceiptStatus.DELIVERED:
        return {
          icon: FaCheckDouble,
          color: 'var(--read-receipt-delivered, #2196f3)',
          label: 'Delivered'
        };
      case ReceiptStatus.SENT:
        return {
          icon: FaCheck,
          color: 'var(--read-receipt-sent, #9e9e9e)',
          label: 'Sent'
        };
      case ReceiptStatus.SENDING:
      default:
        return {
          icon: FaClock,
          color: 'var(--read-receipt-sending, #9e9e9e)',
          label: 'Sending'
        };
    }
  };
  
  const { icon: StatusIcon, color, label } = getStatusDetails();
  const timestamp = getTimestamp();
  const formattedTime = formatReceiptTime(timestamp);
  
  // Dynamic class based on size
  const sizeClass = size === 'small' ? 'receipt-small' : 
                     size === 'large' ? 'receipt-large' : 'receipt-medium';
  
  return (
    <div 
      className={`read-receipt ${sizeClass} ${className}`}
      title={`${label}${timestamp ? ` at ${formattedTime}` : ''}`}
      aria-label={`${label}${timestamp ? ` at ${formattedTime}` : ''}`}
    >
      <StatusIcon style={{ color }} className="receipt-icon" />
      
      {showTimestamp && formattedTime && (
        <span className="receipt-timestamp">{formattedTime}</span>
      )}
    </div>
  );
};

ReadReceipt.propTypes = {
  /** Message object containing receipt information */
  message: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    receipts: PropTypes.shape({
      sent: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string
      }),
      delivered: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string
      }),
      read: PropTypes.shape({
        userId: PropTypes.string,
        timestamp: PropTypes.string
      })
    })
  }),
  /** Whether to show the timestamp next to the icon */
  showTimestamp: PropTypes.bool,
  /** Size of the receipt indicator */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Additional class names */
  className: PropTypes.string
};

export default ReadReceipt; 