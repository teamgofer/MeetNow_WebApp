import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaExclamationCircle, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

// Error type constants
const ErrorTypes = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  GEOLOCATION: 'geolocation',
  STORAGE: 'storage'
};

/**
 * Enhanced error notification component that handles both simple messages and complex error objects
 */
const ErrorNotification = ({ 
  error, 
  message, // For backward compatibility with simple message usage
  onDismiss,
  onClose, // For backward compatibility
  autoHideAfter = 5000,
  className = ''
}) => {
  useEffect(() => {
    const duration = autoHideAfter;
    const callback = onDismiss || onClose;
    
    if (duration && callback) {
      const timer = setTimeout(callback, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHideAfter, onDismiss, onClose]);

  // Handle simple message case (backward compatibility)
  if (message) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-lg max-w-md w-full animate-fade-in-up">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{message}</p>
            </div>
            {(onClose || onDismiss) && (
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  className="inline-flex text-red-400 hover:text-red-500 focus:outline-none"
                  onClick={onClose || onDismiss}
                >
                  <span className="sr-only">Close</span>
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle complex error object case
  if (!error) return null;

  const getStyleByType = (type, severity) => {
    const baseStyles = 'p-4 rounded-lg border flex items-start space-x-3 shadow-sm';
    
    switch (severity) {
      case 'critical':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'error':
        return `${baseStyles} bg-orange-50 border-orange-200 text-orange-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIconBySeverity = (severity) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <FaExclamationCircle className="w-5 h-5 text-orange-500" />;
      case 'warning':
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <FaInfoCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getErrorMessage = (error) => {
    if (error.message) return error.message;
    
    switch (error.type) {
      case ErrorTypes.NETWORK:
        return 'Network connection issue. Please check your connection and try again.';
      case ErrorTypes.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorTypes.PERMISSION:
        return 'You don\'t have permission to perform this action.';
      case ErrorTypes.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorTypes.GEOLOCATION:
        return 'Unable to access your location. Please check your location settings.';
      case ErrorTypes.STORAGE:
        return 'Unable to upload or access files. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };

  const getRecoverySuggestion = (error) => {
    if (error.recovered) return null;
    
    switch (error.type) {
      case ErrorTypes.NETWORK:
        return 'Try refreshing the page or checking your internet connection.';
      case ErrorTypes.AUTHENTICATION:
        return 'Please log out and log back in to refresh your session.';
      case ErrorTypes.PERMISSION:
        return 'Contact support if you believe this is a mistake.';
      case ErrorTypes.VALIDATION:
        return 'Please review the highlighted fields and correct any errors.';
      case ErrorTypes.GEOLOCATION:
        return 'Enable location services in your browser settings.';
      case ErrorTypes.STORAGE:
        return 'Try clearing your browser cache or using a different browser.';
      default:
        return 'Try refreshing the page or contact support if the issue persists.';
    }
  };

  const severity = error.severity || 'error';
  const errorMessage = getErrorMessage(error);
  const recoverySuggestion = getRecoverySuggestion(error);

  return (
    <div 
      className={`${getStyleByType(error.type, severity)} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">
        {getIconBySeverity(severity)}
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-medium">
          {errorMessage}
        </h3>
        
        {recoverySuggestion && (
          <p className="mt-1 text-sm opacity-90">
            {recoverySuggestion}
          </p>
        )}
        
        {error.context?.details && (
          <div className="mt-2 text-xs opacity-75">
            {error.context.details}
          </div>
        )}
      </div>
      
      {(onDismiss || onClose) && (
        <button
          onClick={onDismiss || onClose}
          className="flex-shrink-0 ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Dismiss notification"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

ErrorNotification.propTypes = {
  error: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
    severity: PropTypes.oneOf(['critical', 'error', 'warning', 'info']),
    context: PropTypes.object,
    recovered: PropTypes.bool
  }),
  message: PropTypes.string, // For backward compatibility
  onDismiss: PropTypes.func,
  onClose: PropTypes.func, // For backward compatibility
  autoHideAfter: PropTypes.number,
  className: PropTypes.string
};

export default ErrorNotification; 