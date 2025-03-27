/**
 * @typedef {Object} Meetup
 * @property {string} id - Unique identifier for the meetup
 * @property {string} title - Title of the meetup
 * @property {string} description - Description of the meetup
 * @property {string} location - Location description
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {string} date - ISO string of the meetup date
 * @property {string} time - Start time of the meetup
 * @property {string} duration - Duration of the meetup
 * @property {string} imageUrl - URL to the meetup image
 * @property {string[]} categories - Array of category ids
 * @property {string} creatorId - User ID of the creator
 * @property {number} attendeeCount - Number of attendees
 * @property {boolean} isAttending - Whether the current user is attending
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier for the user
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {string} [imageUrl] - URL to the user's profile image
 * @property {string} [bio] - User's biography
 * @property {string[]} [interests] - Array of interest ids
 * @property {string} createdAt - ISO string of account creation date
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Unique identifier for the category
 * @property {string} name - Display name of the category
 * @property {string} [iconName] - Name of the icon to use
 * @property {string} [color] - Color code for the category
 */

/**
 * @typedef {Object} LocationCoords
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {number} [accuracy] - Accuracy of the coordinates in meters
 */

/**
 * @typedef {Object} FilterState
 * @property {number} distance - Maximum distance in kilometers
 * @property {string[]} categories - Array of selected category ids
 * @property {string} timeFrame - Selected time frame (today, week, month, all)
 * @property {string} [searchTerm] - Optional search term
 */

/**
 * @typedef {Object} ComponentState
 * @property {Object} meetups - State related to meetups
 * @property {Object} user - State related to the current user
 * @property {Object} ui - State related to UI components
 * @property {Object} filters - Filter state for searches
 */

/**
 * @typedef {Object} PerformanceMetric
 * @property {string} componentId - ID of the component being measured
 * @property {string} operation - Type of operation (render, mount, unmount)
 * @property {number} duration - Duration in milliseconds
 * @property {number} timestamp - Unix timestamp when the metric was recorded
 * @property {Object} [metadata] - Additional metadata about the operation
 */

/**
 * @typedef {Object} FeatureFlag
 * @property {string} name - Name of the feature flag
 * @property {boolean} enabled - Whether the feature is enabled by default
 * @property {string} [description] - Description of what the feature flag controls
 * @property {string} [category] - Category of the feature flag (e.g., "extraction", "performance")
 */

// Export empty object for module systems
export {}; 