/**
 * Utility functions for date and time formatting in the proximity chat feature
 */

/**
 * Formats a date as a relative time string (e.g. "2m ago", "5h ago")
 * 
 * @param {Date|string|number} date - Date to format (Date object, ISO string, or timestamp)
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeAgo - Whether to include "ago" suffix
 * @param {boolean} options.short - Whether to use short format (e.g. "2m" vs "2 min")
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (date, options = {}) => {
  const { includeAgo = true, short = false } = options;
  
  // Handle different date input formats
  const dateObj = date instanceof Date 
    ? date 
    : typeof date === 'string' 
      ? new Date(date) 
      : new Date(date);
      
  const now = new Date();
  const diffMs = now - dateObj;
  
  // Invalid date
  if (isNaN(diffMs)) {
    return 'Invalid date';
  }
  
  // Future date
  if (diffMs < 0) {
    return formatFutureTime(dateObj, options);
  }
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  // Just now (less than 60 seconds ago)
  if (diffSec < 60) {
    return 'Just now';
  }
  
  // Minutes (less than 60 minutes ago)
  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    const unit = short ? 'm' : minutes === 1 ? 'minute' : 'minutes';
    return `${minutes}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
  }
  
  // Hours (less than 24 hours ago)
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    const unit = short ? 'h' : hours === 1 ? 'hour' : 'hours';
    return `${hours}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
  }
  
  // Days (less than 7 days ago)
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    const unit = short ? 'd' : days === 1 ? 'day' : 'days';
    return `${days}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
  }
  
  // Weeks (less than 4 weeks ago)
  if (diffSec < 2419200) {
    const weeks = Math.floor(diffSec / 604800);
    const unit = short ? 'w' : weeks === 1 ? 'week' : 'weeks';
    return `${weeks}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
  }
  
  // Months (less than 12 months ago)
  if (diffSec < 31536000) {
    const months = Math.floor(diffSec / 2592000);
    const unit = short ? 'mo' : months === 1 ? 'month' : 'months';
    return `${months}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
  }
  
  // Years
  const years = Math.floor(diffSec / 31536000);
  const unit = short ? 'y' : years === 1 ? 'year' : 'years';
  return `${years}${short ? '' : ' '}${unit}${includeAgo ? ' ago' : ''}`;
};

/**
 * Formats a future date as a relative time string (e.g. "in 2 min", "in 5h")
 * 
 * @param {Date} date - Future date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.short - Whether to use short format
 * @returns {string} Formatted relative future time string
 */
const formatFutureTime = (date, options = {}) => {
  const { short = false } = options;
  
  const now = new Date();
  const diffMs = date - now;
  const diffSec = Math.floor(diffMs / 1000);
  
  // Less than 60 seconds
  if (diffSec < 60) {
    return 'Just now';
  }
  
  // Minutes
  if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    const unit = short ? 'm' : minutes === 1 ? 'minute' : 'minutes';
    return `in ${minutes}${short ? '' : ' '}${unit}`;
  }
  
  // Hours
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    const unit = short ? 'h' : hours === 1 ? 'hour' : 'hours';
    return `in ${hours}${short ? '' : ' '}${unit}`;
  }
  
  // Days
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    const unit = short ? 'd' : days === 1 ? 'day' : 'days';
    return `in ${days}${short ? '' : ' '}${unit}`;
  }
  
  // Weeks
  if (diffSec < 2419200) {
    const weeks = Math.floor(diffSec / 604800);
    const unit = short ? 'w' : weeks === 1 ? 'week' : 'weeks';
    return `in ${weeks}${short ? '' : ' '}${unit}`;
  }
  
  // Months
  if (diffSec < 31536000) {
    const months = Math.floor(diffSec / 2592000);
    const unit = short ? 'mo' : months === 1 ? 'month' : 'months';
    return `in ${months}${short ? '' : ' '}${unit}`;
  }
  
  // Years
  const years = Math.floor(diffSec / 31536000);
  const unit = short ? 'y' : years === 1 ? 'year' : 'years';
  return `in ${years}${short ? '' : ' '}${unit}`;
};

/**
 * Formats a date as a time string (e.g. "3:45 PM")
 * 
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeSeconds - Whether to include seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (date, options = {}) => {
  const { includeSeconds = false } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  });
  
  return formatter.format(dateObj);
};

/**
 * Formats a date as a readable date string (e.g. "Jan 15, 2023")
 * 
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeYear - Whether to include the year
 * @param {boolean} options.includeWeekday - Whether to include the weekday
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const { includeYear = true, includeWeekday = false } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: includeWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined
  });
  
  return formatter.format(dateObj);
};

/**
 * Formats a date as a combined date and time string
 * 
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date/time';
  }
  
  // Check if date is today
  const isToday = new Date().toDateString() === dateObj.toDateString();
  
  if (isToday) {
    return `Today at ${formatTime(dateObj, options)}`;
  }
  
  // Check if date is yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === dateObj.toDateString();
  
  if (isYesterday) {
    return `Yesterday at ${formatTime(dateObj, options)}`;
  }
  
  // Default to date + time format
  return `${formatDate(dateObj, options)} at ${formatTime(dateObj, options)}`;
}; 