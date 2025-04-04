/**
 * Constants for the Proximity Chat feature
 */

// Local storage keys
export const localStorageKeys = {
  AUDIO_PREFERENCES: 'proximityChat.audioPreferences',
  CHAT_SETTINGS: 'proximityChat.settings',
  BLOCKED_USERS: 'proximityChat.blockedUsers',
  LAST_LOCATION: 'proximityChat.lastLocation',
  ANONYMOUS_MODE: 'proximityChat.anonymousMode',
  READ_RECEIPTS: 'proximityChat.readReceipts',
};

// WebSocket message types
export const wsMessageTypes = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  TYPING_START: 'TYPING_START',
  TYPING_STOP: 'TYPING_STOP',
  ERROR: 'ERROR',
  READ_RECEIPT: 'READ_RECEIPT',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',
};

// Distance constants
export const distanceConstants = {
  DEFAULT_MAX_DISTANCE: 1000, // meters
  MIN_DISTANCE: 50, // meters
  MAX_DISTANCE: 5000, // meters
  DISTANCE_STEP: 50, // meters
  METERS_PER_DEGREE: 111139, // meters per degree of latitude/longitude (approximate at equator)
};

// Time constants
export const timeConstants = {
  MESSAGE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  LOCATION_UPDATE_INTERVAL: 30 * 1000, // 30 seconds in milliseconds
  TYPING_TIMEOUT: 5 * 1000, // 5 seconds in milliseconds
};

// UI constants
export const uiConstants = {
  MAX_MESSAGE_LENGTH: 500,
  DEFAULT_AVATAR_COLOR: '#3B82F6',
  ANIMATION_DURATION: 300, // milliseconds
};

/**
 * API endpoints for the proximity chat feature
 */
export const API_ENDPOINTS = {
  // WebSocket endpoint for real-time communication
  WEBSOCKET: 'wss://mock.meetnow.proximity-chat.dev/ws',

  // REST API endpoints
  MESSAGES: 'https://mock.meetnow.proximity-chat.dev/messages',
  USERS: 'https://mock.meetnow.proximity-chat.dev/users',
  SETTINGS: 'https://mock.meetnow.proximity-chat.dev/settings',

  // Authentication endpoints
  AUTH_TOKEN: 'https://mock.meetnow.proximity-chat.dev/auth/token',
};

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  // Location update interval
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds

  // WebSocket reconnection base interval
  RECONNECT_INTERVAL: 2000, // 2 seconds

  // Typing indicator timeout
  TYPING_TIMEOUT: 3000, // 3 seconds

  // Message polling fallback interval (when WebSocket is not available)
  MESSAGE_POLLING_INTERVAL: 10000, // 10 seconds
};

/**
 * Feature configuration defaults
 */
export const DEFAULTS = {
  // Default chat radius in meters
  CHAT_RADIUS: 100,

  // Maximum chat radius allowed
  MAX_CHAT_RADIUS: 1000,

  // Default message history limit
  MESSAGE_HISTORY_LIMIT: 50,

  // Maximum message length
  MAX_MESSAGE_LENGTH: 500,

  // Default location accuracy threshold in meters
  LOCATION_ACCURACY_THRESHOLD: 100,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED:
    'Location permission denied. Please enable location services to use proximity chat.',
  LOCATION_UNAVAILABLE: 'Unable to determine your location. Please try again later.',
  CONNECTION_FAILED:
    'Failed to connect to the chat server. Please check your internet connection and try again.',
  MESSAGE_SEND_FAILED: 'Failed to send your message. Please try again.',
  INVALID_LOCATION:
    'Invalid location data. Please ensure your device has accurate location services.',
  UNAUTHORIZED:
    'You are not authorized to access this feature. Please sign in or create an account.',
};

/**
 * Event types for WebSocket communication
 */
export const EVENT_TYPES = {
  MESSAGE: 'message',
  LOCATION_UPDATE: 'location',
  NEARBY_USERS: 'nearby_users',
  TYPING_STATUS: 'typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ERROR: 'error',
  CONNECTION_STATUS: 'connection_status',
};

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  ENABLE_TYPING_INDICATORS: true,
  ENABLE_MESSAGE_REACTIONS: true,
  ENABLE_READ_RECEIPTS: true,
  ENABLE_OFFLINE_SUPPORT: true,
  ENABLE_LOCATION_SHARING: true,
  ENABLE_MESSAGE_REPORTING: true,
};
