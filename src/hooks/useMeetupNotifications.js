import { useState, useCallback, useEffect } from 'react';

import logger from '../utils/Logger';

const useMeetupNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
      logger.info('Notifications fetched successfully', {
        total: data.length,
        unread: data.filter(n => !n.read).length,
      });
      return data;
    } catch (err) {
      setError(err.message);
      logger.error('Failed to fetch notifications', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async notificationId => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      logger.info('Notification marked as read', { notificationId });
    } catch (err) {
      logger.error('Failed to mark notification as read', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      logger.info('All notifications marked as read');
    } catch (err) {
      logger.error('Failed to mark all notifications as read', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async notificationId => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      logger.info('Notification deleted', { notificationId });
    } catch (err) {
      logger.error('Failed to delete notification', err);
      throw err;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear all notifications');
      }

      setNotifications([]);
      setUnreadCount(0);
      logger.info('All notifications cleared');
    } catch (err) {
      logger.error('Failed to clear all notifications', err);
      throw err;
    }
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };
};

export default useMeetupNotifications;
