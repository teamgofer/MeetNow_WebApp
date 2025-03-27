/**
 * Feature flags to control component extraction and feature rollout
 * 
 * In development, these can be overridden using localStorage:
 * localStorage.setItem('feature_USE_EXTRACTED_NEARBY_MEETUPS', 'true')
 */

// Default feature flag values
export const FEATURE_FLAGS = {
  // Component extraction flags
  USE_EXTRACTED_NEARBY_MEETUPS: true,
  USE_EXTRACTED_MEETUP_DETAILS: false,
  USE_EXTRACTED_CREATE_MEETUP: false,
  USE_EXTRACTED_USER_PROFILE: false,
  USE_EXTRACTED_MAP_COMPONENT: false,
  USE_EXTRACTED_BOTTOM_SHEET: false,
  USE_EXTRACTED_SEARCH_FILTER: false,
  USE_EXTRACTED_AUTH_MODAL: false,
  USE_EXTRACTED_DISTANCE_SLIDER: true,
  USE_EXTRACTED_CATEGORY_FILTER: true,
  USE_EXTRACTED_TIME_FILTER: true,
  
  // State management flags
  USE_COMPONENT_STATE_CONTEXT: true,
  ENABLE_STATE_LOGGING: process.env.NODE_ENV === 'development',
  
  // Safety features
  ENABLE_ERROR_BOUNDARIES: true,
  ENABLE_COMPONENT_REGISTRY: true,
  
  // Development features
  SHOW_EXTRACTION_INDICATORS: process.env.NODE_ENV === 'development',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  
  // Performance features
  USE_OPTIMIZED_RENDERING: true,
  ENABLE_COMPONENT_MEMOIZATION: true,
  USE_OPTIMIZED_IMAGES: true,
  ENABLE_CODE_SPLITTING: true,
  ENABLE_PERFORMANCE_TRACKING: true
};

/**
 * Check if a feature flag is enabled
 * In development, allows override via localStorage
 * @param {string} flag - The feature flag name
 * @returns {boolean} - Whether the feature is enabled
 */
export const isFeatureEnabled = (flag) => {
  // In development, check localStorage for override
  if (process.env.NODE_ENV === 'development') {
    const localStorageOverride = localStorage.getItem(`feature_${flag}`);
    if (localStorageOverride === 'true' || localStorageOverride === 'false') {
      return localStorageOverride === 'true';
    }
  }
  
  // Return the default value
  return FEATURE_FLAGS[flag];
};

/**
 * Enable a feature flag
 * @param {string} flag - The feature flag name
 */
export const enableFeature = (flag) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(`feature_${flag}`, 'true');
  }
};

/**
 * Disable a feature flag
 * @param {string} flag - The feature flag name
 */
export const disableFeature = (flag) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(`feature_${flag}`, 'false');
  }
};

/**
 * Reset a feature flag to its default value
 * @param {string} flag - The feature flag name
 */
export const resetFeature = (flag) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.removeItem(`feature_${flag}`);
  }
};

/**
 * FeatureFlag component for conditional rendering
 * @param {Object} props - Component props
 * @param {string} props.flag - The feature flag name
 * @param {React.ReactNode} props.children - Content to render when flag is enabled
 * @param {React.ReactNode} props.fallback - Content to render when flag is disabled
 */
export const FeatureFlag = ({ flag, children, fallback = null }) => {
  return isFeatureEnabled(flag) ? children : fallback;
};

// Export a list of all available feature flags
export const getAllFeatureFlags = () => Object.keys(FEATURE_FLAGS); 