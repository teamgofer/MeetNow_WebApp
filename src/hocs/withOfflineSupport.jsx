import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { useOffline } from '../contexts/OfflineContext';

/**
 * Higher-order component that adds offline support to a component
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Offline support options
 * @param {boolean} [options.requireOnline=false] - Whether the component requires online state
 * @param {boolean} [options.cacheData=true] - Whether to cache component data
 * @param {Function} [options.syncStrategy] - Custom sync strategy for offline data
 * @returns {React.Component} Wrapped component with offline support
 */
const withOfflineSupport = (
  WrappedComponent,
  { requireOnline = false, cacheData = true, syncStrategy = null } = {}
) => {
  const WithOfflineSupport = ({ ...props }) => {
    const {
      isOffline,
      addPendingAction,
      removePendingAction,
      setOfflineData,
      getOfflineData,
      syncPendingActions,
    } = useOffline();

    // Handle offline state
    useEffect(() => {
      if (requireOnline && isOffline) {
        // You might want to show an offline message or redirect
        console.warn('Component requires online state but is currently offline');
      }
    }, [isOffline, requireOnline]);

    // Wrap async operations with offline support
    const withOfflineOperation = async (operation, options = {}) => {
      const { cache = cacheData, sync = true, key = null } = options;

      // If offline and operation is not critical, use cached data
      if (isOffline && cache && key) {
        const cachedData = getOfflineData(key);
        if (cachedData) {
          return cachedData;
        }
      }

      try {
        const result = await operation();

        // Cache the result if needed
        if (cache && key) {
          setOfflineData(key, result);
        }

        return result;
      } catch (error) {
        // If offline and sync is enabled, queue the operation
        if (isOffline && sync) {
          const actionId = addPendingAction({
            execute: async () => {
              try {
                const result = await operation();
                if (cache && key) {
                  setOfflineData(key, result);
                }
                return result;
              } finally {
                removePendingAction(actionId);
              }
            },
          });
        }
        throw error;
      }
    };

    // Enhanced props
    const enhancedProps = {
      ...props,
      isOffline,
      withOfflineOperation,
      syncPendingActions,
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithOfflineSupport.propTypes = {
    ...WrappedComponent.propTypes,
    isOffline: PropTypes.bool,
    withOfflineOperation: PropTypes.func,
    syncPendingActions: PropTypes.func,
  };

  WithOfflineSupport.displayName = `WithOfflineSupport(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithOfflineSupport;
};

export default withOfflineSupport;
