import supabase from '../supabase';

import { refreshTokenIfNeeded } from './auth';
import { createSecurityError, createAuthError, handleError } from './error-handler';
import logger from './Logger';
import { validateInput, sanitizeForDatabase, isSecureEnvironment } from './security';

/**
 * Secure API Client
 * Provides a security boundary around database operations
 */

// Type definitions
export interface IApiConfig {
  requestTimeout: number;
  maxRetries: number;
  enforceHttps: boolean;
  enforceAuthentication: boolean;
  logRequests: boolean;
  validateResponses: boolean;
  allowedTables: string[];
  secureOperations: string[];
  readOperations: string[];
}

export interface IOperationOptions {
  filters?: {
    eq?: Record<string, unknown>;
    order?: {
      column: string;
      ascending: boolean;
    };
    limit?: number;
    range?: [number, number];
  };
  returning?: string;
  single?: boolean;
}

export interface IMeetupData {
  location: {
    lat: number;
    lng: number;
  };
  title?: string;
  description?: string | null;
  address?: string | null;
  image_url?: string | null;
  starts_at?: string;
  expires_at?: string;
  is_free_meetup?: boolean;
  status?: string;
}

export interface IApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// Configuration for API client
const API_CONFIG: ApiConfig = {
  requestTimeout: 15000, // 15 seconds
  maxRetries: 3,
  enforceHttps: true,
  enforceAuthentication: true,
  logRequests: true,
  validateResponses: true,
  allowedTables: ['meetups', 'profiles', 'participants'],
  secureOperations: ['insert', 'update', 'delete', 'rpc'],
  readOperations: ['select'],
};

/**
 * Execute a database operation with security checks
 */
