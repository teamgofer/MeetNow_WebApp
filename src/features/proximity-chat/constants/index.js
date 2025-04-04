/**
 * Constants for the Proximity Chat feature
 */

/**
 * WebSocket event types for chat communication
 */
export const CHAT_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  LOCATION_UPDATE: 'location_update',
  REGION_CHANGE: 'region_change',
};

/**
 * Message types for chat communication
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
  LOCATION: 'location',
  REGION_ENTRY: 'region_entry',
  REGION_EXIT: 'region_exit',
};

/**
 * Default distance constants
 */
export const DISTANCES = {
  DEFAULT_PROXIMITY_RADIUS: 500, // Default radius in meters for proximity chat
  MAX_PROXIMITY_RADIUS: 2000, // Maximum allowable radius in meters
  MIN_PROXIMITY_RADIUS: 50, // Minimum allowable radius in meters
  UPDATE_THRESHOLD: 10, // Minimum distance change in meters to trigger an update
};

/**
 * API constants
 */
export const API = {
  // Base API URL
  BASE_URL: '/api/v1',

  // WebSocket endpoints
  WEBSOCKET_URL: '/api/v1/ws/proximity-chat',

  // Default number of messages to fetch in history
  DEFAULT_MESSAGE_HISTORY_LIMIT: 25,

  // Maximum number of messages to load per request
  MAX_MESSAGE_LOAD_COUNT: 50,

  // Message types for WebSocket
  MESSAGE_TYPES: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    MESSAGE: 'message',
    TYPING: 'typing',
    ERROR: 'error',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    LOCATION_UPDATE: 'location_update',
  },

  // Status codes
  STATUS: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    RECONNECTING: 'reconnecting',
  },
};

/**
 * Timing constants
 */
export const TIMING = {
  // How frequently to update user location (ms)
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds

  // How frequently to reconnect if disconnected (ms)
  RECONNECT_INTERVAL: 5000, // 5 seconds

  // Typing indicator delay (ms)
  TYPING_INDICATOR_DELAY: 1000, // 1 second

  // Typing indicator expiration (ms)
  TYPING_INDICATOR_EXPIRATION: 10000, // 10 seconds

  // Number of messages to load in history at once
  MESSAGE_HISTORY_LOAD_LIMIT: 25,

  // Chat refresh interval (ms)
  NEARBY_USERS_REFRESH: 15000, // 15 seconds

  // Animation durations (ms)
  ANIMATION: {
    MESSAGE_APPEAR: 300,
    USER_APPEAR: 500,
    TYPING_INDICATOR: 750,
  },
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  CHAT_SETTINGS: 'proximity_chat_settings',
  USER_LOCATION: 'user_location',
  REGION_HISTORY: 'region_entry_history',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to chat server',
  LOCATION_UNAVAILABLE: 'Unable to determine your location',
  PERMISSION_DENIED: 'Location permission denied',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  HISTORY_LOAD_FAILED: 'Failed to load message history',
};

/**
 * UI constants
 */
export const UI = {
  // Default radius for proximity chat (meters)
  DEFAULT_PROXIMITY_RADIUS: 150,

  // Maximum radius for proximity chat (meters)
  MAX_PROXIMITY_RADIUS: 500,

  // Minimum radius for proximity chat (meters)
  MIN_PROXIMITY_RADIUS: 50,

  // Maximum message length
  MAX_MESSAGE_LENGTH: 500,

  // Placeholder for message input
  MESSAGE_PLACEHOLDER: 'Type a message to people nearby...',

  // Maximum visible typing indicators
  MAX_VISIBLE_TYPING: 3,

  // Default message colors (can be overridden by user settings)
  COLORS: {
    SELF: '#0084ff',
    OTHER: '#f1f0f0',
    SYSTEM: '#f8f8f8',
  },
};

/**
 * Feature flags
 */
export const FEATURES = {
  // Master toggle for the entire proximity chat feature
  PROXIMITY_CHAT_ENABLED: true,

  // Controls whether the feature is visible in the UI
  PROXIMITY_CHAT_UI_VISIBLE: true,

  // Controls whether analytics are collected for the feature
  PROXIMITY_CHAT_ANALYTICS_ENABLED: false,

  // Whether to enable typing indicators
  TYPING_INDICATORS: true,

  // Whether to enable read receipts
  READ_RECEIPTS: true,

  // Whether to enable message reactions
  MESSAGE_REACTIONS: true,

  // Whether to enable message threads
  MESSAGE_THREADS: false,

  // Whether to enable user profiles
  USER_PROFILES: true,
};

/**
 * Integration settings
 */
export const INTEGRATION = {
  // Controls how the feature integrates with main app
  ISOLATED_MODE: true,

  // Controls whether to use dedicated API endpoints
  USE_DEDICATED_API: true,

  // Error handling strategy
  ERROR_HANDLING: 'silent', // 'silent', 'log', 'alert'

  // Controls whether errors in this feature can affect parent app
  PREVENT_ERROR_PROPAGATION: true,
};

/**
 * Configuration defaults
 */
export const CONFIG = {
  // Default distance units
  DISTANCE_UNIT: 'meters', // 'meters' or 'feet'

  // Default notification settings
  NOTIFICATIONS: {
    PROXIMITY_ALERTS: true,
    MESSAGE_NOTIFICATIONS: true,
    SOUND_ENABLED: true,
  },
};

/**
 * Action types for context reducer
 */
export const ACTIONS = {
  SET_CONNECTED: 'SET_CONNECTED',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_NEARBY_USERS: 'SET_NEARBY_USERS',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_USER_TYPING: 'SET_USER_TYPING',
  SET_CHAT_SETTINGS: 'SET_CHAT_SETTINGS',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

/**
 * System message templates
 */
export const SYSTEM_MESSAGES = {
  USER_JOINED: username => `${username} has joined the chat`,
  USER_LEFT: username => `${username} has left the chat`,
  ENTERED_REGION: regionName => `You have entered ${regionName}`,
  LEFT_REGION: regionName => `You have left ${regionName}`,
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  CONNECTION_RESTORED: 'Connection restored',
};
