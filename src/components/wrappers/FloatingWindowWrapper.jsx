import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FloatingWindowWrapper = ({
  isOpen,
  onClose,
  children,
  position = 'top-right',
  className = '',
  style = {},
  maxHeight = 'calc(100vh - 2rem)',
  zIndex = 50
}) => {
  const windowRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div
      ref={windowRef}
      data-testid="floating-window"
      className={`absolute z-${zIndex} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md transition-all duration-300 ${positionClasses[position]} ${className} block`}
      style={{
        maxHeight,
        overflowY: 'auto',
        ...style
      }}
    >
      <div className="relative">
        <button
          data-testid="close-button"
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div data-testid="floating-window-content">
          {children}
        </div>
      </div>
    </div>
  );
};

FloatingWindowWrapper.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'center']),
  className: PropTypes.string,
  style: PropTypes.object,
  maxHeight: PropTypes.string,
  zIndex: PropTypes.number
};

export default FloatingWindowWrapper; 
 
 
 
 
 