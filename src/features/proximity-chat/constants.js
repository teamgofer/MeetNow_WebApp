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
  READ_RECEIPTS: 'proximityChat.readReceipts'
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
  UNBLOCK_USER: 'UNBLOCK_USER'
};

// Distance constants
export const distanceConstants = {
  DEFAULT_MAX_DISTANCE: 1000, // meters
  MIN_DISTANCE: 50, // meters
  MAX_DISTANCE: 5000, // meters
  DISTANCE_STEP: 50, // meters
  METERS_PER_DEGREE: 111139 // meters per degree of latitude/longitude (approximate at equator)
};

// Time constants
export const timeConstants = {
  MESSAGE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  LOCATION_UPDATE_INTERVAL: 30 * 1000, // 30 seconds in milliseconds
  TYPING_TIMEOUT: 5 * 1000 // 5 seconds in milliseconds
};

// UI constants
export const uiConstants = {
  MAX_MESSAGE_LENGTH: 500,
  DEFAULT_AVATAR_COLOR: '#3B82F6',
  ANIMATION_DURATION: 300 // milliseconds
}; 