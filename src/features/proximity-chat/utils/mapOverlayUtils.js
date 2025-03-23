/**
 * Map Overlay Utilities
 * 
 * Provides utilities for managing map overlays for proximity chat features
 * including hotspots, bubbles, and user markers
 */
import { calculateDistance } from './locationUtils';

// Default settings for map elements
const DEFAULT_SETTINGS = {
  hotspotRadius: 50, // meters
  userMarkerRadius: 5, // pixels
  chatBubbleMaxSize: 60, // pixels
  clusterThreshold: 25, // meters
  heatmapIntensityFactor: 0.8
};

/**
 * Calculate the size of a chat bubble based on activity level
 * 
 * @param {Object} chatActivity - Object containing activity metrics
 * @param {number} chatActivity.messageCount - Number of messages
 * @param {number} chatActivity.uniqueUsers - Number of unique users
 * @param {number} chatActivity.recentActivity - Activity score (0-1)
 * @param {Object} options - Sizing options
 * @param {number} options.minSize - Minimum size in pixels
 * @param {number} options.maxSize - Maximum size in pixels
 * @returns {number} - Size in pixels
 */
export const calculateChatBubbleSize = (chatActivity, options = {}) => {
  const { 
    messageCount = 0, 
    uniqueUsers = 0, 
    recentActivity = 0 
  } = chatActivity || {};
  
  const {
    minSize = 20,
    maxSize = DEFAULT_SETTINGS.chatBubbleMaxSize
  } = options;
  
  // Weight factors for different activity metrics
  const messageWeight = 0.4;
  const userWeight = 0.4;
  const recencyWeight = 0.2;
  
  // Normalize message count (cap at 50 for max size)
  const normalizedMessages = Math.min(messageCount / 50, 1);
  
  // Normalize user count (cap at 10 for max size)
  const normalizedUsers = Math.min(uniqueUsers / 10, 1);
  
  // Calculate weighted activity score
  const activityScore = 
    (normalizedMessages * messageWeight) +
    (normalizedUsers * userWeight) +
    (recentActivity * recencyWeight);
  
  // Convert score to size between min and max
  return minSize + (activityScore * (maxSize - minSize));
};

/**
 * Group nearby locations into clusters
 * 
 * @param {Array} locations - Array of location objects with lat/lng
 * @param {number} threshold - Distance threshold in meters for clustering
 * @returns {Array} - Array of cluster objects with centerpoint and members
 */
export const clusterLocations = (locations, threshold = DEFAULT_SETTINGS.clusterThreshold) => {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  const clusters = [];
  const processed = new Set();
  
  locations.forEach((location, index) => {
    if (processed.has(index)) return;
    
    // Start a new cluster with this location
    const cluster = {
      center: { ...location },
      members: [{ ...location, index }],
      totalWeight: location.weight || 1
    };
    
    processed.add(index);
    
    // Find all nearby locations for this cluster
    locations.forEach((otherLocation, otherIndex) => {
      if (processed.has(otherIndex)) return;
      
      const distance = calculateDistance(location, otherLocation);
      
      if (distance <= threshold) {
        cluster.members.push({ ...otherLocation, index: otherIndex });
        processed.add(otherIndex);
        
        // Update the weighted center point
        const weight = otherLocation.weight || 1;
        cluster.totalWeight += weight;
        
        cluster.center.latitude = 
          (cluster.center.latitude * (cluster.totalWeight - weight) + 
           otherLocation.latitude * weight) / cluster.totalWeight;
           
        cluster.center.longitude = 
          (cluster.center.longitude * (cluster.totalWeight - weight) + 
           otherLocation.longitude * weight) / cluster.totalWeight;
      }
    });
    
    clusters.push(cluster);
  });
  
  return clusters;
};

/**
 * Generate heatmap data for chat activity
 * 
 * @param {Array} chatHotspots - Array of chat hotspot locations with activity
 * @param {Object} options - Heatmap generation options
 * @returns {Array} - Array of heatmap points formatted for heatmap libraries
 */
export const generateHeatmapData = (chatHotspots, options = {}) => {
  if (!Array.isArray(chatHotspots)) {
    return [];
  }
  
  const {
    intensityFactor = DEFAULT_SETTINGS.heatmapIntensityFactor,
    includeUsers = true,
    userIntensityFactor = 0.5,
    maxIntensity = 1.0
  } = options;
  
  return chatHotspots.map(hotspot => {
    // Calculate intensity based on activity and user count
    let intensity = 0;
    
    if (hotspot.messageCount) {
      intensity += Math.min(hotspot.messageCount / 50, 1) * intensityFactor;
    }
    
    if (includeUsers && hotspot.userCount) {
      intensity += Math.min(hotspot.userCount / 10, 1) * userIntensityFactor;
    }
    
    // Cap at max intensity
    intensity = Math.min(intensity, maxIntensity);
    
    return {
      lat: hotspot.latitude,
      lng: hotspot.longitude,
      intensity: Math.max(0.1, intensity) // Minimum intensity for visibility
    };
  });
};

