/**
 * Debounce function to limit how often a function can be called
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to invoke the function immediately
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout = null;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to limit
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
  let inThrottle = false;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Format a number with commas
 * 
 * @param {number} num - The number to format
 * @returns {string} - The formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a date to a human-readable string
 * 
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} - The formatted date string
 */
export function formatDate(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
}

/**
 * Generate a random ID
 * 
 * @param {number} length - The length of the ID
 * @returns {string} - The random ID
 */
export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Deep clone an object
 * 
 * @param {Object} obj - The object to clone
 * @returns {Object} - The cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if an object is empty
 * 
 * @param {Object|string|null|undefined} obj - The object to check
 * @returns {boolean} - Whether the object is empty
 */
export function isEmpty(obj) {
  return (
    obj === null ||
    obj === undefined ||
    (typeof obj === 'object' && Object.keys(obj).length === 0) ||
    (typeof obj === 'string' && obj.trim().length === 0)
  );
}

/**
 * Get a value from an object by path
 * 
 * @param {Object} obj - The object to get the value from
 * @param {string} path - The path to the value
 * @param {*} defaultValue - The default value to return if the path doesn't exist
 * @returns {*} - The value at the path or the default value
 */
export function getValueByPath(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
} 