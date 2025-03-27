import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

/**
 * Toast notification component
 */
const Toast = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-start space-x-3 transform transition-all duration-300';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FaExclamationCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <FaInfoCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message}
        </p>
      </div>
      
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Dismiss notification"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  className: PropTypes.string
};

/**
 * Toast container component to manage multiple toasts
 */
const ToastContainer = ({ className = '' }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className={`fixed bottom-4 right-4 space-y-2 ${className}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  className: PropTypes.string
};

/**
 * Custom hook for managing toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration)
  };
};

export default Toast; 