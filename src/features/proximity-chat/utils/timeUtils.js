/**
 * Time utility functions for the proximity chat feature
 */
import { timeConstants } from '../constants';

/**
 * Utility functions for handling time-related operations
 */

/**
 * Formats a timestamp as a relative time string (e.g., "5 minutes ago")
 * 
 * @param {Date|string|number} time - Time to format
 * @param {Object} options - Formatting options
 * @param {boolean} [options.shortFormat=false] - Use short format (e.g., "5m" instead of "5 minutes")
 * @param {boolean} [options.includeAgo=true] - Include "ago" suffix
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (time, options = {}) => {
  const { shortFormat = false, includeAgo = true } = options;
  
  // Convert input to Date object
  const date = time instanceof Date ? time : new Date(time);
  const now = new Date();
  
  // Calculate time difference in milliseconds
  const diffMs = now - date;
  
  // Return "Just now" for very recent messages
  if (diffMs < 60000) { // Less than a minute
    return "Just now";
  }
  
  // Calculate time units
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Format the relative time
  let value;
  let unit;
  
  if (years > 0) {
    value = years;
    unit = shortFormat ? 'y' : (years === 1 ? 'year' : 'years');
  } else if (months > 0) {
    value = months;
    unit = shortFormat ? 'mo' : (months === 1 ? 'month' : 'months');
  } else if (weeks > 0) {
    value = weeks;
    unit = shortFormat ? 'w' : (weeks === 1 ? 'week' : 'weeks');
  } else if (days > 0) {
    value = days;
    unit = shortFormat ? 'd' : (days === 1 ? 'day' : 'days');
  } else if (hours > 0) {
    value = hours;
    unit = shortFormat ? 'h' : (hours === 1 ? 'hour' : 'hours');
  } else {
    value = minutes;
    unit = shortFormat ? 'm' : (minutes === 1 ? 'minute' : 'minutes');
  }
  
  // Build the result string
  if (shortFormat) {
    return `${value}${unit}${includeAgo ? ' ago' : ''}`;
  } else {
    return `${value} ${unit}${includeAgo ? ' ago' : ''}`;
  }
};

/**
 * Format a date to a readable string (e.g., "Jan 1, 2023")
 * @param {Date} date - The date to format
 * @returns {string} A formatted date string
 */
export const formatDateString = (date) => {
  if (!date) {
    return '';
  }
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format a date to show time (e.g., "3:45 PM")
 * @param {Date} date - The date to format
 * @returns {string} A formatted time string
 */
export const formatTimeString = (date) => {
  if (!date) {
    return '';
  }
  
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a date to include both date and time
 * @param {Date} date - The date to format
 * @returns {string} A formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) {
    return '';
  }
  
  return `${formatDateString(date)} at ${formatTimeString(date)}`;
};

/**
 * Check if a message is expired based on its timestamp
 * @param {number|string|Date} timestamp - The timestamp to check
 * @returns {boolean} Whether the message is expired
 */
export const isMessageExpired = (timestamp) => {
  if (!timestamp) {
    return true;
  }
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  
  return diffMs > timeConstants.MESSAGE_EXPIRY;
};

/**
 * Calculate the time remaining until a message expires
 * @param {number|string|Date} timestamp - The timestamp to check
 * @returns {number} Time remaining in milliseconds
 */
export const getMessageExpiryTime = (timestamp) => {
  if (!timestamp) {
    return 0;
  }
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const remainingMs = timeConstants.MESSAGE_EXPIRY - diffMs;
  
  return Math.max(0, remainingMs);
};

/**
 * Get a human-readable string for the remaining time until a message expires
 * @param {number|string|Date} timestamp - The timestamp to check
 * @returns {string} Human-readable expiry time string
 */
export const getMessageExpiryString = (timestamp) => {
  const remainingMs = getMessageExpiryTime(timestamp);
  
  if (remainingMs <= 0) {
    return 'Expired';
  }
  
  const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  
  if (remainingHours > 0) {
    return `Expires in ${remainingHours}h ${remainingMinutes}m`;
  } else {
    return `Expires in ${remainingMinutes}m`;
  }
};

/**
 * Formats a timestamp as a time string for message display
 * 
 * @param {Date|string|number} time - The time to format
 * @returns {string} Formatted time (HH:MM AM/PM)
 */
export const formatMessageTime = (time) => {
  const date = time instanceof Date ? time : new Date(time);
  
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a date as a string to display in message groups
 * 
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatMessageDate = (date) => {
  const messageDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if date is today or yesterday
  if (messageDate.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Check if date is within the current week
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  if (messageDate >= weekAgo) {
    // Format as day name
    return messageDate.toLocaleDateString(undefined, { weekday: 'long' });
  }
  
  // Check if date is within the current year
  if (messageDate.getFullYear() === now.getFullYear()) {
    // Format as month and day
    return messageDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Format as month, day and year
  return messageDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Groups messages by date for display
 * 
 * @param {Array} messages - Array of message objects
 * @returns {Object} Object with dates as keys and arrays of messages as values
 */
export const groupMessagesByDate = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {};
  }
  
  // Sort messages by timestamp (newest last)
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // Group by date
  return sortedMessages.reduce((groups, message) => {
    // Get date string without time
    const messageDate = new Date(message.timestamp);
    const dateString = messageDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Add message to appropriate group
    if (!groups[dateString]) {
      groups[dateString] = [];
    }
    
    groups[dateString].push(message);
    return groups;
  }, {});
};

/**
 * Determines if a message was sent after a user entered an area
 * 
 * @param {Object} message - Message object with timestamp
 * @param {Date|string|number} enteredAt - When the user entered the area
 * @returns {boolean} True if message was sent after user entered
 */
export const isNewMessage = (message, enteredAt) => {
  if (!message || !message.timestamp || !enteredAt) {
    return false;
  }
  
  const messageTime = new Date(message.timestamp).getTime();
  const enteredTime = enteredAt instanceof Date 
    ? enteredAt.getTime() 
    : new Date(enteredAt).getTime();
  
  return messageTime >= enteredTime;
}; 