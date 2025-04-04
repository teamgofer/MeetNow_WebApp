/**
 * Chat History Utilities
 *
 * Provides functions for loading and managing chat history,
 * tracking seen messages, and handling message pagination
 */

/**
 * Get messages from history that were sent in a specific area
 *
 * @param {Array} messages - All available messages
 * @param {Object} location - Center point of the area {latitude, longitude}
 * @param {number} radiusInMeters - Radius to consider for the area
 * @param {Object} options - Additional options
 * @returns {Array} - Messages that were sent in the specified area
 */
export const getMessagesInArea = (messages, location, radiusInMeters, options = {}) => {
  if (!Array.isArray(messages) || !location) {
    return [];
  }

  const {
    maxResults = 100,
    excludeCurrentUser = false,
    currentUserId = null,
    newestFirst = true,
    includeExpired = false,
    timeThresholdMinutes = null,
  } = options;

  // Calculate time threshold if provided
  const timeThreshold = timeThresholdMinutes
    ? new Date(Date.now() - timeThresholdMinutes * 60 * 1000)
    : null;

  // Filter messages by area and options
  let filteredMessages = messages.filter(message => {
    // Skip messages without location data
    if (!message.location) return false;

    // Skip expired messages unless explicitly included
    if (!includeExpired && message.isExpired) return false;

    // Skip current user's messages if excluded
    if (excludeCurrentUser && currentUserId && message.senderId === currentUserId) {
      return false;
    }

    // Skip messages outside time threshold if specified
    if (timeThreshold && new Date(message.timestamp) < timeThreshold) {
      return false;
    }

    // Check if message is within the radius of the specified location
    const dx = location.latitude - message.location.latitude;
    const dy = location.longitude - message.location.longitude;

    // Using simplified distance calculation for performance
    // This is an approximation that works for small distances
    // For more accuracy, use the Haversine formula from locationUtils
    const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters

    return distance <= radiusInMeters;
  });

  // Sort messages by timestamp
  if (newestFirst) {
    filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else {
    filteredMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Limit results if needed
  if (maxResults > 0 && filteredMessages.length > maxResults) {
    filteredMessages = filteredMessages.slice(0, maxResults);
  }

  return filteredMessages;
};

/**
 * Track which messages have been seen by the user
 *
 * @param {string} userId - Current user ID
 * @param {Array} messageIds - IDs of messages to mark as seen
 * @returns {Object} - Updated seen messages tracking object
 */
export const trackSeenMessages = (userId, messageIds) => {
  if (!userId || !Array.isArray(messageIds) || messageIds.length === 0) {
    return null;
  }

  // Get existing seen messages from storage
  const existingData = localStorage.getItem('proximityChat.seenMessages');
  const seenMessages = existingData ? JSON.parse(existingData) : {};

  // Initialize user's seen messages if needed
  if (!seenMessages[userId]) {
    seenMessages[userId] = {
      messageIds: {},
      lastUpdated: Date.now(),
    };
  }

  // Add new message IDs to the tracking object
  messageIds.forEach(messageId => {
    seenMessages[userId].messageIds[messageId] = Date.now();
  });

  seenMessages[userId].lastUpdated = Date.now();

  // Save updated data to storage
  localStorage.setItem('proximityChat.seenMessages', JSON.stringify(seenMessages));

  return seenMessages[userId];
};

/**
 * Check if a message has been seen by the user
 *
 * @param {string} userId - Current user ID
 * @param {string} messageId - Message ID to check
 * @returns {boolean} - Whether the message has been seen
 */
export const hasUserSeenMessage = (userId, messageId) => {
  if (!userId || !messageId) {
    return false;
  }

  const existingData = localStorage.getItem('proximityChat.seenMessages');
  if (!existingData) {
    return false;
  }

  const seenMessages = JSON.parse(existingData);
  return seenMessages[userId]?.messageIds?.[messageId] !== undefined;
};

/**
 * Get all messages that the user hasn't seen yet in a specific area
 *
 * @param {Array} messages - All available messages
 * @param {string} userId - Current user ID
 * @param {Object} location - Center point of the area {latitude, longitude}
 * @param {number} radiusInMeters - Radius to consider for the area
 * @returns {Array} - Unseen messages in the area
 */
export const getUnseenMessagesInArea = (messages, userId, location, radiusInMeters) => {
  if (!Array.isArray(messages) || !userId || !location) {
    return [];
  }

  // Get messages in the area
  const areaMessages = getMessagesInArea(messages, location, radiusInMeters);

  // Filter out messages the user has already seen
  return areaMessages.filter(message => !hasUserSeenMessage(userId, message.id));
};

/**
 * Create a cursor-based pagination object for loading more messages
 *
 * @param {Array} messages - Array of messages
 * @param {number} pageSize - Number of messages per page
 * @param {string} cursor - Cursor for pagination (message ID or timestamp)
 * @param {boolean} newestFirst - Whether to sort newest messages first
 * @returns {Object} - Pagination object with results and metadata
 */
export const paginateMessages = (messages, pageSize = 20, cursor = null, newestFirst = true) => {
  if (!Array.isArray(messages)) {
    return {
      results: [],
      hasMore: false,
      nextCursor: null,
      totalCount: 0,
    };
  }

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return newestFirst ? bTime - aTime : aTime - bTime;
  });

  let startIndex = 0;
  const totalCount = sortedMessages.length;

  // Find starting index if cursor is provided
  if (cursor) {
    startIndex = sortedMessages.findIndex(msg => msg.id === cursor);
    if (startIndex === -1) {
      // If cursor not found, check if it's a timestamp cursor
      const timestampCursor = Number(cursor);
      if (!isNaN(timestampCursor)) {
        startIndex = sortedMessages.findIndex(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          return newestFirst ? msgTime < timestampCursor : msgTime > timestampCursor;
        });
      }

      // Default to beginning if cursor not found
      if (startIndex === -1) {
        startIndex = 0;
      }
    } else {
      // Start after the cursor message
      startIndex += 1;
    }
  }

  // Get page of messages
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const results = sortedMessages.slice(startIndex, endIndex);

  // Determine if there are more messages
  const hasMore = endIndex < totalCount;

  // Get cursor for next page
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return {
    results,
    hasMore,
    nextCursor,
    totalCount,
  };
};

