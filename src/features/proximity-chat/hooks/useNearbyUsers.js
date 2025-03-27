/**
 * Custom hook for managing nearby users based on proximity
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { isLocationWithinRadius, calculateDistance } from '../utils/locationUtils';
import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';

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

  const renderStartTimeRef = useRef(Date.now());

  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useNearbyUsers', renderDuration, {
      success: true,
      action: 'initialize',
      hasLocation: !!userLocation,
      customRadius: customRadiusKm,
      totalUsers: Object.keys(nearbyUsers).length
    });
    
    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [userLocation, customRadiusKm, nearbyUsers]);

  // Memoize the list of nearby users filtered by distance
  const users = useMemo(() => {
    const startTime = Date.now();
    
    try {
      // If no user location, return empty array
      if (!userLocation) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useNearbyUsers', duration, {
          success: true,
          action: 'filterUsers',
          error: 'No user location available',
          filteredCount: 0
        });
        return [];
      }

      // Determine which radius to use (custom or from settings)
      const proximityRadius = customRadiusKm || chatSettings.proximityRadius;
      
      // Filter and process users
      const filteredUsers = Object.values(nearbyUsers)
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

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useNearbyUsers', duration, {
        success: true,
        action: 'filterUsers',
        totalUsers: Object.keys(nearbyUsers).length,
        filteredCount: filteredUsers.length,
        radius: proximityRadius
      });

      return filteredUsers;
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useNearbyUsers', duration, {
        success: false,
        action: 'filterUsers',
        error: error.message,
        totalUsers: Object.keys(nearbyUsers).length
      });
      console.error('Error filtering nearby users:', error);
      return [];
    }
  }, [nearbyUsers, currentUserId, userLocation, chatSettings.proximityRadius, customRadiusKm]);

  // Track user count changes
  useEffect(() => {
    const startTime = Date.now();
    
    PerformanceMonitor.trackOperationTiming('hook', 'useNearbyUsers', 0, {
      success: true,
      action: 'userCountUpdate',
      totalUsers: Object.keys(nearbyUsers).length,
      nearbyUsers: users.length,
      hasLocation: !!userLocation
    });
  }, [users.length, nearbyUsers, userLocation]);

  // Return filtered users and metadata
  return {
    users,
    userCount: users.length,
    isLoading: !userLocation, // Consider loading if we don't have user location yet
    radiusKm: customRadiusKm || chatSettings.proximityRadius
  };
};

export default useNearbyUsers; 