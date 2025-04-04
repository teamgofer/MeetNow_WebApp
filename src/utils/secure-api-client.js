import supabase from '../supabase';
import { refreshTokenIfNeeded } from './auth';
import { createSecurityError, createAuthError, handleError } from './error-handler';
import logger from './Logger';
import { validateInput, sanitizeForDatabase, isSecureEnvironment } from './security';
const API_CONFIG = {
    requestTimeout: 15000,
    maxRetries: 3,
    enforceHttps: true,
    enforceAuthentication: true,
    logRequests: true,
    validateResponses: true,
    allowedTables: ['meetups', 'profiles', 'participants'],
    secureOperations: ['insert', 'update', 'delete', 'rpc'],
    readOperations: ['select'],
};
export const secureDbOperation = async (table, operation, data = {}, options = {}) => {
    try {
        if (API_CONFIG.enforceHttps && API_CONFIG.secureOperations.includes(operation)) {
            if (!isSecureEnvironment()) {
                const error = createSecurityError('Operation requires a secure connection');
                logger.error('Security', 'Attempted insecure operation', { table, operation });
                throw error;
            }
        }
        if (!API_CONFIG.allowedTables.includes(table)) {
            const error = createSecurityError(`Access to table '${table}' is not allowed`);
            logger.error('Security', 'Attempted access to unauthorized table', { table });
            throw error;
        }
        if (API_CONFIG.enforceAuthentication && API_CONFIG.secureOperations.includes(operation)) {
            await refreshTokenIfNeeded();
        }
        let sanitizedData = data;
        if (data && typeof data === 'object') {
            if (operation === 'insert' || operation === 'update') {
                sanitizedData = validateInput(data);
            }
            else if (operation === 'rpc') {
                sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
                    acc[key] = typeof value === 'string' ? sanitizeForDatabase(value) : value;
                    return acc;
                }, {});
            }
        }
        if (API_CONFIG.logRequests) {
            logger.debug('API', 'Secure API request', {
                table,
                operation,
                dataKeys: Object.keys(sanitizedData),
            });
        }
        const result = await Promise.race([
            executeOperation(table, operation, sanitizedData, options),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Database operation timed out after ${API_CONFIG.requestTimeout}ms`));
                }, API_CONFIG.requestTimeout);
            }),
        ]);
        if (API_CONFIG.validateResponses && result) {
            if (result.error) {
                logger.error('API', 'Database operation error', {
                    message: result.error.message,
                    code: result.error.code,
                    details: result.error.details,
                    table,
                    operation,
                });
                if (result.error.code === 'PGRST301' ||
                    result.error.message?.includes('JWT')) {
                    throw createAuthError('Authentication error during database operation', {
                        originalError: result.error,
                    });
                }
                throw result.error;
            }
        }
        return result;
    }
    catch (error) {
        logger.error('API', 'Error in secure database operation', {
            error: error instanceof Error ? error.message : String(error),
            table,
            operation,
        });
        handleError(error);
        throw error;
    }
};
const executeOperation = async (table, operation, data, options) => {
    const { filters = {}, returning = '*', single = false } = options;
    let query = supabase.from(table);
    if (operation === 'select') {
        query = query.select(returning);
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'eq' && typeof value === 'object') {
                Object.entries(value).forEach(([field, val]) => {
                    query = query.eq(field, val);
                });
            }
            else if (key === 'order' && value) {
                const orderValue = value;
                query = query.order(orderValue.column, { ascending: orderValue.ascending });
            }
            else if (key === 'limit' && value) {
                query = query.limit(value);
            }
            else if (key === 'range' && Array.isArray(value) && value.length === 2) {
                query = query.range(value[0], value[1]);
            }
        });
        if (single) {
            query = query.single();
        }
    }
    else if (operation === 'insert') {
        query = query.insert(data);
        if (returning)
            query = query.select(returning);
        if (single)
            query = query.single();
    }
    else if (operation === 'update') {
        query = query.update(data);
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'eq' && typeof value === 'object') {
                Object.entries(value).forEach(([field, val]) => {
                    query = query.eq(field, val);
                });
            }
        });
        if (returning)
            query = query.select(returning);
        if (single)
            query = query.single();
    }
    else if (operation === 'delete') {
        query = query.delete();
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'eq' && typeof value === 'object') {
                Object.entries(value).forEach(([field, val]) => {
                    query = query.eq(field, val);
                });
            }
        });
        if (returning)
            query = query.select(returning);
    }
    else if (operation === 'rpc') {
        return await supabase.rpc(table, data);
    }
    return await query;
};
export const secureSelect = async (table, options = {}) => {
    return secureDbOperation(table, 'select', {}, options);
};
export const secureInsert = async (table, data, options = {}) => {
    return secureDbOperation(table, 'insert', data, options);
};
export const secureUpdate = async (table, data, options = {}) => {
    return secureDbOperation(table, 'update', data, options);
};
export const secureDelete = async (table, options = {}) => {
    return secureDbOperation(table, 'delete', {}, options);
};
export const secureRpc = async (functionName, params = {}, options = {}) => {
    return secureDbOperation(functionName, 'rpc', params, options);
};
export const getUserProfile = async (userId) => {
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
    if (error)
        throw error;
    return data;
};
export const getNearbyMeetups = async (latitude, longitude, radius = 5000) => {
    try {
        const { data, error } = await secureRpc('get_nearby_meetups', {
            lat: latitude.toString(),
            lng: longitude.toString(),
            radius_meters: radius.toString(),
        });
        if (error)
            throw error;
        return { success: true, meetups: data ?? [] };
    }
    catch (error) {
        logger.error('API', 'Error getting nearby meetups', {
            error: error instanceof Error ? error.message : String(error),
            latitude,
            longitude,
            radius,
        });
        return { success: false, meetups: [] };
    }
};
export const createMeetup = async (meetupData) => {
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
    const { data: meetup, error } = await secureInsert('meetups', data, { single: true });
    if (error)
        throw error;
    return meetup;
};
//# sourceMappingURL=secure-api-client.js.map