/**
 * Group messages by time periods for better readability
 *
 * @param {Array} messages - Array of messages to group
 * @returns {Array} - Array of message groups with headers
 */
export const groupMessagesByTimePeriod = messages => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const groups = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;

  let currentGroup = null;

  messages.forEach(message => {
    const messageTime = new Date(message.timestamp).getTime();
    let groupType = '';

    // Determine group type based on time
    if (messageTime >= today) {
      groupType = 'today';
    } else if (messageTime >= yesterday) {
      groupType = 'yesterday';
    } else {
      const messageDate = new Date(message.timestamp);
      groupType = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
    }

    // Create new group if needed
    if (!currentGroup || currentGroup.type !== groupType) {
      currentGroup = {
        type: groupType,
        label: getGroupLabel(groupType),
        messages: [],
      };
      groups.push(currentGroup);
    }

    // Add message to current group
    currentGroup.messages.push(message);
  });

  return groups;
};

/**
 * Get human-readable label for a time group
 *
 * @param {string} groupType - Type of the time group
 * @returns {string} - Readable label for the group
 */
const getGroupLabel = groupType => {
  if (groupType === 'today') {
    return 'Today';
  }

  if (groupType === 'yesterday') {
    return 'Yesterday';
  }

  // Parse date from format YYYY-MM-DD
  const [year, month, day] = groupType.split('-').map(Number);
  const date = new Date(year, month, day);

  // Check if it's within the last week
  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  if (date >= weekAgo) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  // Older messages show full date
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Mark messages as unread if they're from before user entered area
 *
 * @param {Array} messages - Messages to check
 * @param {Date} enteredAreaTime - When the user entered the area
 * @returns {Array} - Messages with added 'beforeArrival' flag
 */
export const markMessagesBeforeArrival = (messages, enteredAreaTime) => {
  if (!Array.isArray(messages) || !enteredAreaTime) {
    return messages;
  }

  const enteredTime =
    enteredAreaTime instanceof Date
      ? enteredAreaTime.getTime()
      : new Date(enteredAreaTime).getTime();

  return messages.map(message => {
    const messageTime = new Date(message.timestamp).getTime();
    return {
      ...message,
      beforeArrival: messageTime < enteredTime,
    };
  });
};
