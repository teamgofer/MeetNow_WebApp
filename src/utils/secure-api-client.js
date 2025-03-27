import supabase from '../supabase';
import logger from './Logger';
import { validateInput, sanitizeForDatabase, isSecureEnvironment } from './security';
import { 
  createSecurityError, 
  createAuthError, 
  handleError 
} from './error-handler';
import { refreshTokenIfNeeded } from './auth';

/**
 * Secure API Client
 * Provides a security boundary around database operations
 */

// Configuration for API client
const API_CONFIG = {
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
 * @param {string} table - The table to operate on
 * @param {string} operation - The operation to perform (select, insert, update, delete, rpc)
 * @param {Object} data - The data for the operation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The operation result
 */
export const secureDbOperation = async (table, operation, data = {}, options = {}) => {
  try {
    // Check for secure environment when performing sensitive operations
    if (API_CONFIG.enforceHttps && API_CONFIG.secureOperations.includes(operation)) {
      if (!isSecureEnvironment()) {
        const error = createSecurityError('Operation requires a secure connection');
        logger.error('Security: Attempted insecure operation', { table, operation });
        throw error;
      }
    }

    // Validate table access
    if (!API_CONFIG.allowedTables.includes(table)) {
      const error = createSecurityError(`Access to table '${table}' is not allowed`);
      logger.error('Security: Attempted access to unauthorized table', { table });
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
        sanitizedData = validateInput(data);
      } else if (operation === 'rpc') {
        // For RPC calls, sanitize all string parameters
        sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? sanitizeForDatabase(value) : value;
          return acc;
        }, {});
      }
    }
    
    // Log the request if configured
    if (API_CONFIG.logRequests) {
      logger.debug('Secure API request:', {
        table,
        operation,
        dataKeys: Object.keys(sanitizedData)
      });
    }
    
    // Execute the operation with timeout
    const result = await Promise.race([
      executeOperation(table, operation, sanitizedData, options),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Database operation timed out after ${API_CONFIG.requestTimeout}ms`));
        }, API_CONFIG.requestTimeout);
      })
    ]);
    
    // Validate response if configured
    if (API_CONFIG.validateResponses && result) {
      if (result.error) {
        logger.error('Database operation error:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          table,
          operation
        });
        
        // Handle authentication errors
        if (result.error.code === 'PGRST301' || result.error.message?.includes('JWT')) {
          throw createAuthError('Authentication error during database operation', { originalError: result.error });
        }
        
        throw result.error;
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Error in secure database operation:', {
      error: error.message,
      table,
      operation
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
const executeOperation = async (table, operation, data, options) => {
  const { filters = {}, returning = '*', single = false } = options;
  
  // Build query based on operation
  let query = supabase.from(table);
  
  if (operation === 'select') {
    query = query.select(returning);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'eq' && typeof value === 'object') {
        Object.entries(value).forEach(([field, val]) => {
          query = query.eq(field, val);
        });
      } else if (key === 'order' && value) {
        query = query.order(value.column, { ascending: value.ascending });
      } else if (key === 'limit' && value) {
        query = query.limit(value);
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
        Object.entries(value).forEach(([field, val]) => {
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
        Object.entries(value).forEach(([field, val]) => {
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

export const secureSelect = async (table, options = {}) => {
  return secureDbOperation(table, 'select', null, options);
};

export const secureInsert = async (table, data, options = {}) => {
  return secureDbOperation(table, 'insert', data, options);
};

export const secureUpdate = async (table, data, options = {}) => {
  return secureDbOperation(table, 'update', data, options);
};

export const secureDelete = async (table, options = {}) => {
  return secureDbOperation(table, 'delete', null, options);
};

export const secureRpc = async (functionName, params = {}, options = {}) => {
  return secureDbOperation(functionName, 'rpc', params, options);
};

/**
 * Get a user's profile securely
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The user profile
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    const error = createAuthError('User ID is required');
    throw error;
  }
  
  const { data, error } = await secureSelect('profiles', {
    filters: {
      eq: { id: userId }
    },
    single: true
  });
  
  if (error) throw error;
  return data;
};

/**
 * Get nearby meetups securely
 * @param {number} latitude - The latitude
 * @param {number} longitude - The longitude
 * @param {number} radius - The radius in meters
 * @returns {Promise<Array>} - The nearby meetups
 */
export const getNearbyMeetups = async (latitude, longitude, radius = 5000) => {
  // Validate coordinates
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid coordinates are required');
  }
  
  // Use RPC for spatial query
  const { data, error } = await secureRpc('get_nearby_meetups', {
    lat: parseFloat(latitude),
    lng: parseFloat(longitude),
    radius_meters: parseInt(radius)
  });
  
  if (error) throw error;
  return { success: true, meetups: data || [] };
};

/**
 * Create a new meetup securely
 * @param {Object} meetupData - The meetup data
 * @returns {Promise<Object>} - The created meetup
 */
export const createMeetup = async (meetupData) => {
  // Validate required fields
  if (!meetupData.location || !meetupData.location.lat || !meetupData.location.lng) {
    throw new Error('Valid location is required');
  }
  
  // Format location as GeoJSON Point
  const formattedLocation = {
    type: 'Point',
    coordinates: [meetupData.location.lng, meetupData.location.lat]
  };
  
  // Calculate starts_at and expires_at if not provided
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Prepare the meetup data
  const data = {
    title: meetupData.title || 'Instant Meetup',
    description: meetupData.description || null,
    location: formattedLocation,
    address: meetupData.address || null,
    image_url: meetupData.image_url || null,
    starts_at: meetupData.starts_at || now.toISOString(),
    expires_at: meetupData.expires_at || oneHourLater.toISOString(),
    is_free_meetup: meetupData.is_free_meetup !== undefined ? meetupData.is_free_meetup : true,
    status: meetupData.status || 'active'
  };
  
  const { data: meetup, error } = await secureInsert('meetups', data, { single: true });
  
  if (error) throw error;
  return { success: true, meetup };
};

// Export API configuration for use in other modules
export const apiConfig = API_CONFIG; 