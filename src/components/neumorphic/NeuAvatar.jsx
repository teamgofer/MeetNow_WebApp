import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Avatar component
 * A customizable avatar with neumorphic styling
 */
const NeuAvatar = ({
  src,
  alt,
  initials,
  size = 'medium',
  variant = 'default',
  status,
  icon,
  onClick,
  className = '',
  ...props
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'neu-avatar-xs';
      case 'small':
        return 'neu-avatar-small';
      case 'large':
        return 'neu-avatar-large';
      case 'xl':
        return 'neu-avatar-xl';
      default:
        return 'neu-avatar-medium';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-avatar-primary';
      case 'rounded':
        return 'neu-avatar-rounded';
      case 'square':
        return 'neu-avatar-square';
      default:
        return 'neu-avatar-default';
    }
  };

  const getStatusClass = () => {
    if (!status) return '';
    
    switch (status) {
      case 'online':
        return 'neu-avatar-status-online';
      case 'away':
        return 'neu-avatar-status-away';
      case 'busy':
        return 'neu-avatar-status-busy';
      case 'offline':
        return 'neu-avatar-status-offline';
      default:
        return '';
    }
  };

  const getInitials = () => {
    if (initials) return initials;
    if (!alt) return '';

    // Generate initials from alt text
    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .substr(0, 2)
      .toUpperCase();
  };

  return (
    <div 
      className={`neu-avatar ${getSizeClass()} ${getVariantClass()} ${getStatusClass()} ${onClick ? 'neu-avatar-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || 'avatar'} className="neu-avatar-img" />
      ) : icon ? (
        <div className="neu-avatar-icon">{icon}</div>
      ) : (
        <div className="neu-avatar-initials">{getInitials()}</div>
      )}
      {status && <span className="neu-avatar-status-indicator" />}
    </div>
  );
};

NeuAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  initials: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'small', 'medium', 'large', 'xl']),
  variant: PropTypes.oneOf(['default', 'primary', 'rounded', 'square']),
  status: PropTypes.oneOf(['online', 'away', 'busy', 'offline']),
  icon: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default NeuAvatar; 