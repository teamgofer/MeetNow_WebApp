export namespace localStorageKeys {
  let AUDIO_PREFERENCES: string;
  let CHAT_SETTINGS: string;
  let BLOCKED_USERS: string;
  let LAST_LOCATION: string;
  let ANONYMOUS_MODE: string;
  let READ_RECEIPTS: string;
}
export namespace wsMessageTypes {
  let CONNECT: string;
  let DISCONNECT: string;
  let LOCATION_UPDATE: string;
  let MESSAGE_SEND: string;
  let MESSAGE_RECEIVED: string;
  let USER_JOINED: string;
  let USER_LEFT: string;
  let TYPING_START: string;
  let TYPING_STOP: string;
  let ERROR: string;
  let READ_RECEIPT: string;
  let BLOCK_USER: string;
  let UNBLOCK_USER: string;
}
export namespace distanceConstants {
  let DEFAULT_MAX_DISTANCE: number;
  let MIN_DISTANCE: number;
  let MAX_DISTANCE: number;
  let DISTANCE_STEP: number;
  let METERS_PER_DEGREE: number;
}
export namespace timeConstants {
  let MESSAGE_EXPIRY: number;
  let LOCATION_UPDATE_INTERVAL: number;
  let TYPING_TIMEOUT: number;
}
export namespace uiConstants {
  let MAX_MESSAGE_LENGTH: number;
  let DEFAULT_AVATAR_COLOR: string;
  let ANIMATION_DURATION: number;
}
export namespace API_ENDPOINTS {
  let WEBSOCKET: string;
  let MESSAGES: string;
  let USERS: string;
  let SETTINGS: string;
  let AUTH_TOKEN: string;
}
export namespace TIMING {
  let LOCATION_UPDATE_INTERVAL_1: number;
  export { LOCATION_UPDATE_INTERVAL_1 as LOCATION_UPDATE_INTERVAL };
  export let RECONNECT_INTERVAL: number;
  let TYPING_TIMEOUT_1: number;
  export { TYPING_TIMEOUT_1 as TYPING_TIMEOUT };
  export let MESSAGE_POLLING_INTERVAL: number;
}
export namespace DEFAULTS {
  export let CHAT_RADIUS: number;
  export let MAX_CHAT_RADIUS: number;
  export let MESSAGE_HISTORY_LIMIT: number;
  let MAX_MESSAGE_LENGTH_1: number;
  export { MAX_MESSAGE_LENGTH_1 as MAX_MESSAGE_LENGTH };
  export let LOCATION_ACCURACY_THRESHOLD: number;
}
export namespace ERROR_MESSAGES {
  let LOCATION_PERMISSION_DENIED: string;
  let LOCATION_UNAVAILABLE: string;
  let CONNECTION_FAILED: string;
  let MESSAGE_SEND_FAILED: string;
  let INVALID_LOCATION: string;
  let UNAUTHORIZED: string;
}
export namespace EVENT_TYPES {
  export let MESSAGE: string;
  let LOCATION_UPDATE_1: string;
  export { LOCATION_UPDATE_1 as LOCATION_UPDATE };
  export let NEARBY_USERS: string;
  export let TYPING_STATUS: string;
  let USER_JOINED_1: string;
  export { USER_JOINED_1 as USER_JOINED };
  let USER_LEFT_1: string;
  export { USER_LEFT_1 as USER_LEFT };
  let ERROR_1: string;
  export { ERROR_1 as ERROR };
  export let CONNECTION_STATUS: string;
}
export namespace FEATURE_FLAGS {
  let ENABLE_TYPING_INDICATORS: boolean;
  let ENABLE_MESSAGE_REACTIONS: boolean;
  let ENABLE_READ_RECEIPTS: boolean;
  let ENABLE_OFFLINE_SUPPORT: boolean;
  let ENABLE_LOCATION_SHARING: boolean;
  let ENABLE_MESSAGE_REPORTING: boolean;
}
