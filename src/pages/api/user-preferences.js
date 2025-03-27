/**
 * API route for saving user preferences, including selected locations
 */

// Simulated user database - in a real app this would be persisted to a database
let userPreferences = {};

export default async function handler(req, res) {
  // Get user ID from authentication (simulated here)
  const userId = req.headers['x-user-id'] || 'anonymous';
  
  switch (req.method) {
    case 'GET':
      return handleGetPreferences(req, res, userId);
    case 'POST':
      return handleSavePreferences(req, res, userId);
    case 'DELETE':
      return handleDeletePreference(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle GET request to retrieve user preferences
 */
async function handleGetPreferences(req, res, userId) {
  try {
    // Return the user's preferences or an empty object if none exist
    const preferences = userPreferences[userId] || { 
      locations: [],
      recentSearches: []
    };
    
    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return res.status(500).json({ error: 'Failed to retrieve user preferences' });
  }
}

/**
 * Handle POST request to save user preferences
 */
async function handleSavePreferences(req, res, userId) {
  try {
    const { location, type = 'selected' } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location data is required' });
    }
    
    // Initialize user preferences if they don't exist
    if (!userPreferences[userId]) {
      userPreferences[userId] = {
        locations: [],
        recentSearches: []
      };
    }
    
    const prefs = userPreferences[userId];
    
    // Add timestamp to the location
    const locationWithTimestamp = {
      ...location,
      timestamp: new Date().toISOString(),
      type
    };
    
    // Handle different types of location preferences
    if (type === 'recent') {
      // Add to recent searches (limited to 5)
      prefs.recentSearches = [
        locationWithTimestamp,
        ...prefs.recentSearches.filter(item => 
          item.place_id !== location.place_id
        )
      ].slice(0, 5);
    } else {
      // Add to saved locations (max 10)
      // First remove if already exists to avoid duplicates
      prefs.locations = prefs.locations.filter(item => 
        item.place_id !== location.place_id
      );
      
      // Then add to the beginning of the array
      prefs.locations = [
        locationWithTimestamp, 
        ...prefs.locations
      ].slice(0, 10);
    }
    
    // Save updated preferences and return them
    userPreferences[userId] = prefs;
    
    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: prefs
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return res.status(500).json({ error: 'Failed to save user preferences' });
  }
}

/**
 * Handle DELETE request to remove a preference
 */
async function handleDeletePreference(req, res, userId) {
  try {
    const { location, type = 'saved' } = req.body;
    
    if (!location || !location.place_id) {
      return res.status(400).json({ error: 'Valid location data is required' });
    }
    
    // Check if user preferences exist
    if (!userPreferences[userId]) {
      return res.status(404).json({ error: 'User preferences not found' });
    }
    
    const prefs = userPreferences[userId];
    
    // Remove from the appropriate list based on type
    if (type === 'recent') {
      prefs.recentSearches = prefs.recentSearches.filter(item => 
        item.place_id !== location.place_id
      );
    } else {
      prefs.locations = prefs.locations.filter(item => 
        item.place_id !== location.place_id
      );
    }
    
    // Save updated preferences and return them
    userPreferences[userId] = prefs;
    
    return res.status(200).json({
      success: true,
      message: 'Preference removed successfully',
      preferences: prefs
    });
  } catch (error) {
    console.error('Error removing user preference:', error);
    return res.status(500).json({ error: 'Failed to remove user preference' });
  }
} 