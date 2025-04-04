import PropTypes from 'prop-types';
import React from 'react';
import './neumorphic.css';

/**
 * Glassmorphism Card component
 * A customizable card with glassmorphism styling (transparency and blur)
 */
const NeuGlassCard = ({
  children,
  header,
  footer,
  variant = 'default',
  blur = 'medium',
  opacity = 'medium',
  border = false,
  borderColor,
  elevation = 'medium',
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-glass-card-primary';
      case 'success':
        return 'neu-glass-card-success';
      case 'danger':
        return 'neu-glass-card-danger';
      case 'warning':
        return 'neu-glass-card-warning';
      case 'info':
        return 'neu-glass-card-info';
      case 'rainbow':
        return 'neu-glass-card-rainbow';
      case 'dark':
        return 'neu-glass-card-dark';
      default:
        return '';
    }
  };

  const getBlurClass = () => {
    switch (blur) {
      case 'none':
        return 'neu-glass-card-blur-none';
      case 'light':
        return 'neu-glass-card-blur-light';
      case 'heavy':
        return 'neu-glass-card-blur-heavy';
      case 'medium':
      default:
        return 'neu-glass-card-blur-medium';
    }
  };

  const getOpacityClass = () => {
    switch (opacity) {
      case 'low':
        return 'neu-glass-opacity-low';
      case 'high':
        return 'neu-glass-opacity-high';
      default:
        return 'neu-glass-opacity-medium';
    }
  };

  const getElevationClass = () => {
    switch (elevation) {
      case 'none':
        return 'neu-glass-elevation-none';
      case 'low':
        return 'neu-glass-elevation-low';
      case 'high':
        return 'neu-glass-elevation-high';
      default:
        return 'neu-glass-elevation-medium';
    }
  };

  const borderStyle = border ? { borderColor: borderColor || 'rgba(255, 255, 255, 0.2)' } : {};

  return (
    <div
      className={`
        neu-glass-card 
        ${getVariantClass()} 
        ${getBlurClass()} 
        ${getOpacityClass()} 
        ${getElevationClass()}
        ${border ? 'neu-glass-card-border' : ''}
        ${onClick ? 'neu-glass-card-clickable' : ''}
        ${className}
      `}
      style={{ ...borderStyle, ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {header && <div className="neu-glass-card-header">{header}</div>}
      <div className="neu-glass-card-content">{children}</div>
      {footer && <div className="neu-glass-card-footer">{footer}</div>}
      <div className="neu-glass-card-background"></div>
      <div className="neu-glass-card-border"></div>
    </div>
  );
};

NeuGlassCard.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'rainbow',
    'dark',
  ]),
  blur: PropTypes.oneOf(['none', 'light', 'medium', 'heavy']),
  opacity: PropTypes.oneOf(['low', 'medium', 'high']),
  border: PropTypes.bool,
  borderColor: PropTypes.string,
  elevation: PropTypes.oneOf(['none', 'low', 'medium', 'high']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default NeuGlassCard;
