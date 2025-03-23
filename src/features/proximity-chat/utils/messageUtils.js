/**
 * Message Utilities for Proximity Chat
 * 
 * Provides helper functions for working with chat messages,
 * including formatting, grouping, and filtering messages.
 */

import { formatDistance } from './locationUtils';

/**
 * Formats a relative timestamp from the current time
 * 
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} A human-readable relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    // Format date for older messages
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Groups messages by sender to improve readability
 * 
 * @param {Array} messages - Array of message objects
 * @param {number} timeThreshold - Time threshold in ms to group messages (default: 5 min)
 * @returns {Array} Array of message groups with UI display properties
 */
export const groupMessagesBySender = (messages, timeThreshold = 5 * 60 * 1000) => {
  if (!messages || !messages.length) return [];
  
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.sentAt);
    const dateB = new Date(b.sentAt);
    return dateA - dateB;
  });
  
  const groups = [];
  let currentGroup = null;
  
  sortedMessages.forEach(message => {
    const messageDate = new Date(message.sentAt);
    
    // Start a new group if:
    // 1. This is the first message
    // 2. The sender changed
    // 3. Too much time passed since the last message
    const shouldStartNewGroup = 
      !currentGroup || 
      message.userId !== currentGroup.userId ||
      (messageDate - new Date(currentGroup.messages[currentGroup.messages.length - 1].sentAt)) > timeThreshold;
    
    if (shouldStartNewGroup) {
      currentGroup = {
        userId: message.userId,
        username: message.username,
        avatarUrl: message.avatarUrl,
        isAnonymous: message.isAnonymous,
        messages: [message],
        // Add UI display properties
        showHeader: true,
        showAvatar: true,
        showTimestamp: true,
      };
      groups.push(currentGroup);
    } else {
      // Continue the current group
      currentGroup.messages.push({
        ...message,
        // These messages don't need the redundant header info
        showHeader: false,
        showAvatar: false,
        // Only show timestamp for the last message in a group
        showTimestamp: false,
      });
      
      // Last message should show timestamp
      currentGroup.messages[currentGroup.messages.length - 1].showTimestamp = true;
    }
  });
  
  // Flatten the groups back to an array of messages with display properties
  return groups.flatMap(group => group.messages);
};

/**
 * Filters messages to show only those within a certain radius
 * 
 * @param {Array} messages - Array of message objects
 * @param {Object} userLocation - Current user location {latitude, longitude}
 * @param {number} radiusMeters - Maximum distance in meters
 * @returns {Array} Filtered array of messages
 */
export const filterMessagesByDistance = (messages, userLocation, radiusMeters) => {
  if (!messages || !userLocation) return [];
  
  return messages.filter(message => {
    // Skip messages without location data
    if (!message.location) return false;
    
    // Calculate distance using Haversine formula
    const lat1 = userLocation.latitude * Math.PI / 180;
    const lon1 = userLocation.longitude * Math.PI / 180;
    const lat2 = message.location.latitude * Math.PI / 180;
    const lon2 = message.location.longitude * Math.PI / 180;
    
    const R = 6371000; // Earth radius in meters
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    message.distanceMeters = distance;
    message.formattedDistance = formatDistance(distance);
    
    return distance <= radiusMeters;
  });
};

/**
 * Sorts messages by timestamp (newest first or oldest first)
 * 
 * @param {Array} messages - Array of message objects
 * @param {boolean} newestFirst - Whether to sort newest first
 * @returns {Array} Sorted array of messages
 */
export const sortMessagesByTime = (messages, newestFirst = false) => {
  if (!messages) return [];
  
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.sentAt).getTime();
    const timeB = new Date(b.sentAt).getTime();
    return newestFirst ? timeB - timeA : timeA - timeB;
  });
};

/**
 * Filters messages by user ID
 * 
 * @param {Array} messages - Array of message objects
 * @param {string} userId - User ID to filter by
 * @returns {Array} Filtered array of messages
 */
export const filterMessagesByUser = (messages, userId) => {
  if (!messages || !userId) return [];
  
  return messages.filter(message => message.userId === userId);
};

/**
 * Generates a unique ID for a new message
 * 
 * @returns {string} Unique message ID
 */
export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates a new message object
 * 
 * @param {Object} data - Message data
 * @returns {Object} Formatted message object
 */
export const createMessage = (data) => {
  if (!data || !data.text || !data.userId) {
    throw new Error('Invalid message data');
  }
  
  return {
    id: generateMessageId(),
    text: data.text,
    userId: data.userId,
    username: data.username || 'Unknown',
    avatarUrl: data.avatarUrl || null,
    sentAt: data.sentAt || new Date().toISOString(),
    location: data.location || null,
    isAnonymous: data.isAnonymous || false,
    distanceMeters: data.distanceMeters || null,
    formattedDistance: data.formattedDistance || null,
  };
};

/**
 * Deduplicate messages by ID
 * 
 * @param {Array} messages - Array of message objects
 * @returns {Array} Deduplicated array of messages
 */
export const deduplicateMessages = (messages) => {
  if (!messages) return [];
  
  const uniqueMessages = {};
  
  messages.forEach(message => {
    if (message.id) {
      uniqueMessages[message.id] = message;
    }
  });
  
  return Object.values(uniqueMessages);
}; 