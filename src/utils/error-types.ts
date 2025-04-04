/**
 * Error types for application-wide consistent error handling
 */
export enum ErrorTypes {
  // System/Application errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Map-related errors
  MAP_INITIALIZATION_ERROR = 'MAP_INITIALIZATION_ERROR',
  GEOCODING_ERROR = 'GEOCODING_ERROR',
  LOCATION_ERROR = 'LOCATION_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',

  // Data processing errors
  PARSING_ERROR = 'PARSING_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',

  // Component errors
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',

  // Default/fallback
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  // Informational, doesn't affect functionality
  INFO = 'INFO',

  // Minor issues that don't prevent core functionality
  WARNING = 'WARNING',

  // Problems that affect some functionality but not critical paths
  ERROR = 'ERROR',

  // Critical errors that break core functionality
  CRITICAL = 'CRITICAL',
}

/**
 * Interface for structured application errors
 */
export interface IApplicationError extends Error {
  type: ErrorTypes;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp?: number;
  handled?: boolean;
}

/**
 * Recovery strategy types for the error handling service
 */
export enum RecoveryStrategyType {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  REDIRECT = 'REDIRECT',
  NOTIFY = 'NOTIFY',
  RESET = 'RESET',
}
