// Environment configuration
export const isDevelopmentEnvironment = window.location.hostname === 'localhost' ||
                                     window.location.hostname === '127.0.0.1' ||
                                     window.location.hostname.includes('local');

// Other configuration values can be added here 