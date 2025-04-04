import PropTypes from 'prop-types';
import React from 'react';
import './neumorphic.css';

/**
 * Neumorphic Alert component
 * A customizable alert/notification with neumorphic styling
 */
const NeuAlert = ({
  title,
  children,
  variant = 'info',
  icon,
  onClose,
  elevation = 'medium',
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'neu-alert-success';
      case 'warning':
        return 'neu-alert-warning';
      case 'error':
        return 'neu-alert-error';
      case 'info':
      default:
        return 'neu-alert-info';
    }
  };

  const getElevationClass = () => {
    switch (elevation) {
      case 'flat':
        return 'neu-elevation-flat';
      case 'high':
        return 'neu-elevation-high';
      case 'inset':
        return 'neu-elevation-inset';
      default:
        return 'neu-elevation-medium';
    }
  };

  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'warning':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'error':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <div
      className={`neu-alert ${getVariantClass()} ${getElevationClass()} ${className}`}
      {...props}
    >
      <div className="neu-alert-icon">{getDefaultIcon()}</div>
      <div className="neu-alert-content">
        {title && <div className="neu-alert-title">{title}</div>}
        <div className="neu-alert-message">{children}</div>
      </div>
      {onClose && (
        <button className="neu-alert-close" onClick={onClose}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

NeuAlert.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  icon: PropTypes.node,
  onClose: PropTypes.func,
  elevation: PropTypes.oneOf(['flat', 'medium', 'high', 'inset']),
  className: PropTypes.string,
};

export default NeuAlert;
