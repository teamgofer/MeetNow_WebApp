import type { MeetupError } from '../../types/meetup';

export const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  STORAGE: 'storage',
  DATABASE: 'database',
  UNKNOWN: 'unknown',
} as const;

export type TErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];

export const handleMeetupError = (error: Error, operation: string): MeetupError => {
  let category: ErrorCategory = ERROR_CATEGORIES.UNKNOWN;

  // Categorize the error
  if (error.message.includes('validation')) {
    category = ERROR_CATEGORIES.VALIDATION;
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    category = ERROR_CATEGORIES.NETWORK;
  } else if (error.message.includes('storage') || error.message.includes('upload')) {
    category = ERROR_CATEGORIES.STORAGE;
  } else if (error.message.includes('database') || error.message.includes('supabase')) {
    category = ERROR_CATEGORIES.DATABASE;
  }

  console.error(`Error during ${operation}:`, {
    category,
    error: error.message,
    timestamp: new Date().toISOString(),
  });

  return {
    success: false,
    error: error.message ?? `Failed to ${operation}`,
    category,
  };
};
