/**
 * Utilities for handling message read receipts
 */

/**
 * Different possible receipt statuses for messages
 */
export const ReceiptStatus = {
  SENDING: 'sending',    // Message is being sent
  SENT: 'sent',          // Message was sent to the server
  DELIVERED: 'delivered', // Message was delivered to recipient's device
  READ: 'read'           // Message was read by the recipient
};

/**
 * Get the most advanced receipt status for a message
 * @param {Object} message - The message to check
 * @returns {string} The receipt status
 */
export const getReceiptStatus = (message) => {
  if (!message) return null;
  
  // Handle messages without receipt data
  if (!message.receipts) {
    // Legacy messages or messages in sending state
    return message.sent ? ReceiptStatus.SENT : ReceiptStatus.SENDING;
  }
  
  if (message.receipts.read) {
    return ReceiptStatus.READ;
  }
  
  if (message.receipts.delivered) {
    return ReceiptStatus.DELIVERED;
  }
  
  if (message.receipts.sent) {
    return ReceiptStatus.SENT;
  }
  
  return ReceiptStatus.SENDING;
};

/**
 * Check if a message was sent by the current user
 * @param {Object} message - The message to check
 * @param {string} currentUserId - Current user's ID
 * @returns {boolean} True if message was sent by current user
 */
export const isOwnMessage = (message, currentUserId) => {
  return message && message.userId === currentUserId;
};

/**
 * Create a new receipt object with the current timestamp
 * @param {string} userId - User ID who caused the receipt update
 * @returns {Object} Receipt object with timestamp
 */
export const createReceipt = (userId) => {
  return {
    userId,
    timestamp: new Date().toISOString()
  };
};

/**
 * Update the receipt status of a message
 * @param {Object} message - Message to update
 * @param {string} status - New receipt status
 * @param {string} userId - User ID who updated the status
 * @returns {Object} Updated message with new receipt status
 */
export const updateMessageReceipt = (message, status, userId) => {
  if (!message) return message;
  
  // Create receipts object if it doesn't exist
  const receipts = message.receipts || {};
  const receipt = createReceipt(userId);
  
  // Update based on the status
  switch (status) {
    case ReceiptStatus.SENT:
      return {
        ...message,
        receipts: {
          ...receipts,
          sent: receipt
        }
      };
    case ReceiptStatus.DELIVERED:
      return {
        ...message,
        receipts: {
          ...receipts,
          delivered: receipt
        }
      };
    case ReceiptStatus.READ:
      return {
        ...message,
        receipts: {
          ...receipts,
          read: receipt
        }
      };
    default:
      return message;
  }
};

/**
 * Update receipts for an array of messages
 * @param {Array} messages - All messages
 * @param {string} status - Receipt status to update
 * @param {string} userId - User ID who causes the update
 * @param {Function} filterFn - Optional filter function to select which messages to update
 * @returns {Array} Updated messages
 */
export const updateMessagesReceipts = (messages, status, userId, filterFn = null) => {
  if (!messages || !Array.isArray(messages)) return messages;
  
  return messages.map(message => {
    // Skip if filter function exists and returns false
    if (filterFn && !filterFn(message)) {
      return message;
    }
    
    return updateMessageReceipt(message, status, userId);
  });
};

/**
 * Get all messages that need to be marked as read
 * @param {Array} messages - All messages
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Messages that need to be marked as read
 */
export const getUnreadMessages = (messages, currentUserId) => {
  if (!messages || !Array.isArray(messages)) return [];
  
  return messages.filter(message => {
    // Skip own messages
    if (isOwnMessage(message, currentUserId)) {
      return false;
    }
    
    // Skip already read messages
    if (message.receipts && message.receipts.read) {
      return false;
    }
    
    return true;
  });
};

/**
 * Generate a receipt update message for the server
 * @param {string} messageId - ID of the message being updated
 * @param {string} status - New receipt status
 * @param {string} userId - Current user's ID
 * @returns {Object} Receipt update message for the server
 */
export const createReceiptUpdateMessage = (messageId, status, userId) => {
  return {
    type: 'RECEIPT_UPDATE',
    payload: {
      messageId,
      status,
      userId,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Format a receipt timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export const formatReceiptTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    
    // Format as HH:MM
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting receipt time:', error);
    return '';
  }
};

export default {
  ReceiptStatus,
  getReceiptStatus,
  isOwnMessage,
  createReceipt,
  updateMessageReceipt,
  updateMessagesReceipts,
  getUnreadMessages,
  createReceiptUpdateMessage,
  formatReceiptTime
}; 