/**
 * Find active chat areas based on message and user density
 * 
 * @param {Array} messages - Array of messages with location data
 * @param {Array} users - Array of users with location data
 * @param {Object} options - Processing options
 * @returns {Array} - Array of hotspot objects with activity data
 */
export const identifyChatHotspots = (messages, users, options = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  
  const {
    clusterRadius = DEFAULT_SETTINGS.clusterThreshold,
    timeWindowMinutes = 30,
    minimumMessageCount = 3
  } = options;
  
  // Extract message locations
  const messageLocations = messages
    .filter(msg => msg.location)
    .map(msg => ({
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
      timestamp: msg.timestamp,
      messageId: msg.id,
      senderId: msg.senderId
    }));
  
  // Group by proximity
  const locationClusters = clusterLocations(messageLocations, clusterRadius);
  
  // Calculate time threshold for recent activity
  const timeThreshold = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));
  
  // Process clusters into hotspots
  return locationClusters
    .map(cluster => {
      // Count unique users in this cluster
      const uniqueUsers = new Set(cluster.members.map(m => m.senderId));
      
      // Count recent messages
      const recentMessages = cluster.members.filter(
        m => new Date(m.timestamp) >= timeThreshold
      );
      
      // Find any active users in this area
      const nearbyUsers = users.filter(user => 
        user.location && 
        calculateDistance(user.location, cluster.center) <= clusterRadius
      );
      
      return {
        latitude: cluster.center.latitude,
        longitude: cluster.center.longitude,
        messageCount: cluster.members.length,
        uniqueUserCount: uniqueUsers.size,
        recentMessageCount: recentMessages.length,
        activeUserCount: nearbyUsers.length,
        recentActivity: recentMessages.length / Math.max(cluster.members.length, 1),
        radius: clusterRadius,
        users: nearbyUsers
      };
    })
    .filter(hotspot => hotspot.messageCount >= minimumMessageCount);
};

/**
 * Get user marker configuration based on privacy settings
 * 
 * @param {Object} user - User object
 * @param {Object} privacySettings - User's privacy settings
 * @returns {Object} - Marker configuration for the user
 */
export const getUserMarkerConfig = (user, privacySettings = {}) => {
  if (!user || !user.location) {
    return null;
  }
  
  const { 
    anonymousMode = false,
    locationPrecision = 'exact', // 'exact', 'approximate', 'area'
    showUsername = true,
    showAvatar = true
  } = privacySettings;
  
  // Create basic marker config
  const markerConfig = {
    id: user.id,
    isCurrentUser: user.isCurrentUser || false,
    location: { ...user.location }
  };
  
  if (anonymousMode) {
    // Anonymous mode - only show location with no identifying info
    return {
      ...markerConfig,
      anonymous: true,
      showLabel: false
    };
  }
  
  // Apply location precision settings
  if (locationPrecision === 'approximate') {
    // Add a small random offset (±20m)
    const randomOffset = () => (Math.random() - 0.5) * 0.0004; // ~20m at equator
    markerConfig.location.latitude += randomOffset();
    markerConfig.location.longitude += randomOffset();
    markerConfig.approximateLocation = true;
  } else if (locationPrecision === 'area') {
    // Snap to a grid of approximately 100m
    const gridSize = 0.001; // ~100m at equator
    markerConfig.location.latitude = Math.round(markerConfig.location.latitude / gridSize) * gridSize;
    markerConfig.location.longitude = Math.round(markerConfig.location.longitude / gridSize) * gridSize;
    markerConfig.approximateLocation = true;
  }
  
  // Add user details if allowed
  if (showUsername) {
    markerConfig.username = user.username;
    markerConfig.showLabel = true;
  }
  
  if (showAvatar) {
    markerConfig.avatar = user.avatar;
  }

  return markerConfig;
};

/**
 * Generate map bounds that include all points with padding
 * 
 * @param {Array} points - Array of location objects with lat/lng
 * @param {number} paddingPercent - Padding percentage around points
 * @returns {Object} - Bounds object with ne and sw properties
 */
export const calculateMapBounds = (points, paddingPercent = 10) => {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }
  
  // Initialize with first point
  let minLat = points[0].latitude || points[0].lat;
  let maxLat = minLat;
  let minLng = points[0].longitude || points[0].lng;
  let maxLng = minLng;
  
  // Find min/max coordinates
  points.forEach(point => {
    const lat = point.latitude || point.lat;
    const lng = point.longitude || point.lng;
    
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  // Add padding
  const latPadding = ((maxLat - minLat) * paddingPercent) / 100;
  const lngPadding = ((maxLng - minLng) * paddingPercent) / 100;
  
  return {
    ne: { lat: maxLat + latPadding, lng: maxLng + lngPadding },
    sw: { lat: minLat - latPadding, lng: minLng - lngPadding }
  };
}; 