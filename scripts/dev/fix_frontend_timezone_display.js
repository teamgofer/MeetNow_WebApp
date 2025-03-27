/**
 * Format a timestamp based on the meetup's geographic location
 * 
 * This helper ensures that meetup timestamps are displayed in the
 * timezone appropriate for the meetup's location, not the user's browser timezone
 */

// Helper function to get approximate timezone from coordinates
// This should match our server-side logic
function getTimezoneFromCoordinates(lat, lng) {
  // Mexico check
  if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
    // Determine region of Mexico
    if (lng < -105) return 'America/Tijuana'; // Western Mexico
    if (lng < -95) return 'America/Mexico_City'; // Central Mexico
    return 'America/Cancun'; // Eastern Mexico
  }
  
  // North America
  if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -65) {
    if (lng < -115) return 'America/Los_Angeles';
    if (lng < -100) return 'America/Denver';
    if (lng < -85) return 'America/Chicago';
    return 'America/New_York';
  }
  
  // Europe
  if (lat >= 35 && lat <= 60 && lng >= -10 && lng <= 30) {
    if (lng < 0) return 'America/London';
    if (lng < 15) return 'America/Berlin';
    return 'America/Kiev';
  }
  
  return 'UTC'; // Default
}

/**
 * Format a meetup timestamp according to the meetup's location
 * 
 * @param {string} timestamp - ISO timestamp string 
 * @param {number} lat - Latitude of the meetup
 * @param {number} lng - Longitude of the meetup
 * @param {object} options - Formatting options to pass to Intl.DateTimeFormat
 * @returns {string} - Formatted time string in the meetup's local timezone
 */
export function formatMeetupTime(timestamp, lat, lng, options = {}) {
  if (!timestamp) return 'Time unknown';
  
  // Default formatting options
  const defaultOptions = { 
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  // Combine default options with provided options
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    // Get the meetup's timezone based on its coordinates
    const timezone = getTimezoneFromCoordinates(lat, lng);
    
    // Add the timezone to formatting options
    formatOptions.timeZone = timezone;
    
    // Format the date using the derived timezone
    const dateFormatter = new Intl.DateTimeFormat('default', formatOptions);
    return dateFormatter.format(new Date(timestamp));
  } catch (error) {
    console.error('Error formatting meetup time:', error);
    
    // Fallback to basic formatting without timezone
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Calculate expiry time based on start time and duration
 * 
 * @param {string} startTime - ISO timestamp string of start time
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} lat - Latitude of the meetup
 * @param {number} lng - Longitude of the meetup
 * @returns {string} - Formatted expiry time in the meetup's timezone
 */
export function calculateExpiryTime(startTime, durationMinutes, lat, lng) {
  if (!startTime || !durationMinutes) return 'Expiry unknown';
  
  try {
    // Create date object from the start time
    const startDate = new Date(startTime);
    
    // Add duration minutes to get expiry time
    const expiryDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
    
    // Format the expiry time in the meetup's timezone
    return formatMeetupTime(expiryDate.toISOString(), lat, lng, {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error calculating expiry time:', error);
    return 'Expiry calculation error';
  }
}

// Export for use in components
export default {
  formatMeetupTime,
  calculateExpiryTime,
  getTimezoneFromCoordinates
}; 