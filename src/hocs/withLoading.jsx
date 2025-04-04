import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { useLoading } from '../contexts/LoadingContext';

/**
 * Higher-order component that adds loading state management to a component
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Loading options
 * @param {string} [options.loaderId] - Unique identifier for the loader
 * @param {boolean} [options.autoStart=true] - Whether to start loading automatically
 * @param {boolean} [options.showLoading=true] - Whether to show loading state
 * @returns {React.Component} Wrapped component with loading state
 */
const withLoading = (WrappedComponent, { loaderId, autoStart = true, showLoading = true } = {}) => {
  const WithLoading = ({ ...props }) => {
    const { startLoading, stopLoading, isLoading, isAnyLoading } = useLoading();

    // Generate a unique loader ID if not provided
    const uniqueLoaderId = loaderId || `loader-${Math.random().toString(36).substr(2, 9)}`;

    // Start loading on mount if autoStart is true
    useEffect(() => {
      if (autoStart) {
        startLoading(uniqueLoaderId);
      }

      return () => {
        stopLoading(uniqueLoaderId);
      };
    }, [autoStart, startLoading, stopLoading, uniqueLoaderId]);

    // Enhanced props
    const enhancedProps = {
      ...props,
      isLoading: isLoading(uniqueLoaderId),
      isAnyLoading,
      startLoading: () => startLoading(uniqueLoaderId),
      stopLoading: () => stopLoading(uniqueLoaderId),
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithLoading.propTypes = {
    ...WrappedComponent.propTypes,
    isLoading: PropTypes.bool,
    isAnyLoading: PropTypes.func,
    startLoading: PropTypes.func,
    stopLoading: PropTypes.func,
  };

  WithLoading.displayName = `WithLoading(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithLoading;
};

export default withLoading;
