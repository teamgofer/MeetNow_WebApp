import { useState, useCallback } from 'react';

import logger from '../utils/Logger';

const useMeetupSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    dateRange: 'all',
    maxDistance: 10, // in kilometers
    minParticipants: 2,
    maxParticipants: 50,
    tags: [],
  });

  const searchMeetups = useCallback(
    async (query, location) => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/meetups/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            location,
            filters,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to search meetups');
        }

        const data = await response.json();
        setSearchResults(data);
        logger.info('Meetups search completed', {
          query,
          location,
          filters,
          resultCount: data.length,
        });
        return data;
      } catch (err) {
        setError(err.message);
        logger.error('Meetups search failed', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    logger.debug('Search filters updated', newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      dateRange: 'all',
      maxDistance: 10,
      minParticipants: 2,
      maxParticipants: 50,
      tags: [],
    });
    logger.debug('Search filters cleared');
  }, []);

  const sortResults = useCallback(sortBy => {
    setSearchResults(prev => {
      const sorted = [...prev].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(a.startTime) - new Date(b.startTime);
          case 'distance':
            return a.distance - b.distance;
          case 'participants':
            return b.currentParticipants - a.currentParticipants;
          default:
            return 0;
        }
      });
      logger.debug('Search results sorted', { sortBy });
      return sorted;
    });
  }, []);

  const filterResults = useCallback(filterFn => {
    setSearchResults(prev => {
      const filtered = prev.filter(filterFn);
      logger.debug('Search results filtered', {
        originalCount: prev.length,
        filteredCount: filtered.length,
      });
      return filtered;
    });
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    filters,
    searchMeetups,
    updateFilters,
    clearFilters,
    sortResults,
    filterResults,
  };
};

export default useMeetupSearch;