export const secureDbOperation = async <T>(
  table: string,
  operation: string,
  data: Record<string, unknown> = {},
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  try {
    // Check for secure environment when performing sensitive operations
    if (API_CONFIG.enforceHttps && API_CONFIG.secureOperations.includes(operation)) {
      if (!isSecureEnvironment()) {
        const error = createSecurityError('Operation requires a secure connection');
        logger.error('Security', 'Attempted insecure operation', { table, operation });
        throw error;
      }
    }

    // Validate table access
    if (!API_CONFIG.allowedTables.includes(table)) {
      const error = createSecurityError(`Access to table '${table}' is not allowed`);
      logger.error('Security', 'Attempted access to unauthorized table', { table });
      throw error;
    }

    // For secure operations, refresh token if needed
    if (API_CONFIG.enforceAuthentication && API_CONFIG.secureOperations.includes(operation)) {
      await refreshTokenIfNeeded();
    }

    // Sanitize and validate input data
    let sanitizedData = data;
    if (data && typeof data === 'object') {
      if (operation === 'insert' || operation === 'update') {
        sanitizedData = validateInput(data) as Record<string, unknown>;
      } else if (operation === 'rpc') {
        // For RPC calls, sanitize all string parameters
        sanitizedData = Object.entries(data).reduce(
          (acc, [key, value]) => {
            acc[key] = typeof value === 'string' ? sanitizeForDatabase(value) : value;
            return acc;
          },
          {} as Record<string, unknown>
        );
      }
    }

    // Log the request if configured
    if (API_CONFIG.logRequests) {
      logger.debug('API', 'Secure API request', {
        table,
        operation,
        dataKeys: Object.keys(sanitizedData),
      });
    }

    // Execute the operation with timeout
    const result = await Promise.race([
      executeOperation<T>(table, operation, sanitizedData, options),
      new Promise<ApiResponse<T>>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Database operation timed out after ${API_CONFIG.requestTimeout}ms`));
        }, API_CONFIG.requestTimeout);
      }),
    ]);

    // Validate response if configured
    if (API_CONFIG.validateResponses && result) {
      if (result.error) {
        logger.error('API', 'Database operation error', {
          message: result.error.message,
          code: (result.error as any).code,
          details: (result.error as any).details,
          table,
          operation,
        });

        // Handle authentication errors
        if (
          (result.error as any).code === 'PGRST301' ||
          (result.error as any).message?.includes('JWT')
        ) {
          throw createAuthError('Authentication error during database operation', {
            originalError: result.error,
          });
        }

        throw result.error;
      }
    }

    return result;
  } catch (error) {
    logger.error('API', 'Error in secure database operation', {
      error: error instanceof Error ? error.message : String(error),
      table,
      operation,
    });

    // Pass to error handler
    handleError(error);
    throw error;
  }
};

/**
 * Execute the actual database operation
 * @private
 */
const executeOperation = async <T>(
  table: string,
  operation: string,
  data: Record<string, unknown>,
  options: OperationOptions
): Promise<ApiResponse<T>> => {
  const { filters = {}, returning = '*', single = false } = options;

  // Build query based on operation
  let query = supabase.from(table) as any;

  if (operation === 'select') {
    query = query.select(returning);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'eq' && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, val]) => {
          query = query.eq(field, val);
        });
      } else if (key === 'order' && value) {
        const orderValue = value as { column: string; ascending: boolean };
        query = query.order(orderValue.column, { ascending: orderValue.ascending });
      } else if (key === 'limit' && value) {
        query = query.limit(value as number);
      } else if (key === 'range' && Array.isArray(value) && value.length === 2) {
        query = query.range(value[0], value[1]);
      }
    });

    if (single) {
      query = query.single();
    }
  } else if (operation === 'insert') {
    query = query.insert(data);
    if (returning) query = query.select(returning);
    if (single) query = query.single();
  } else if (operation === 'update') {
    query = query.update(data);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'eq' && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, val]) => {
          query = query.eq(field, val);
        });
      }
    });

    if (returning) query = query.select(returning);
    if (single) query = query.single();
  } else if (operation === 'delete') {
    query = query.delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'eq' && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, val]) => {
          query = query.eq(field, val);
        });
      }
    });

    if (returning) query = query.select(returning);
  } else if (operation === 'rpc') {
    // For RPC, the table parameter is actually the function name
    return await supabase.rpc(table, data);
  }

  return await query;
};

/**
 * Secure methods for common operations
 */

export const secureSelect = async <T>(
  table: string,
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  return secureDbOperation<T>(table, 'select', {}, options);
};

export const secureInsert = async <T>(
  table: string,
  data: Record<string, unknown>,
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  return secureDbOperation<T>(table, 'insert', data, options);
};

export const secureUpdate = async <T>(
  table: string,
  data: Record<string, unknown>,
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  return secureDbOperation<T>(table, 'update', data, options);
};

export const secureDelete = async <T>(
  table: string,
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  return secureDbOperation<T>(table, 'delete', {}, options);
};

export const secureRpc = async <T>(
  functionName: string,
  params: Record<string, unknown> = {},
  options: OperationOptions = {}
): Promise<ApiResponse<T>> => {
  return secureDbOperation<T>(functionName, 'rpc', params, options);
};

/**
 * Get a user's profile securely
 */
export const getUserProfile = async (userId: string): Promise<Record<string, unknown>> => {
  if (!userId) {
    const error = createAuthError('User ID is required');
    throw error;
  }

  const { data, error } = await secureSelect('profiles', {
    filters: {
      eq: { id: userId },
    },
    single: true,
  });

  if (error) throw error;
  return data as Record<string, unknown>;
};

/**
 * Get nearby meetups securely
 */
export const getNearbyMeetups = async (
  latitude: number,
  longitude: number,
  radius = 5000
): Promise<{ success: boolean; meetups: MeetupData[] }> => {
  try {
    const { data, error } = await secureRpc<MeetupData[]>('get_nearby_meetups', {
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius_meters: radius.toString(),
    });

    if (error) throw error;
    return { success: true, meetups: data ?? [] };
  } catch (error) {
    logger.error('API', 'Error getting nearby meetups', {
      error: error instanceof Error ? error.message : String(error),
      latitude,
      longitude,
      radius,
    });
    return { success: false, meetups: [] };
  }
};

/**
 * Create a new meetup securely
 */
export const createMeetup = async (meetupData: MeetupData): Promise<MeetupData> => {
  if (!meetupData.location.lat ?? !meetupData.location.lng) {
    throw createSecurityError('Meetup location is required');
  }

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const data = {
    location: {
      type: 'Point',
      coordinates: [meetupData.location.lng, meetupData.location.lat],
    },
    title: meetupData.title ?? 'Instant Meetup',
    description: meetupData.description || null,
    address: meetupData.address || null,
    image_url: meetupData.image_url || null,
    starts_at: meetupData.starts_at || now.toISOString(),
    expires_at: meetupData.expires_at || oneHourLater.toISOString(),
    is_free_meetup: meetupData.is_free_meetup !== undefined ? meetupData.is_free_meetup : true,
    status: meetupData.status || 'active',
  };

  const { data: meetup, error } = await secureInsert<MeetupData>('meetups', data, { single: true });

  if (error) throw error;
  return meetup as MeetupData;
};
