import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Button component
 * A customizable button with neumorphic styling
 */
const NeuButton = ({
  children,
  variant = 'default',
  size = 'medium',
  icon,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-button-primary';
      case 'success':
        return 'neu-button-success';
      case 'danger':
        return 'neu-button-danger';
      case 'info':
        return 'neu-button-info';
      case 'playful':
        return 'neu-button-playful';
      case 'luxury':
        return 'neu-button-luxury';
      case 'minimal':
        return 'neu-button-minimal';
      default:
        return 'neu-button-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-button-small';
      case 'large':
        return 'neu-button-large';
      default:
        return 'neu-button-medium';
    }
  };

  return (
    <button
      className={`neu-button ${getVariantClass()} ${getSizeClass()} ${disabled ? 'neu-button-disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="neu-button-icon">{icon}</span>}
      <span className="neu-button-text">{children}</span>
    </button>
  );
};

NeuButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'danger', 'info', 'playful', 'luxury', 'minimal']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default NeuButton; 