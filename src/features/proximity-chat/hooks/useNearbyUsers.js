/**
 * Custom hook for managing nearby users based on proximity
 */

import { useState, useEffect, useMemo } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { isLocationWithinRadius, calculateDistance } from '../utils/locationUtils';

/**
 * Hook to get users within a specific proximity radius
 * 
 * @param {number} [customRadiusKm] - Optional custom radius in kilometers (overrides context settings)
 * @returns {Object} Object containing nearby users array and related data
 */
const useNearbyUsers = (customRadiusKm) => {
  const {
    nearbyUsers,
    currentUserId,
    userLocation,
    chatSettings,
  } = useProximityChatContext();

  // Memoize the list of nearby users filtered by distance
  const users = useMemo(() => {
    // If no user location, return empty array
    if (!userLocation) {
      return [];
    }

    try {
      // Determine which radius to use (custom or from settings)
      const proximityRadius = customRadiusKm || chatSettings.proximityRadius;
      
      // Filter and process users
      return Object.values(nearbyUsers)
        // Filter out the current user
        .filter(user => user.id !== currentUserId)
        // Filter out users without location
        .filter(user => user.location)
        // Filter by distance
        .filter(user => isLocationWithinRadius(
          user.location,
          userLocation,
          proximityRadius
        ))
        // Add distance property
        .map(user => ({
          ...user,
          distance: calculateDistance(userLocation, user.location)
        }))
        // Sort by distance (closest first)
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } catch (error) {
      console.error('Error filtering nearby users:', error);
      return [];
    }
  }, [nearbyUsers, currentUserId, userLocation, chatSettings.proximityRadius, customRadiusKm]);

  // Return filtered users and metadata
  return {
    users,
    userCount: users.length,
    isLoading: !userLocation, // Consider loading if we don't have user location yet
    radiusKm: customRadiusKm || chatSettings.proximityRadius
  };
};

export default useNearbyUsers; 