import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';

import { useProximityChatContext } from '../../context/ProximityChatContext';
import useNearbyUsers from '../../hooks/useNearbyUsers';
import { isLocationWithinRadius } from '../../utils/locationUtils';

// Mock dependencies
jest.mock('../../context/ProximityChatContext', () => ({
  useProximityChatContext: jest.fn(),
}));

jest.mock('../../utils/locationUtils', () => ({
  isLocationWithinRadius: jest.fn(),
  calculateDistance: jest.fn((loc1, loc2) => {
    // Simple mock implementation for testing purposes
    if (!loc1 || !loc2) return null;
    return 5; // Return fixed distance for testing
  }),
}));

describe('useNearbyUsers', () => {
  // Sample data for testing
  const mockNearbyUsers = [
    { id: 'user1', name: 'John', location: { latitude: 37.7749, longitude: -122.4194 } },
    { id: 'user2', name: 'Jane', location: { latitude: 37.775, longitude: -122.4195 } },
  ];

  const mockCurrentUser = {
    id: 'currentUser',
    name: 'Current User',
    location: { latitude: 37.7749, longitude: -122.4194 },
  };

  const mockContextState = {
    nearbyUsers: mockNearbyUsers,
    currentUserId: mockCurrentUser.id,
    userLocation: mockCurrentUser.location,
    chatSettings: { proximityRadius: 10 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for context
    useProximityChatContext.mockReturnValue(mockContextState);

    // Default mock implementation for location check
    isLocationWithinRadius.mockImplementation((loc1, loc2, radius) => {
      return true; // All users are nearby by default
    });
  });

  it('should return nearby users excluding current user', () => {
    const { result } = renderHook(() => useNearbyUsers());

    // Should have both nearby users
    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0].id).toBe('user1');
    expect(result.current.users[1].id).toBe('user2');
  });

  it('should filter users by distance based on proximity radius', () => {
    // Mock isLocationWithinRadius to return true only for user1
    isLocationWithinRadius.mockImplementation((loc1, loc2, radius) => {
      return loc1 && loc1 === mockNearbyUsers[0].location;
    });

    const { result } = renderHook(() => useNearbyUsers());

    // Should only include user1
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].id).toBe('user1');
  });

  it('should return empty array when no nearby users', () => {
    // Mock empty nearby users list
    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      nearbyUsers: [],
    });

    const { result } = renderHook(() => useNearbyUsers());

    expect(result.current.users).toEqual([]);
  });

  it('should handle missing current user location', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      userLocation: null,
    });

    const { result } = renderHook(() => useNearbyUsers());

    // Should return empty array when user location is not available
    expect(result.current.users).toEqual([]);
  });

  it('should handle missing user locations in nearby users', () => {
    // One user with valid location, one without
    const usersWithMissingLocation = [
      { id: 'user1', name: 'John', location: { latitude: 37.7749, longitude: -122.4194 } },
      { id: 'user2', name: 'Jane' }, // No location
    ];

    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      nearbyUsers: usersWithMissingLocation,
    });

    const { result } = renderHook(() => useNearbyUsers());

    // Should only include users with valid locations
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].id).toBe('user1');
  });

  it('should sort users by distance from current user', () => {
    // Mock calculateDistance to return different distances for testing sort
    const mockDistances = {
      user1: 10,
      user2: 5,
    };

    jest.mock('../../utils/locationUtils', () => ({
      ...jest.requireActual('../../utils/locationUtils'),
      calculateDistance: jest.fn((loc1, loc2) => {
        if (!loc1 || !loc2) return null;
        const userId = loc2 === mockNearbyUsers[0].location ? 'user1' : 'user2';
        return mockDistances[userId];
      }),
      isLocationWithinRadius: jest.requireActual('../../utils/locationUtils')
        .isLocationWithinRadius,
    }));

    // Force re-render with updated mocks
    const { result, rerender } = renderHook(() => useNearbyUsers());
    rerender();

    // User2 should be first (closer)
    expect(result.current.users[0].id).toBe('user2');
    expect(result.current.users[1].id).toBe('user1');
  });

  it('should use custom proximity radius when provided', () => {
    const customRadius = 20;

    const { result } = renderHook(() => useNearbyUsers(customRadius));

    // Check that isLocationWithinRadius was called with the custom radius
    expect(isLocationWithinRadius).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      customRadius
    );
  });

  it('should use proximity radius from chat settings when not provided', () => {
    const { result } = renderHook(() => useNearbyUsers());

    // Check that isLocationWithinRadius was called with the radius from settings
    expect(isLocationWithinRadius).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      mockContextState.chatSettings.proximityRadius
    );
  });

  it('should re-compute users when nearby users change', () => {
    const { result, rerender } = renderHook(() => useNearbyUsers());

    // Initial render
    expect(result.current.users).toHaveLength(2);

    // Update the nearby users list
    const updatedNearbyUsers = [
      { id: 'user3', name: 'Alice', location: { latitude: 37.7751, longitude: -122.4196 } },
    ];

    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      nearbyUsers: updatedNearbyUsers,
    });

    // Re-render
    rerender();

    // Should update with the new users
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].id).toBe('user3');
  });

  it('should re-compute users when user location changes', () => {
    const { result, rerender } = renderHook(() => useNearbyUsers());

    // Initial render
    expect(result.current.users).toHaveLength(2);

    // Update the user location
    const newLocation = { latitude: 40.7128, longitude: -74.006 }; // New York

    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      userLocation: newLocation,
    });

    // Re-render
    rerender();

    // isLocationWithinRadius should be called with the new location
    expect(isLocationWithinRadius).toHaveBeenCalledWith(
      expect.anything(),
      newLocation,
      expect.anything()
    );
  });

  it('should include distance information with each user', () => {
    const { result } = renderHook(() => useNearbyUsers());

    // Each user should have a distance property
    expect(result.current.users[0]).toHaveProperty('distance');
    expect(result.current.users[1]).toHaveProperty('distance');
    expect(result.current.users[0].distance).toBe(5); // From our mock implementation
  });

  it('should handle errors in location calculations', () => {
    // Mock an error in location calculations
    isLocationWithinRadius.mockImplementation(() => {
      throw new Error('Location calculation error');
    });

    // Should not throw but return empty array
    const { result } = renderHook(() => useNearbyUsers());

    expect(result.current.users).toEqual([]);
  });
});
