import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Icon Button component
 * A button that primarily displays an icon with neumorphic styling
 */
const NeuIconButton = ({
  icon,
  variant = 'default',
  size = 'medium',
  disabled = false,
  tooltip,
  onClick,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-icon-button-primary';
      case 'success':
        return 'neu-icon-button-success';
      case 'danger':
        return 'neu-icon-button-danger';
      case 'info':
        return 'neu-icon-button-info';
      case 'chart':
        return 'neu-icon-button-chart';
      case 'graph':
        return 'neu-icon-button-graph';
      case 'stats':
        return 'neu-icon-button-stats';
      case 'up':
        return 'neu-icon-button-up';
      case 'down':
        return 'neu-icon-button-down';
      default:
        return 'neu-icon-button-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-icon-button-small';
      case 'large':
        return 'neu-icon-button-large';
      default:
        return 'neu-icon-button-medium';
    }
  };

  return (
    <button
      className={`neu-icon-button ${getVariantClass()} ${getSizeClass()} ${disabled ? 'neu-icon-button-disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
};

NeuIconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default', 'primary', 'success', 'danger', 'info', 
    'chart', 'graph', 'stats', 'up', 'down'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  tooltip: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default NeuIconButton; 