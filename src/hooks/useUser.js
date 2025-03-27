import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/Logger';

const useUser = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
      logger.info('User data fetched successfully', userData);
    } catch (err) {
      setError(err.message);
      logger.error('Failed to fetch user data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      logger.info('User profile updated successfully', updatedUser);
      return updatedUser;
    } catch (err) {
      logger.error('Failed to update user profile', err);
      throw err;
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      logger.info('User logged in successfully', userData);
      return userData;
    } catch (err) {
      logger.error('Login failed', err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      logger.info('User logged out successfully');
    } catch (err) {
      logger.error('Logout failed', err);
      throw err;
    }
  }, []);

  const signup = useCallback(async (userData) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const newUser = await response.json();
      setUser(newUser);
      logger.info('User signed up successfully', newUser);
      return newUser;
    } catch (err) {
      logger.error('Signup failed', err);
      throw err;
    }
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    fetchUser,
    updateProfile,
    login,
    logout,
    signup
  };
};

export default useUser; 
 
 
 
 
 