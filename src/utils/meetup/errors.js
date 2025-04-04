export const ERROR_CATEGORIES = {
    VALIDATION: 'validation',
    NETWORK: 'network',
    STORAGE: 'storage',
    DATABASE: 'database',
    UNKNOWN: 'unknown',
};
export const handleMeetupError = (error, operation) => {
    let category = ERROR_CATEGORIES.UNKNOWN;
    if (error.message.includes('validation')) {
        category = ERROR_CATEGORIES.VALIDATION;
    }
    else if (error.message.includes('network') || error.message.includes('fetch')) {
        category = ERROR_CATEGORIES.NETWORK;
    }
    else if (error.message.includes('storage') || error.message.includes('upload')) {
        category = ERROR_CATEGORIES.STORAGE;
    }
    else if (error.message.includes('database') || error.message.includes('supabase')) {
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
//# sourceMappingURL=errors.js.map