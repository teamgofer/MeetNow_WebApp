import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Checkbox component
 * A customizable checkbox with neumorphic styling
 */
const NeuCheckbox = ({
  label,
  checked,
  onChange,
  variant = 'default',
  size = 'medium',
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-checkbox-primary';
      case 'success':
        return 'neu-checkbox-success';
      case 'info':
        return 'neu-checkbox-info';
      case 'playful':
        return 'neu-checkbox-playful';
      default:
        return 'neu-checkbox-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-checkbox-small';
      case 'large':
        return 'neu-checkbox-large';
      default:
        return 'neu-checkbox-medium';
    }
  };

  return (
    <label className={`neu-checkbox-container ${className} ${disabled ? 'neu-checkbox-disabled' : ''}`}>
      <div className={`neu-checkbox-wrapper ${getVariantClass()} ${getSizeClass()} ${error ? 'neu-checkbox-error' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="neu-checkbox-input"
          {...props}
        />
        <span className="neu-checkbox-custom">
          {checked && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
      </div>
      {label && <span className="neu-checkbox-label">{label}</span>}
    </label>
  );
};

NeuCheckbox.propTypes = {
  label: PropTypes.node,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'info', 'playful']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string
};

export default NeuCheckbox; 