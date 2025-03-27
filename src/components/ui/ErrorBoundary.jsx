import React from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { handleError } from '../../utils/error-handler';

/**
 * Error boundary component to catch and handle React errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to error handling service
    handleError(error, {
      componentStack: errorInfo.componentStack,
      isReactError: true
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-center">
              <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
              </p>
              
              <button
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaRedo className="w-4 h-4 mr-2" />
                Try again
              </button>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 text-left">
                  <details className="text-sm text-gray-500 dark:text-gray-400">
                    <summary className="cursor-pointer">Error details</summary>
                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                      {this.state.error?.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string
};

/**
 * Fallback component for when a component fails to load
 */
export const FallbackComponent = ({
  error,
  resetErrorBoundary,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <FaExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Component failed to load
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
        {error?.message || 'An unexpected error occurred while loading this component.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FaRedo className="w-4 h-4 mr-2" />
        Try again
      </button>
    </div>
  );
};

FallbackComponent.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  resetErrorBoundary: PropTypes.func.isRequired,
  className: PropTypes.string
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const {
    fallbackComponent = FallbackComponent,
    onError,
    ...errorBoundaryProps
  } = options;

  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary
        {...errorBoundaryProps}
        onError={onError}
        fallbackComponent={fallbackComponent}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary; 