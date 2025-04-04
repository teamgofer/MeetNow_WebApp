import { useState, useEffect, useCallback, useRef } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor.js';
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
  const renderStartTimeRef = useRef(Date.now());

  // Default settings
  const defaultSettings = {
    radiusMeters: 100,
    notificationsEnabled: true,
    anonymousMode: false,
    mutedUsers: [],
  };

  // Combine default settings with actual settings
  const settings = {
    ...defaultSettings,
    ...chatSettings,
  };

  // Track hook initialization performance
  useEffect(() => {
    const renderDuration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', renderDuration, {
      success: true,
      action: 'initialize',
      settingsCount: Object.keys(settings).length,
    });

    // Reset render start time for next update
    renderStartTimeRef.current = Date.now();
  }, [settings]);

  /**
   * Updates a single setting
   *
   * @param {string} key - The setting key to update
   * @param {any} value - The new value
   */
  const updateSetting = useCallback(
    (key, value) => {
      const startTime = Date.now();

      try {
        updateChatSettings({ [key]: value });

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: true,
          action: 'updateSetting',
          key,
          valueType: typeof value,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'updateSetting',
          key,
          error: error.message,
        });
        throw error;
      }
    },
    [updateChatSettings]
  );

  /**
   * Toggles a boolean setting
   *
   * @param {string} key - The setting key to toggle
   */
  const toggleSetting = useCallback(
    key => {
      const startTime = Date.now();

      try {
        const currentValue = settings[key];
        if (typeof currentValue === 'boolean') {
          updateChatSettings({ [key]: !currentValue });

          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
            success: true,
            action: 'toggleSetting',
            key,
            newValue: !currentValue,
          });
        } else {
          console.warn(`Cannot toggle non-boolean setting: ${key}`);

          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
            success: false,
            action: 'toggleSetting',
            key,
            error: 'Invalid setting type',
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'toggleSetting',
          key,
          error: error.message,
        });
        throw error;
      }
    },
    [settings, updateChatSettings]
  );

  /**
   * Updates the chat radius
   *
   * @param {number} meters - New radius in meters
   */
  const setRadius = useCallback(
    meters => {
      const startTime = Date.now();

      try {
        // Ensure radius is within allowed range
        const validRadius = Math.max(50, Math.min(200, meters));
        updateChatSettings({ radiusMeters: validRadius });

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: true,
          action: 'setRadius',
          meters,
          validRadius,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'setRadius',
          meters,
          error: error.message,
        });
        throw error;
      }
    },
    [updateChatSettings]
  );

  /**
   * Toggles anonymous mode
   */
  const toggleAnonymousMode = useCallback(() => {
    const startTime = Date.now();

    try {
      toggleSetting('anonymousMode');

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: true,
        action: 'toggleAnonymousMode',
        newValue: !settings.anonymousMode,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: false,
        action: 'toggleAnonymousMode',
        error: error.message,
      });
      throw error;
    }
  }, [toggleSetting, settings.anonymousMode]);

  /**
   * Toggles notifications
   */
  const toggleNotifications = useCallback(() => {
    const startTime = Date.now();

    try {
      toggleSetting('notificationsEnabled');

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: true,
        action: 'toggleNotifications',
        newValue: !settings.notificationsEnabled,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: false,
        action: 'toggleNotifications',
        error: error.message,
      });
      throw error;
    }
  }, [toggleSetting, settings.notificationsEnabled]);

  /**
   * Mutes a user
   *
   * @param {string} userId - ID of user to mute
   */
  const muteUser = useCallback(
    userId => {
      const startTime = Date.now();

      try {
        if (!userId) {
          throw new Error('User ID is required');
        }

        const mutedUsers = [...(settings.mutedUsers || [])];
        if (!mutedUsers.includes(userId)) {
          mutedUsers.push(userId);
          updateChatSettings({ mutedUsers });

          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
            success: true,
            action: 'muteUser',
            userId,
            mutedUsersCount: mutedUsers.length,
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'muteUser',
          userId,
          error: error.message,
        });
        throw error;
      }
    },
    [settings.mutedUsers, updateChatSettings]
  );

  /**
   * Unmutes a user
   *
   * @param {string} userId - ID of user to unmute
   */
  const unmuteUser = useCallback(
    userId => {
      const startTime = Date.now();

      try {
        if (!userId) {
          throw new Error('User ID is required');
        }

        const mutedUsers = [...(settings.mutedUsers || [])];
        const index = mutedUsers.indexOf(userId);
        if (index !== -1) {
          mutedUsers.splice(index, 1);
          updateChatSettings({ mutedUsers });

          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
            success: true,
            action: 'unmuteUser',
            userId,
            mutedUsersCount: mutedUsers.length,
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'unmuteUser',
          userId,
          error: error.message,
        });
        throw error;
      }
    },
    [settings.mutedUsers, updateChatSettings]
  );

  /**
   * Checks if a user is muted
   *
   * @param {string} userId - ID of user to check
   * @returns {boolean} Whether the user is muted
   */
  const isUserMuted = useCallback(
    userId => {
      const startTime = Date.now();

      try {
        const result = settings.mutedUsers.includes(userId) || false;

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: true,
          action: 'isUserMuted',
          userId,
          isMuted: result,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
          success: false,
          action: 'isUserMuted',
          userId,
          error: error.message,
        });
        throw error;
      }
    },
    [settings.mutedUsers]
  );

  /**
   * Resets all settings to defaults
   */
  const resetToDefaults = useCallback(() => {
    const startTime = Date.now();

    try {
      updateChatSettings(defaultSettings);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: true,
        action: 'resetToDefaults',
        settingsCount: Object.keys(defaultSettings).length,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('hook', 'useProximityChatSettings', duration, {
        success: false,
        action: 'resetToDefaults',
        error: error.message,
      });
      throw error;
    }
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
    resetToDefaults,
  };
};

export default useProximityChatSettings;
