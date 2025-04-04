import React from 'react';

import { handleApiError } from './error-handler';

/**
 * Higher-order component to handle API requests with offline support and retry logic
 * @param {Function} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped component with offline support
 */
export const withOfflineSupport = (WrappedComponent, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    cacheKey = null,
    shouldCache = true,
    shouldRetry = () => true,
  } = options;

  return function WithOfflineSupport(props) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [data, setData] = React.useState(null);
    const [retryCount, setRetryCount] = React.useState(0);
    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

    // Handle online/offline status
    React.useEffect(() => {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    // Load cached data on mount
    React.useEffect(() => {
      if (cacheKey && shouldCache) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            setData(JSON.parse(cachedData));
          } catch (e) {
            console.error('Failed to parse cached data:', e);
          }
        }
      }
    }, [cacheKey, shouldCache]);

    // Save data to cache
    const saveToCache = React.useCallback(
      newData => {
        if (cacheKey && shouldCache) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(newData));
          } catch (e) {
            console.error('Failed to save data to cache:', e);
          }
        }
      },
      [cacheKey, shouldCache]
    );

    // Handle API request with retry logic
    const handleRequest = React.useCallback(
      async (requestFn, ...args) => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await requestFn(...args);
          setData(response);
          saveToCache(response);
          setRetryCount(0);
          return response;
        } catch (err) {
          const apiError = handleApiError(err, {
            isOffline,
            retryCount,
            maxRetries,
          });

          // Handle retry logic
          if (shouldRetry(apiError) && retryCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            setRetryCount(prev => prev + 1);
            return handleRequest(requestFn, ...args);
          }

          setError(apiError);
          throw apiError;
        } finally {
          setIsLoading(false);
        }
      },
      [isOffline, retryCount, maxRetries, retryDelay, shouldRetry, saveToCache]
    );

    // Clear cache
    const clearCache = React.useCallback(() => {
      if (cacheKey) {
        localStorage.removeItem(cacheKey);
        setData(null);
      }
    }, [cacheKey]);

    // Force refresh data
    const refresh = React.useCallback(
      async (requestFn, ...args) => {
        clearCache();
        return handleRequest(requestFn, ...args);
      },
      [clearCache, handleRequest]
    );

    return (
      <WrappedComponent
        {...props}
        isLoading={isLoading}
        error={error}
        data={data}
        isOffline={isOffline}
        retryCount={retryCount}
        handleRequest={handleRequest}
        refresh={refresh}
        clearCache={clearCache}
      />
    );
  };
};

/**
 * Custom hook for offline support
 */
export const useOfflineSupport = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    cacheKey = null,
    shouldCache = true,
    shouldRetry = () => true,
  } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  // Handle online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data on mount
  React.useEffect(() => {
    if (cacheKey && shouldCache) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          setData(JSON.parse(cachedData));
        } catch (e) {
          console.error('Failed to parse cached data:', e);
        }
      }
    }
  }, [cacheKey, shouldCache]);

  // Save data to cache
  const saveToCache = React.useCallback(
    newData => {
      if (cacheKey && shouldCache) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(newData));
        } catch (e) {
          console.error('Failed to save data to cache:', e);
        }
      }
    },
    [cacheKey, shouldCache]
  );

  // Handle API request with retry logic
  const handleRequest = React.useCallback(
    async (requestFn, ...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await requestFn(...args);
        setData(response);
        saveToCache(response);
        setRetryCount(0);
        return response;
      } catch (err) {
        const apiError = handleApiError(err, {
          isOffline,
          retryCount,
          maxRetries,
        });

        // Handle retry logic
        if (shouldRetry(apiError) && retryCount < maxRetries) {
          const delay = retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryCount(prev => prev + 1);
          return handleRequest(requestFn, ...args);
        }

        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [isOffline, retryCount, maxRetries, retryDelay, shouldRetry, saveToCache]
  );

  // Clear cache
  const clearCache = React.useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
      setData(null);
    }
  }, [cacheKey]);

  // Force refresh data
  const refresh = React.useCallback(
    async (requestFn, ...args) => {
      clearCache();
      return handleRequest(requestFn, ...args);
    },
    [clearCache, handleRequest]
  );

  return {
    isLoading,
    error,
    data,
    isOffline,
    retryCount,
    handleRequest,
    refresh,
    clearCache,
  };
};
