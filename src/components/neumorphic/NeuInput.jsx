import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Input component
 * A customizable input field with neumorphic styling
 */
const NeuInput = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  icon,
  variant = 'default',
  size = 'medium',
  disabled = false,
  error,
  success,
  helperText,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-input-primary';
      case 'minimal':
        return 'neu-input-minimal';
      case 'luxury':
        return 'neu-input-luxury';
      case 'playful':
        return 'neu-input-playful';
      default:
        return 'neu-input-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-input-small';
      case 'large':
        return 'neu-input-large';
      default:
        return 'neu-input-medium';
    }
  };

  const getStatusClass = () => {
    if (error) return 'neu-input-error';
    if (success) return 'neu-input-success';
    return '';
  };

  return (
    <div className={`neu-input-container ${className}`}>
      {label && <label className="neu-input-label">{label}</label>}
      <div className={`neu-input-wrapper ${getVariantClass()} ${getSizeClass()} ${getStatusClass()} ${disabled ? 'neu-input-disabled' : ''}`}>
        {icon && <span className="neu-input-icon">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="neu-input"
          {...props}
        />
      </div>
      {helperText && (
        <div className={`neu-input-helper-text ${error ? 'neu-input-error-text' : ''}`}>
          {helperText}
        </div>
      )}
    </div>
  );
};

NeuInput.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  icon: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'luxury', 'playful']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  success: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string
};

export default NeuInput; 