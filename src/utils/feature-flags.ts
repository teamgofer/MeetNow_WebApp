/**
 * Feature flags for the application
 * Centralized management of feature flags
 */

export interface FeatureFlags {
  // UI Component flags
  USE_ENHANCED_MEETUP_CARD: boolean; // Use the enhanced SelectedMeetupCard with location support
  USE_UNIFIED_CARD: boolean; // Use the new UnifiedMeetupCard component

  // Animation flags
  ENABLE_ANIMATIONS: boolean; // Enable/disable UI animations

  // Development flags
  VERBOSE_LOGGING: boolean; // Enable verbose console logging
  MOCK_API: boolean; // Use mock API data instead of real API calls
}

// Local storage key for persisted feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'meetNowFeatureFlags';

// Default feature flags configuration
const defaultFeatureFlags: FeatureFlags = {
  USE_ENHANCED_MEETUP_CARD: true,
  USE_UNIFIED_CARD: true,
  ENABLE_ANIMATIONS: true,
  VERBOSE_LOGGING: false,
  MOCK_API: false,
};

/**
 * Get all feature flags
 * Merges stored flags with defaults
 */
export const getFeatureFlags = (): FeatureFlags => {
  try {
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (storedFlags) {
      // Merge stored flags with defaults (in case new flags were added)
      return { ...defaultFeatureFlags, ...JSON.parse(storedFlags) };
    }
  } catch (error) {
    console.error('Error reading feature flags from localStorage:', error);
  }

  return defaultFeatureFlags;
};

/**
 * Get a specific feature flag
 * @param flag The flag name to get
 */
export const getFeatureFlag = <K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] => {
  const flags = getFeatureFlags();
  return flags[flag];
};

/**
 * Set a specific feature flag
 * @param flag The flag name to set
 * @param value The value to set
 */
export const setFeatureFlag = <K extends keyof FeatureFlags>(
  flag: K,
  value: FeatureFlags[K]
): void => {
  try {
    const currentFlags = getFeatureFlags();
    const updatedFlags = { ...currentFlags, [flag]: value };

    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
  } catch (error) {
    console.error('Error storing feature flags to localStorage:', error);
  }
};

/**
 * Reset all feature flags to defaults
 */
export const resetFeatureFlags = (): void => {
  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(defaultFeatureFlags));
  } catch (error) {
    console.error('Error resetting feature flags in localStorage:', error);
  }
};
