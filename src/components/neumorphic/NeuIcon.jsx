import PropTypes from 'prop-types';
import React from 'react';

import './neumorphic.css';
import * as ActionIcons from './icons/ActionIcons';
import * as CategoryIcons from './icons/CategoryIcons';
import * as ChartIcons from './icons/ChartIcons';
import * as NavigationIcons from './icons/NavigationIcons';

/**
 * Neumorphic Icon component
 * A component to display various icons with neumorphic styling
 */
const NeuIcon = ({
  name,
  category = 'chart',
  size = 'medium',
  variant = 'default',
  className = '',
  ...props
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-icon-small';
      case 'large':
        return 'neu-icon-large';
      case 'xlarge':
        return 'neu-icon-xlarge';
      default:
        return 'neu-icon-medium';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-icon-primary';
      case 'chart':
        return 'neu-icon-chart';
      case 'graph':
        return 'neu-icon-graph';
      case 'stats':
        return 'neu-icon-stats';
      case 'up':
        return 'neu-icon-up';
      case 'down':
        return 'neu-icon-down';
      default:
        return 'neu-icon-default';
    }
  };

  const renderIcon = () => {
    let IconComponent;

    // Select the icon based on category and name
    switch (category) {
      case 'chart':
        IconComponent = ChartIcons[name];
        break;
      case 'category':
        IconComponent = CategoryIcons[name];
        break;
      case 'action':
        IconComponent = ActionIcons[name];
        break;
      case 'navigation':
        IconComponent = NavigationIcons[name];
        break;
      default:
        IconComponent = ChartIcons[name] || null;
    }

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in category "${category}"`);
      return null;
    }

    return <IconComponent />;
  };

  return (
    <div className={`neu-icon ${getSizeClass()} ${getVariantClass()} ${className}`} {...props}>
      {renderIcon()}
    </div>
  );
};

NeuIcon.propTypes = {
  name: PropTypes.string.isRequired,
  category: PropTypes.oneOf(['chart', 'category', 'action', 'navigation']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  variant: PropTypes.oneOf(['default', 'primary', 'chart', 'graph', 'stats', 'up', 'down']),
  className: PropTypes.string,
};

export default NeuIcon;
