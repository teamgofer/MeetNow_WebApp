import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Card component
 * A customizable card with neumorphic styling
 */
const NeuCard = ({
  children,
  variant = 'default',
  elevation = 'medium',
  header,
  footer,
  onClick,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-card-primary';
      case 'luxury':
        return 'neu-card-luxury';
      case 'playful':
        return 'neu-card-playful';
      case 'minimal':
        return 'neu-card-minimal';
      case 'ocean':
        return 'neu-card-ocean';
      default:
        return 'neu-card-default';
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

  return (
    <div
      className={`neu-card ${getVariantClass()} ${getElevationClass()} ${onClick ? 'neu-card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {header && <div className="neu-card-header">{header}</div>}
      <div className="neu-card-content">{children}</div>
      {footer && <div className="neu-card-footer">{footer}</div>}
    </div>
  );
};

NeuCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'luxury', 'playful', 'minimal', 'ocean']),
  elevation: PropTypes.oneOf(['flat', 'medium', 'high', 'inset']),
  header: PropTypes.node,
  footer: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default NeuCard; 