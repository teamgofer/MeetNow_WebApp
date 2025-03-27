import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/Logger';

const useMeetups = () => {
  const [meetups, setMeetups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeetup, setSelectedMeetup] = useState(null);

  const fetchMeetups = useCallback(async (location) => {
    if (!location) {
      setError('Location is required to fetch meetups');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups?lat=${location.lat}&lng=${location.lng}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch meetups');
      }

      const data = await response.json();
      setMeetups(data);
      logger.info('Meetups fetched successfully', { count: data.length });
    } catch (err) {
      setError(err.message);
      logger.error('Failed to fetch meetups', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMeetup = useCallback(async (meetupData) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetupData),
      });

      if (!response.ok) {
        throw new Error('Failed to create meetup');
      }

      const newMeetup = await response.json();
      setMeetups(prev => [...prev, newMeetup]);
      logger.info('Meetup created successfully', newMeetup);
      return newMeetup;
    } catch (err) {
      logger.error('Failed to create meetup', err);
      throw err;
    }
  }, []);

  const updateMeetup = useCallback(async (meetupId, updates) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update meetup');
      }

      const updatedMeetup = await response.json();
      setMeetups(prev => 
        prev.map(meetup => 
          meetup.id === meetupId ? updatedMeetup : meetup
        )
      );
      logger.info('Meetup updated successfully', updatedMeetup);
      return updatedMeetup;
    } catch (err) {
      logger.error('Failed to update meetup', err);
      throw err;
    }
  }, []);

  const deleteMeetup = useCallback(async (meetupId) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meetup');
      }

      setMeetups(prev => prev.filter(meetup => meetup.id !== meetupId));
      logger.info('Meetup deleted successfully', { meetupId });
    } catch (err) {
      logger.error('Failed to delete meetup', err);
      throw err;
    }
  }, []);

  const selectMeetup = useCallback((meetup) => {
    setSelectedMeetup(meetup);
    logger.info('Meetup selected', meetup);
  }, []);

  const clearSelectedMeetup = useCallback(() => {
    setSelectedMeetup(null);
    logger.debug('Selected meetup cleared');
  }, []);

  return {
    meetups,
    isLoading,
    error,
    selectedMeetup,
    fetchMeetups,
    createMeetup,
    updateMeetup,
    deleteMeetup,
    selectMeetup,
    clearSelectedMeetup
  };
};

export default useMeetups; 
 
 
 
 
 