/**
 * Utility functions for formatting message data
 */

/**
 * Format date and time for display
 * @param {number|string|Date} timestamp - Timestamp to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for formatting (defaults to browser locale)
 * @param {boolean} options.includeSeconds - Whether to include seconds
 * @param {boolean} options.relative - Whether to use relative time format
 * @returns {string} Formatted date/time
 */
export const formatDate = (timestamp, options = {}) => {
  const { locale = navigator.language, includeSeconds = false, relative = false } = options;

  if (!timestamp) return '';

  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);

  // Return empty string for invalid dates
  if (isNaN(dateObj.getTime())) return '';

  // Use relative time if requested and supported
  if (relative) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = Math.floor((dateObj - now) / 1000);

    // Convert to appropriate units
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 604800) {
      return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
    }
  }

  // Format for today's dates (display only time)
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  if (isToday) {
    const timeOptions = {
      hour: 'numeric',
      minute: 'numeric',
      ...(includeSeconds ? { second: 'numeric' } : {}),
      hour12: true,
    };

    return new Intl.DateTimeFormat(locale, timeOptions).format(dateObj);
  }

  // Format for dates within the last week
  const isWithinWeek = now - dateObj < 604800000; // 7 days in milliseconds

  if (isWithinWeek) {
    const dayOptions = {
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, dayOptions).format(dateObj);
  }

  // Format for older dates
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, dateOptions).format(dateObj);
};

/**
 * Format distance for display with proper units
 * @param {number} distance - Distance in meters
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for number formatting
 * @param {number} options.precision - Number of decimal places
 * @param {boolean} options.useImperial - Whether to use imperial units (feet/miles)
 * @returns {string} Formatted distance with units
 */
export const formatDistance = (distance, options = {}) => {
  const { locale = navigator.language, precision = 1, useImperial = false } = options;

  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'Unknown distance';
  }

  // Format with appropriate units
  if (useImperial) {
    // Imperial units (feet/miles)
    const feet = distance * 3.28084;

    if (feet < 1000) {
      // Display in feet for shorter distances
      return `${Math.round(feet)} ft`;
    } else {
      // Display in miles for longer distances
      const miles = feet / 5280;
      const formatted = miles.toFixed(precision);
      return `${formatted} ${miles === 1 ? 'mile' : 'miles'}`;
    }
  } else {
    // Metric units (meters/kilometers)
    if (distance < 1000) {
      // Display in meters for shorter distances
      return `${Math.round(distance)} m`;
    } else {
      // Display in kilometers for longer distances
      const km = distance / 1000;
      const formatted = km.toFixed(precision);
      return `${formatted} ${km === 1 ? 'kilometer' : 'kilometers'}`;
    }
  }
};

/**
 * Format user name for display
 * @param {string} name - User name
 * @param {Object} options - Formatting options
 * @param {number} options.maxLength - Maximum name length before truncating
 * @param {boolean} options.shouldAnonymize - Whether to anonymize the name
 * @returns {string} Formatted name
 */
export const formatUserName = (name, options = {}) => {
  const { maxLength = 20, shouldAnonymize = false } = options;

  if (!name) return 'Anonymous User';

  if (shouldAnonymize) {
    // Return anonymous name with consistent initial for the same user
    const initial = name.charAt(0).toUpperCase();
    return `Anonymous ${initial}`;
  }

  // Truncate long names
  if (name.length > maxLength) {
    return `${name.substring(0, maxLength)}...`;
  }

  return name;
};

/**
 * Format time duration for display
 * @param {number} seconds - Duration in seconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.compact - Whether to use compact format
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds, options = {}) => {
  const { compact = false } = options;

  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (compact) {
    // Compact format (e.g., 1h 23m or 5m 30s)
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  } else {
    // Full format with proper pluralization
    const parts = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }

    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }

    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);

    return parts.join(', ');
  }
};

export default {
  formatDate,
  formatDistance,
  formatUserName,
  formatDuration,
};
