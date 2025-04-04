import PropTypes from 'prop-types';
import React from 'react';

import { ErrorProvider, useError } from '../contexts/ErrorContext';

import ErrorNotification from './ui/ErrorNotification';
import LoadingState from './ui/LoadingState';
import OfflineManager from './ui/OfflineManager';
import ToastContainer from './ui/Toast';

/**
 * Global error boundary component that wraps the entire application
 */
const GlobalErrorBoundary = ({ children }) => {
  const { errors, isOffline, isProcessing, removeError } = useError();

  return (
    <>
      {/* Offline Manager */}
      <OfflineManager />

      {/* Loading State */}
      {isProcessing && <LoadingState />}

      {/* Error Notifications */}
      {errors.map(error => (
        <ErrorNotification key={error.id} error={error} onClose={() => removeError(error.id)} />
      ))}

      {/* Toast Container for non-error notifications */}
      <ToastContainer />

      {/* Main Application Content */}
      {children}
    </>
  );
};

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Wrapper component that provides error context
 */
const GlobalErrorWrapper = ({ children }) => {
  return (
    <ErrorProvider>
      <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
    </ErrorProvider>
  );
};

GlobalErrorWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalErrorWrapper;
