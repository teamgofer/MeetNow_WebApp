export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

export interface IMeetupError {
  category: ErrorCategory;
  message: string;
  timestamp: string;
  originalError?: Error;
}

export const handleMeetupError = (error: Error, operation: string): IMeetupError => {
  let category = ErrorCategory.UNKNOWN;

  // Categorize the error
  if (error.message.includes('validation')) {
    category = ErrorCategory.VALIDATION;
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    category = ErrorCategory.NETWORK;
  } else if (error.message.includes('storage') || error.message.includes('upload')) {
    category = ErrorCategory.STORAGE;
  } else if (error.message.includes('database') || error.message.includes('supabase')) {
    category = ErrorCategory.DATABASE;
  }

  return {
    category,
    message: error.message ?? `Failed to ${operation}`,
    timestamp: new Date().toISOString(),
    originalError: error,
  };
};
