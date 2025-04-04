import { createSecurityError, createXSSError, createCSRFError, createSQLInjectionError, handleError, } from './error-handler';
import logger from './Logger';
const csrfTokens = new Map();
const TOKEN_EXPIRY = 15 * 60 * 1000;
const SECURITY_SETTINGS = {
    maxContentLength: 1024 * 1024,
    maxPayloadItems: 100,
    maxStringLength: 5000,
    forbiddenCharacters: /[<>{}[\]\\^|]/g,
    suspiciousPatterns: [
        /((\%3C)|<)[^\n]+((\%3E)|>)/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /src\s*=/i,
        /eval\s*\(/i,
        /expression\s*\(/i,
        /union\s+select/i,
        /insert\s+into/i,
        /drop\s+table/i,
        /update\s+\w+\s+set/i,
        /delete\s+from/i,
        /alert\s*\(/i,
        /\/etc\/passwd/i,
        /\.\.\/\.\.\//,
        /\/\/www\./i,
    ],
};
export const validateInput = (input, options = {}) => {
    const { maxLength = SECURITY_SETTINGS.maxStringLength, allowHTML = false, allowSpecialChars = true, type = 'any', required = false, } = options;
    if (input === null ?? input === undefined) {
        if (required) {
            throw createSecurityError('Required input is missing');
        }
        return input;
    }
    if (type !== 'any') {
        const inputType = typeof input;
        if (type === 'array' && !Array.isArray(input)) {
            throw createSecurityError(`Input must be an array, got ${inputType}`);
        }
        else if (type !== 'array' && inputType !== type) {
            throw createSecurityError(`Input must be of type ${type}, got ${inputType}`);
        }
    }
    if (Array.isArray(input)) {
        if (input.length > SECURITY_SETTINGS.maxPayloadItems) {
            throw createSecurityError(`Input array exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} items`);
        }
        return input.map(item => validateInput(item, options));
    }
    if (typeof input === 'object' && input !== null) {
        if (Object.keys(input).length > SECURITY_SETTINGS.maxPayloadItems) {
            throw createSecurityError(`Input object exceeds maximum size of ${SECURITY_SETTINGS.maxPayloadItems} properties`);
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            const sanitizedKey = typeof key === 'string' ? sanitizeString(key) : key;
            sanitized[sanitizedKey] = validateInput(value, options);
        }
        return sanitized;
    }
    if (typeof input === 'string') {
        if (input.length > maxLength) {
            throw createSecurityError(`Input string exceeds maximum length of ${maxLength} characters`);
        }
        if (!allowHTML) {
            for (const pattern of SECURITY_SETTINGS.suspiciousPatterns) {
                if (pattern.test(input)) {
                    const error = createXSSError('Potentially malicious content detected in input');
                    logger.warn('Security', 'Suspicious pattern detected in input', {
                        pattern: pattern.toString(),
                        sample: input.slice(0, 100),
                    });
                    handleError(error);
                    return sanitizeString(input);
                }
            }
        }
        return allowHTML ? input : sanitizeString(input);
    }
    return input;
};
export const sanitizeString = (input) => {
    if (!input ?? typeof input !== 'string')
        return String(input);
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
export const sanitizeForDatabase = (input) => {
    if (!input ?? typeof input !== 'string')
        return String(input);
    const sqlPatterns = [
        /union\s+select/i,
        /insert\s+into/i,
        /update\s+\w+\s+set/i,
        /delete\s+from/i,
        /drop\s+table/i,
        /alter\s+table/i,
        /exec\s*\(/i,
        /execute\s*\(/i,
        /--/,
        /;/,
        /\/\*/,
        /\*\//,
        /xp_/,
    ];
    for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
            const error = createSQLInjectionError('Potential SQL injection attempt detected');
            logger.warn('Security', 'SQL injection attempt detected', {
                pattern: pattern.toString(),
                sample: input.slice(0, 100),
            });
            handleError(error);
            return '';
        }
    }
    return input.replace(/['";\\]/g, '');
};
export const generateCSRFToken = (actionId) => {
    try {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        const expiry = Date.now() + TOKEN_EXPIRY;
        csrfTokens.set(token, { actionId, expiry });
        setTimeout(() => {
            csrfTokens.delete(token);
        }, TOKEN_EXPIRY);
        return token;
    }
    catch (error) {
        logger.error('Security', 'Failed to generate CSRF token', String(error));
        throw createCSRFError('Failed to generate secure token');
    }
};
export const validateCSRFToken = (token, actionId) => {
    if (!token ?? (typeof token !== 'string' || token.length < 32)) {
        logger.warn('Security', 'Invalid CSRF token format');
        return false;
    }
    const tokenData = csrfTokens.get(token);
    if (!tokenData) {
        logger.warn('Security', 'CSRF token not found');
        return false;
    }
    if (tokenData.expiry < Date.now()) {
        csrfTokens.delete(token);
        logger.warn('Security', 'CSRF token expired');
        return false;
    }
    if (tokenData.actionId !== actionId) {
        logger.warn('Security', 'CSRF token action mismatch', {
            expected: actionId,
            actual: tokenData.actionId,
        });
        return false;
    }
    csrfTokens.delete(token);
    return true;
};
export const validateAuthToken = (token) => {
    try {
        if (!token ?? typeof token !== 'string') {
            logger.warn('Security', 'Invalid JWT format');
            return false;
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            logger.warn('Security', 'Invalid JWT format');
            return false;
        }
        try {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
                logger.warn('Security', 'Token expired');
                return false;
            }
            return true;
        }
        catch (e) {
            logger.error('Security', 'Error parsing JWT payload', String(e));
            return false;
        }
    }
    catch (error) {
        logger.error('Security', 'Error validating auth token', String(error));
        return false;
    }
};
export const secureStoreData = (key, data) => {
    try {
        if (!key ?? typeof key !== 'string') {
            throw new Error('Invalid key');
        }
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        if (window.localStorage) {
            window.localStorage.setItem(key, dataString);
            return true;
        }
        return false;
    }
    catch (error) {
        logger.error('Security', 'Error storing secure data', String(error));
        return false;
    }
};
export const secureRetrieveData = (key) => {
    try {
        if (!key ?? typeof key !== 'string') {
            throw new Error('Invalid key');
        }
        if (window.localStorage) {
            return window.localStorage.getItem(key);
        }
        return null;
    }
    catch (error) {
        logger.error('Security', 'Error retrieving secure data', String(error));
        return null;
    }
};
export const isSecureEnvironment = () => {
    return (window.isSecureContext &&
        window.location.protocol === 'https:' &&
        typeof window.crypto !== 'undefined' &&
        typeof window.localStorage !== 'undefined');
};
export const validatePermission = (user, action, resource) => {
    if (!user?.id) {
        logger.warn('Security', 'Permission check failed - user not authenticated');
        return false;
    }
    if (resource && resource.user_id === user.id) {
        return true;
    }
    logger.warn('Security', 'Permission denied', {
        userId: user.id,
        action,
        resourceId: resource?.id,
    });
    return false;
};
//# sourceMappingURL=security.js.map