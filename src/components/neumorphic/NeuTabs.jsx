import PropTypes from 'prop-types';
import React, { useState } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Tabs component
 * A customizable tabs with neumorphic styling
 */
const NeuTabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  alignment = 'left',
  size = 'medium',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const [active, setActive] = useState(activeTab || (tabs.length > 0 ? tabs[0].id : null));

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-tabs-primary';
      case 'minimal':
        return 'neu-tabs-minimal';
      case 'luxury':
        return 'neu-tabs-luxury';
      case 'playful':
        return 'neu-tabs-playful';
      default:
        return 'neu-tabs-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-tabs-small';
      case 'large':
        return 'neu-tabs-large';
      default:
        return 'neu-tabs-medium';
    }
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center':
        return 'neu-tabs-center';
      case 'right':
        return 'neu-tabs-right';
      case 'stretch':
        return 'neu-tabs-stretch';
      default:
        return 'neu-tabs-left';
    }
  };

  const handleTabClick = id => {
    setActive(id);
    if (onChange) {
      onChange(id);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === active)?.content;

  return (
    <div className={`neu-tabs-container ${className}`} {...props}>
      <div
        className={`neu-tabs-header ${getVariantClass()} ${getSizeClass()} ${getAlignmentClass()} ${fullWidth ? 'neu-tabs-fullwidth' : ''}`}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`neu-tab ${active === tab.id ? 'neu-tab-active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.icon && <span className="neu-tab-icon">{tab.icon}</span>}
            <span className="neu-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="neu-tabs-content">{activeTabContent}</div>
    </div>
  );
};

NeuTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      content: PropTypes.node,
    })
  ).isRequired,
  activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'luxury', 'playful']),
  alignment: PropTypes.oneOf(['left', 'center', 'right', 'stretch']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default NeuTabs;
