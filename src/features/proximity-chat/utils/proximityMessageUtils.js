/**
 * Proximity Message Utilities
 *
 * Provides functions for filtering and processing messages
 * based on user proximity and location data
 */
import { calculateDistance, isWithinRadius } from './locationUtils';
import { isMessageExpired } from './timeUtils';

// Maximum distance to consider a user within proximity (in meters)
const DEFAULT_PROXIMITY_RADIUS = 100;

/**
 * Filter messages based on proximity to the current user's location
 *
 * @param {Array} messages - Array of message objects
 * @param {Object} userLocation - Current user's location {latitude, longitude}
 * @param {Object} options - Filtering options
 * @param {number} options.proximityRadius - Maximum radius in meters
 * @param {String} options.currentUserId - ID of the current user
 * @param {Function} options.isUserBlocked - Function to check if a user is blocked
 * @param {boolean} options.includeExpired - Whether to include expired messages
 * @returns {Array} Filtered messages
 */
export const filterMessagesByProximity = (messages, userLocation, options = {}) => {
  const {
    proximityRadius = DEFAULT_PROXIMITY_RADIUS,
    currentUserId,
    isUserBlocked = () => false,
    includeExpired = false,
  } = options;

  if (!Array.isArray(messages) || !userLocation) {
    return [];
  }

  return messages.filter(message => {
    // Skip expired messages unless explicitly included
    if (!includeExpired && isMessageExpired(message.timestamp)) {
      return false;
    }

    // User always sees their own messages
    if (message.senderId === currentUserId) {
      return true;
    }

    // Skip messages from blocked users
    if (isUserBlocked(message.senderId)) {
      return false;
    }

    // Skip messages without location data
    if (!message.location) {
      return false;
    }

    // Check if message is within the proximity radius
    return isWithinRadius(userLocation, message.location, proximityRadius);
  });
};

/**
 * Add proximity data to messages (distance, direction, etc.)
 *
 * @param {Array} messages - Array of message objects
 * @param {Object} userLocation - Current user's location {latitude, longitude}
 * @returns {Array} Messages with enhanced proximity data
 */
export const enhanceMessagesWithProximityData = (messages, userLocation) => {
  if (!Array.isArray(messages) || !userLocation) {
    return messages;
  }

  return messages.map(message => {
    if (!message.location) {
      return {
        ...message,
        distance: null,
        isInProximity: false,
      };
    }

    const distance = calculateDistance(userLocation, message.location);

    return {
      ...message,
      distance,
      isInProximity: distance !== null && distance <= DEFAULT_PROXIMITY_RADIUS,
    };
  });
};

/**
 * Group messages by proximity zones (near, medium, far)
 *
 * @param {Array} messages - Array of message objects with distance property
 * @returns {Object} Grouped messages by proximity zone
 */
export const groupMessagesByProximityZone = messages => {
  if (!Array.isArray(messages)) {
    return {
      near: [],
      medium: [],
      far: [],
    };
  }

  return messages.reduce(
    (groups, message) => {
      if (!message.distance) {
        return groups;
      }

      if (message.distance <= 30) {
        return {
          ...groups,
          near: [...groups.near, message],
        };
      } else if (message.distance <= 70) {
        return {
          ...groups,
          medium: [...groups.medium, message],
        };
      } else {
        return {
          ...groups,
          far: [...groups.far, message],
        };
      }
    },
    {
      near: [],
      medium: [],
      far: [],
    }
  );
};

/**
 * Identify new messages that have entered proximity since the last update
 *
 * @param {Array} currentMessages - Current messages in proximity
 * @param {Array} previousMessages - Previous messages in proximity
 * @returns {Array} New messages that just entered proximity
 */
export const getNewProximityMessages = (currentMessages, previousMessages) => {
  if (!Array.isArray(currentMessages) || !Array.isArray(previousMessages)) {
    return [];
  }

  const previousMessageIds = new Set(previousMessages.map(msg => msg.id));

  return currentMessages.filter(msg => !previousMessageIds.has(msg.id));
};

/**
 * Identify messages that have left proximity since the last update
 *
 * @param {Array} currentMessages - Current messages in proximity
 * @param {Array} previousMessages - Previous messages in proximity
 * @returns {Array} Messages that just left proximity
 */
export const getDepartedProximityMessages = (currentMessages, previousMessages) => {
  if (!Array.isArray(currentMessages) || !Array.isArray(previousMessages)) {
    return [];
  }

  const currentMessageIds = new Set(currentMessages.map(msg => msg.id));

  return previousMessages.filter(msg => !currentMessageIds.has(msg.id));
};

/**
 * Calculate fade opacity for a message based on distance
 * Creates a smooth fade effect as messages reach the edge of proximity
 *
 * @param {number} distance - Distance to the message sender in meters
 * @param {number} maxRadius - Maximum radius for proximity in meters
 * @returns {number} Opacity value between 0 and 1
 */
export const calculateMessageFadeOpacity = (distance, maxRadius = DEFAULT_PROXIMITY_RADIUS) => {
  if (distance === null || distance === undefined) {
    return 1;
  }

  // Full opacity for messages within 70% of the max radius
  if (distance <= maxRadius * 0.7) {
    return 1;
  }

  // Linear fade from 70% to 100% of the radius
  const fadeStartDistance = maxRadius * 0.7;
  const fadeRange = maxRadius - fadeStartDistance;
  const distanceInFadeRange = distance - fadeStartDistance;

  return Math.max(0, 1 - distanceInFadeRange / fadeRange);
};

/**
 * Determine if a message should have a visual transition effect
 * based on its entry/exit from proximity
 *
 * @param {Object} message - Message object
 * @param {Array} enteredMessages - Array of messages that just entered proximity
 * @param {Array} departedMessages - Array of messages that just left proximity
 * @returns {Object} Transition properties { entering, leaving }
 */
export const getMessageTransitionState = (message, enteredMessages = [], departedMessages = []) => {
  const isEntering = enteredMessages.some(m => m.id === message.id);
  const isLeaving = departedMessages.some(m => m.id === message.id);

  return {
    entering: isEntering,
    leaving: isLeaving,
  };
};

/**
 * Sort messages by a combination of time and proximity
 * This creates a more natural grouping where nearby messages are given priority
 *
 * @param {Array} messages - Array of message objects with distance property
 * @returns {Array} Sorted messages
 */
export const sortMessagesByProximityAndTime = messages => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return [...messages].sort((a, b) => {
    // First prioritize messages by zone (near, medium, far)
    const aDistance = a.distance || Infinity;
    const bDistance = b.distance || Infinity;

    const aZone = aDistance <= 30 ? 0 : aDistance <= 70 ? 1 : 2;
    const bZone = bDistance <= 30 ? 0 : bDistance <= 70 ? 1 : 2;

    if (aZone !== bZone) {
      return aZone - bZone;
    }

    // Within the same zone, sort by timestamp (newest first)
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();

    return bTime - aTime;
  });
};
