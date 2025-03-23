import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Toggle component
 * A customizable toggle switch with neumorphic styling
 */
const NeuToggle = ({
  label,
  checked,
  onChange,
  variant = 'default',
  size = 'medium',
  disabled = false,
  labelPosition = 'right',
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-toggle-primary';
      case 'success':
        return 'neu-toggle-success';
      case 'danger':
        return 'neu-toggle-danger';
      case 'info':
        return 'neu-toggle-info';
      default:
        return 'neu-toggle-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-toggle-small';
      case 'large':
        return 'neu-toggle-large';
      default:
        return 'neu-toggle-medium';
    }
  };

  const getLabelPositionClass = () => {
    return labelPosition === 'left' ? 'neu-toggle-label-left' : 'neu-toggle-label-right';
  };

  return (
    <label className={`neu-toggle-container ${getLabelPositionClass()} ${className} ${disabled ? 'neu-toggle-disabled' : ''}`}>
      {label && labelPosition === 'left' && <span className="neu-toggle-label">{label}</span>}
      <div className={`neu-toggle-wrapper ${getVariantClass()} ${getSizeClass()}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="neu-toggle-input"
          {...props}
        />
        <span className="neu-toggle-track">
          <span className="neu-toggle-thumb"></span>
        </span>
      </div>
      {label && labelPosition === 'right' && <span className="neu-toggle-label">{label}</span>}
    </label>
  );
};

NeuToggle.propTypes = {
  label: PropTypes.node,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'danger', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string
};

export default NeuToggle; 