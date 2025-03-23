import { useState, useEffect, useCallback } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';

/**
 * Custom hook for managing proximity chat settings
 * 
 * This hook provides a simplified interface for reading and updating
 * proximity chat settings with persistence.
 * 
 * @returns {Object} Settings data and methods for updating settings
 */
const useProximityChatSettings = () => {
  const { chatSettings, updateChatSettings } = useProximityChatContext();
  
  // Default settings
  const defaultSettings = {
    radiusMeters: 100,
    notificationsEnabled: true,
    anonymousMode: false,
    mutedUsers: []
  };
  
  // Combine default settings with actual settings
  const settings = {
    ...defaultSettings,
    ...chatSettings
  };
  
  /**
   * Updates a single setting
   * 
   * @param {string} key - The setting key to update
   * @param {any} value - The new value
   */
  const updateSetting = useCallback((key, value) => {
    updateChatSettings({ [key]: value });
  }, [updateChatSettings]);
  
  /**
   * Toggles a boolean setting
   * 
   * @param {string} key - The setting key to toggle
   */
  const toggleSetting = useCallback((key) => {
    const currentValue = settings[key];
    if (typeof currentValue === 'boolean') {
      updateChatSettings({ [key]: !currentValue });
    } else {
      console.warn(`Cannot toggle non-boolean setting: ${key}`);
    }
  }, [settings, updateChatSettings]);
  
  /**
   * Updates the chat radius
   * 
   * @param {number} meters - New radius in meters
   */
  const setRadius = useCallback((meters) => {
    // Ensure radius is within allowed range
    const validRadius = Math.max(50, Math.min(200, meters));
    updateChatSettings({ radiusMeters: validRadius });
  }, [updateChatSettings]);
  
  /**
   * Toggles anonymous mode
   */
  const toggleAnonymousMode = useCallback(() => {
    toggleSetting('anonymousMode');
  }, [toggleSetting]);
  
  /**
   * Toggles notifications
   */
  const toggleNotifications = useCallback(() => {
    toggleSetting('notificationsEnabled');
  }, [toggleSetting]);
  
  /**
   * Mutes a user
   * 
   * @param {string} userId - ID of user to mute
   */
  const muteUser = useCallback((userId) => {
    if (!userId) return;
    
    const mutedUsers = [...(settings.mutedUsers || [])];
    if (!mutedUsers.includes(userId)) {
      mutedUsers.push(userId);
      updateChatSettings({ mutedUsers });
    }
  }, [settings.mutedUsers, updateChatSettings]);
  
  /**
   * Unmutes a user
   * 
   * @param {string} userId - ID of user to unmute
   */
  const unmuteUser = useCallback((userId) => {
    if (!userId) return;
    
    const mutedUsers = [...(settings.mutedUsers || [])];
    const index = mutedUsers.indexOf(userId);
    if (index !== -1) {
      mutedUsers.splice(index, 1);
      updateChatSettings({ mutedUsers });
    }
  }, [settings.mutedUsers, updateChatSettings]);
  
  /**
   * Checks if a user is muted
   * 
   * @param {string} userId - ID of user to check
   * @returns {boolean} Whether the user is muted
   */
  const isUserMuted = useCallback((userId) => {
    return settings.mutedUsers?.includes(userId) || false;
  }, [settings.mutedUsers]);
  
  /**
   * Resets all settings to defaults
   */
  const resetToDefaults = useCallback(() => {
    updateChatSettings(defaultSettings);
  }, [updateChatSettings]);
  
  return {
    // Settings values
    radius: settings.radiusMeters,
    notificationsEnabled: settings.notificationsEnabled,
    anonymousMode: settings.anonymousMode,
    mutedUsers: settings.mutedUsers || [],
    
    // Methods
    updateSetting,
    toggleSetting,
    setRadius,
    toggleAnonymousMode,
    toggleNotifications,
    muteUser,
    unmuteUser,
    isUserMuted,
    resetToDefaults
  };
};

export default useProximityChatSettings; 