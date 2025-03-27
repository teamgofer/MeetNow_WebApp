import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { INTEGRATION } from '../constants';

/**
 * Error boundary specifically for the proximity chat feature.
 * Prevents errors in the chat feature from affecting the rest of the app.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error('Proximity Chat Error:', error, errorInfo);
    }

    // If we're in development mode, log more details
    if (process.env.NODE_ENV === 'development') {
      console.group('Proximity Chat Error Details');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if we should prevent error propagation based on integration settings
      if (INTEGRATION.PREVENT_ERROR_PROPAGATION) {
        if (this.props.fallback) {
          // Use the provided fallback UI
          return this.props.fallback;
        }
        
        // If no fallback provided, just render nothing or minimal UI
        return null;
      } else {
        // Re-throw the error if we're not preventing propagation
        throw this.state.error;
      }
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func,
};

export default ErrorBoundary; 