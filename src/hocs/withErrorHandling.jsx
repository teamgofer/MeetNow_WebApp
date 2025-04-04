import PropTypes from 'prop-types';
import React from 'react';

import { useError } from '../contexts/ErrorContext';

/**
 * Higher-order component that adds error handling capabilities to a component
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Error handling options
 * @param {boolean} [options.withRetry=true] - Whether to add retry functionality
 * @param {boolean} [options.withLoading=true] - Whether to add loading state
 * @param {boolean} [options.withOffline=true] - Whether to add offline detection
 * @returns {React.Component} Wrapped component with error handling
 */
const withErrorHandling = (
  WrappedComponent,
  { withRetry = true, withLoading = true, withOffline = true } = {}
) => {
  const WithErrorHandling = ({ ...props }) => {
    const {
      addError,
      removeError,
      setProcessing,
      setOffline,
      handleErrorWithRetry,
      isProcessing,
      isOffline,
    } = useError();

    // Wrap async operations with error handling
    const withErrorBoundary = async (operation, options = {}) => {
      const { retry = withRetry, showLoading = withLoading, handleOffline = withOffline } = options;

      try {
        if (showLoading) {
          setProcessing(true);
        }

        if (handleOffline && isOffline) {
          throw new Error('You are currently offline. Please check your connection.');
        }

        const result = await operation();
        return result;
      } catch (error) {
        // Add error to global error state
        addError(error, retry ? () => withErrorBoundary(operation, options) : null);
        throw error;
      } finally {
        if (showLoading) {
          setProcessing(false);
        }
      }
    };

    // Enhanced props
    const enhancedProps = {
      ...props,
      withErrorBoundary,
      isProcessing,
      isOffline,
      handleErrorWithRetry,
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithErrorHandling.propTypes = {
    ...WrappedComponent.propTypes,
    withErrorBoundary: PropTypes.func,
    isProcessing: PropTypes.bool,
    isOffline: PropTypes.bool,
    handleErrorWithRetry: PropTypes.func,
  };

  WithErrorHandling.displayName = `WithErrorHandling(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorHandling;
};

export default withErrorHandling;
