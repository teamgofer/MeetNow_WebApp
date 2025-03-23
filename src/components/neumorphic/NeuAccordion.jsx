import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Accordion Item component
 * A single accordion item with header and expandable content
 */
export const NeuAccordionItem = ({
  title,
  children,
  icon,
  isOpen: externalIsOpen,
  onChange,
  variant = 'default',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);
  
  // Handle controlled/uncontrolled component
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);
  
  // Measure content height for animations
  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(scrollHeight);
    }
  }, [children, isOpen]);
  
  // Handle toggle click
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (onChange) {
      onChange(newState);
    }
  };
  
  // Get variant class based on prop
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-accordion-item-primary';
      case 'minimal':
        return 'neu-accordion-item-minimal';
      case 'inset':
        return 'neu-accordion-item-inset';
      default:
        return '';
    }
  };
  
  return (
    <div className={`neu-accordion-item ${getVariantClass()} ${isOpen ? 'neu-accordion-item-open' : ''} ${className}`}>
      <button 
        className="neu-accordion-header" 
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        {icon && <span className="neu-accordion-icon">{icon}</span>}
        <span className="neu-accordion-title">{title}</span>
        <span className={`neu-accordion-arrow ${isOpen ? 'neu-accordion-arrow-open' : ''}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      <div 
        className="neu-accordion-content" 
        style={{ height: isOpen ? `${height}px` : '0px' }}
        ref={contentRef}
      >
        <div className="neu-accordion-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

NeuAccordionItem.propTypes = {
  /** Title of the accordion item */
  title: PropTypes.node.isRequired,
  /** Content inside the accordion item */
  children: PropTypes.node.isRequired,
  /** Optional icon to display next to the title */
  icon: PropTypes.node,
  /** Controls if accordion is open (for controlled component) */
  isOpen: PropTypes.bool,
  /** Callback when accordion open state changes */
  onChange: PropTypes.func,
  /** Styling variant */
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'inset']),
  /** Additional CSS class name */
  className: PropTypes.string,
};

/**
 * Neumorphic Accordion component
 * A container for accordion items with collapsible content sections
 */
export const NeuAccordion = ({
  children,
  allowMultiple = false,
  defaultOpenIndexes = [],
  onChange,
  variant = 'default',
  className = '',
}) => {
  const [openIndexes, setOpenIndexes] = useState(defaultOpenIndexes);
  
  const handleItemChange = (index, isOpen) => {
    let newOpenIndexes;
    
    if (allowMultiple) {
      // For multiple open items
      newOpenIndexes = [...openIndexes];
      
      if (isOpen) {
        if (!newOpenIndexes.includes(index)) {
          newOpenIndexes.push(index);
        }
      } else {
        newOpenIndexes = newOpenIndexes.filter(i => i !== index);
      }
    } else {
      // For single open item
      newOpenIndexes = isOpen ? [index] : [];
    }
    
    setOpenIndexes(newOpenIndexes);
    
    if (onChange) {
      onChange(newOpenIndexes);
    }
  };
  
  // Get variant class based on prop
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-accordion-primary';
      case 'minimal':
        return 'neu-accordion-minimal';
      case 'inset':
        return 'neu-accordion-inset';
      default:
        return '';
    }
  };
  
  // Map children to add props
  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    return React.cloneElement(child, {
      isOpen: openIndexes.includes(index),
      onChange: (isOpen) => handleItemChange(index, isOpen),
      variant: child.props.variant || variant,
    });
  });
  
  return (
    <div className={`neu-accordion ${getVariantClass()} ${className}`}>
      {enhancedChildren}
    </div>
  );
};

NeuAccordion.propTypes = {
  /** Accordion items (should be NeuAccordionItem components) */
  children: PropTypes.node.isRequired,
  /** Allow multiple items to be open simultaneously */
  allowMultiple: PropTypes.bool,
  /** Indexes of items that should be open by default */
  defaultOpenIndexes: PropTypes.arrayOf(PropTypes.number),
  /** Callback when open indexes change */
  onChange: PropTypes.func,
  /** Styling variant */
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'inset']),
  /** Additional CSS class name */
  className: PropTypes.string,
};

export default NeuAccordion; 