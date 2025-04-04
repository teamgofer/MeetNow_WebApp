import { useState, useCallback, useEffect } from 'react';

import logger from '../utils/Logger';

const useMeetupSettings = meetupId => {
  const [settings, setSettings] = useState({
    visibility: 'public',
    allowComments: true,
    allowSharing: true,
    notifications: {
      newParticipants: true,
      newMessages: true,
      updates: true,
    },
    moderation: {
      requireApproval: false,
      allowUserInvites: true,
      maxParticipants: 50,
    },
    privacy: {
      showParticipants: true,
      showLocation: true,
      showChat: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!meetupId) {
      setError('Meetup ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}/settings`);

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
      logger.info('Settings fetched successfully', {
        meetupId,
        settings: data,
      });
      return data;
    } catch (err) {
      setError(err.message);
      logger.error('Failed to fetch settings', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [meetupId]);

  const updateSettings = useCallback(
    async updates => {
      if (!meetupId) {
        setError('Meetup ID is required');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/meetups/${meetupId}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update settings');
        }

        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        logger.info('Settings updated successfully', {
          meetupId,
          updates,
          newSettings: updatedSettings,
        });
        return updatedSettings;
      } catch (err) {
        logger.error('Failed to update settings', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [meetupId]
  );

  const updateVisibility = useCallback(
    async visibility => {
      await updateSettings({ visibility });
    },
    [updateSettings]
  );

  const updateNotificationSettings = useCallback(
    async notifications => {
      await updateSettings({ notifications });
    },
    [updateSettings]
  );

  const updateModerationSettings = useCallback(
    async moderation => {
      await updateSettings({ moderation });
    },
    [updateSettings]
  );

  const updatePrivacySettings = useCallback(
    async privacy => {
      await updateSettings({ privacy });
    },
    [updateSettings]
  );

  const resetSettings = useCallback(async () => {
    const defaultSettings = {
      visibility: 'public',
      allowComments: true,
      allowSharing: true,
      notifications: {
        newParticipants: true,
        newMessages: true,
        updates: true,
      },
      moderation: {
        requireApproval: false,
        allowUserInvites: true,
        maxParticipants: 50,
      },
      privacy: {
        showParticipants: true,
        showLocation: true,
        showChat: true,
      },
    };

    await updateSettings(defaultSettings);
  }, [updateSettings]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    updateVisibility,
    updateNotificationSettings,
    updateModerationSettings,
    updatePrivacySettings,
    resetSettings,
  };
};

export default useMeetupSettings;
