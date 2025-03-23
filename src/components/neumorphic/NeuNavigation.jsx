import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Navigation component
 * A navigation bar with neumorphic styling
 */
const NeuNavigation = ({
  items = [],
  variant = 'default',
  position = 'top',
  orientation = 'horizontal',
  activeItem,
  onItemClick,
  className = '',
  ...props
}) => {
  const [active, setActive] = useState(activeItem || (items.length > 0 ? items[0].id : null));

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-nav-primary';
      case 'minimal':
        return 'neu-nav-minimal';
      case 'luxury':
        return 'neu-nav-luxury';
      case 'playful':
        return 'neu-nav-playful';
      case 'neumorphic':
        return 'neu-nav-neumorphic';
      case 'mobile':
        return 'neu-nav-mobile';
      default:
        return 'neu-nav-default';
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'left':
        return 'neu-nav-left';
      case 'right':
        return 'neu-nav-right';
      case 'bottom':
        return 'neu-nav-bottom';
      default:
        return 'neu-nav-top';
    }
  };

  const getOrientationClass = () => {
    return orientation === 'vertical' ? 'neu-nav-vertical' : 'neu-nav-horizontal';
  };

  const handleItemClick = (id) => {
    setActive(id);
    if (onItemClick) {
      onItemClick(id);
    }
  };

  return (
    <nav
      className={`neu-navigation ${getVariantClass()} ${getPositionClass()} ${getOrientationClass()} ${className}`}
      {...props}
    >
      <ul className="neu-nav-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`neu-nav-item ${active === item.id ? 'neu-nav-item-active' : ''}`}
            onClick={() => handleItemClick(item.id)}
          >
            {item.icon && <span className="neu-nav-icon">{item.icon}</span>}
            {item.label && <span className="neu-nav-label">{item.label}</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
};

NeuNavigation.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string,
      icon: PropTypes.node
    })
  ).isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'luxury', 'playful', 'neumorphic', 'mobile']),
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  activeItem: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onItemClick: PropTypes.func,
  className: PropTypes.string
};

export default NeuNavigation; 