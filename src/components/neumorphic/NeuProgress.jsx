import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Progress component
 * A customizable progress bar with neumorphic styling
 */
const NeuProgress = ({
  value = 0,
  max = 100,
  label,
  showValue = true,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-progress-primary';
      case 'success':
        return 'neu-progress-success';
      case 'danger':
        return 'neu-progress-danger';
      case 'info':
        return 'neu-progress-info';
      default:
        return 'neu-progress-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-progress-small';
      case 'large':
        return 'neu-progress-large';
      default:
        return 'neu-progress-medium';
    }
  };

  return (
    <div className={`neu-progress-container ${className}`}>
      {label && (
        <div className="neu-progress-header">
          <div className="neu-progress-label">{label}</div>
          {showValue && <div className="neu-progress-value">{`${Math.round(percentage)}%`}</div>}
        </div>
      )}
      <div className={`neu-progress-track ${getSizeClass()}`}>
        <div 
          className={`neu-progress-bar ${getVariantClass()}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin="0"
          aria-valuemax={max}
          {...props}
        />
      </div>
    </div>
  );
};

NeuProgress.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string,
  showValue: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'danger', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default NeuProgress; 