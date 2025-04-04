/**
 * Timezone Display Utilities for MeetNow
 *
 * These utilities are for DISPLAY purposes only - they handle converting UTC timestamps
 * stored in the database to local time for display in the UI based on meetup location.
 *
 * The database stores:
 * - All timestamps in UTC
 * - Duration in minutes
 * - Actual geocoded addresses
 *
 * This utility helps with displaying those timestamps in the correct local time
 * based on the geographic coordinates of the meetup.
 */

// Timezone utility functions for MeetNow
// This file provides functions for handling timezone conversions

/**
 * Get the timezone string from latitude and longitude coordinates
 * Falls back to America/Los_Angeles (Pacific Time) if coordinates are invalid
 * or the location is not recognized
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - IANA timezone string (e.g. "America/Los_Angeles")
 */
export function getTimezoneFromCoordinates(lat, lng) {
  // Default to Pacific Time if coordinates are invalid
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.log('Invalid coordinates, defaulting to Pacific Time');
    return 'America/Los_Angeles';
  }

  // Log for debugging
  console.log(`Getting timezone for coordinates: ${lat}, ${lng}`);

  try {
    // West Coast US (Pacific Time)
    if (lng < -115 && lat > 32 && lat < 49) {
      return 'America/Los_Angeles';
    }

    // Mountain Time
    if (lng < -102 && lng >= -115 && lat > 31 && lat < 49) {
      return 'America/Denver';
    }

    // Central Time
    if (lng < -87 && lng >= -102 && lat > 25 && lat < 49) {
      return 'America/Chicago';
    }

    // Eastern Time
    if (lng < -67 && lng >= -87 && lat > 24 && lat < 49) {
      return 'America/New_York';
    }

    // Mexico regions
    if (lat > 14 && lat < 33 && lng > -120 && lng < -86) {
      // Northern Mexico (Tijuana, etc)
      if (lat > 27 && lng < -113) {
        return 'America/Tijuana';
      }

      // Northwestern Mexico
      if (lat > 25 && lng < -105) {
        return 'America/Mazatlan';
      }

      // Northeastern Mexico
      if (lat > 25 && lng >= -105) {
        return 'America/Monterrey';
      }

      // Central Mexico (including Mexico City)
      if (lat > 17 && lat <= 25) {
        return 'America/Mexico_City';
      }

      // Southern Mexico
      if (lat <= 17) {
        return 'America/Mexico_City';
      }
    }

    // Default to Pacific Time if no match
    console.log('Location not matched to a timezone, defaulting to Pacific Time');
    return 'America/Los_Angeles';
  } catch (error) {
    console.error('Error determining timezone:', error);
    return 'America/Los_Angeles';
  }
}

/**
 * Format a timestamp in a specific timezone
 *
 * @param {string} timestamp - ISO timestamp string
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Formatted date/time string
 */
export function formatLocalTime(timestamp, timezone) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);

    // Format options
    const options = {
      timeZone: timezone || 'America/Los_Angeles',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    // Fallback to basic formatting
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Format a meetup time based on its location
 *
 * @param {string} timestamp - ISO timestamp string
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Formatted date/time string in local timezone
 */
export function formatMeetupTime(timestamp, lat, lng) {
  if (!timestamp) return '';

  // Get the timezone for the coordinates
  const timezone = getTimezoneFromCoordinates(lat, lng);

  // Format the time in that timezone
  return formatLocalTime(timestamp, timezone);
}

/**
 * Calculate the expiry time based on start time and duration
 *
 * @param {string} startTime - ISO timestamp string for start time
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Formatted expiry time string
 */
export function calculateExpiryTime(startTime, durationMinutes, lat, lng) {
  if (!startTime || !durationMinutes) return '';

  try {
    // Parse the start time
    const startDate = new Date(startTime);

    // Add the duration
    const expiryDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // Format with the location's timezone
    return formatMeetupTime(expiryDate.toISOString(), lat, lng);
  } catch (error) {
    console.error('Error calculating expiry time:', error);
    return '';
  }
}

// Export for use in components
export default {
  formatMeetupTime,
  calculateExpiryTime,
  getTimezoneFromCoordinates,
};
