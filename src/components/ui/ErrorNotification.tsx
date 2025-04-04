import React from 'react';

interface ErrorNotificationProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Error notification component for displaying error messages
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  onDismiss,
  className = '',
  type = 'error',
}) => {
  // Get appropriate colors based on type
  const colors = {
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700',
  };

  return (
    <div className={`rounded-md border-l-4 p-4 ${colors[type]} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            className="ml-3 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onDismiss}
          >
            <span className="sr-only">Dismiss</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorNotification;
