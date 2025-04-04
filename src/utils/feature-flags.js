const FEATURE_FLAGS_STORAGE_KEY = 'meetNowFeatureFlags';
const defaultFeatureFlags = {
    USE_ENHANCED_MEETUP_CARD: true,
    USE_UNIFIED_CARD: true,
    ENABLE_ANIMATIONS: true,
    VERBOSE_LOGGING: false,
    MOCK_API: false,
};
export const getFeatureFlags = () => {
    try {
        const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
        if (storedFlags) {
            return { ...defaultFeatureFlags, ...JSON.parse(storedFlags) };
        }
    }
    catch (error) {
        console.error('Error reading feature flags from localStorage:', error);
    }
    return defaultFeatureFlags;
};
export const getFeatureFlag = (flag) => {
    const flags = getFeatureFlags();
    return flags[flag];
};
export const setFeatureFlag = (flag, value) => {
    try {
        const currentFlags = getFeatureFlags();
        const updatedFlags = { ...currentFlags, [flag]: value };
        localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
    }
    catch (error) {
        console.error('Error storing feature flags to localStorage:', error);
    }
};
export const resetFeatureFlags = () => {
    try {
        localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(defaultFeatureFlags));
    }
    catch (error) {
        console.error('Error resetting feature flags in localStorage:', error);
    }
};
//# sourceMappingURL=feature-flags.js.map