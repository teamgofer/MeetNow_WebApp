import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Select component
 * A customizable select/dropdown with neumorphic styling
 */
const NeuSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  variant = 'default',
  size = 'medium',
  disabled = false,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-select-primary';
      case 'minimal':
        return 'neu-select-minimal';
      case 'luxury':
        return 'neu-select-luxury';
      case 'playful':
        return 'neu-select-playful';
      default:
        return 'neu-select-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-select-small';
      case 'large':
        return 'neu-select-large';
      default:
        return 'neu-select-medium';
    }
  };

  const getSelectedOption = () => {
    return options.find(option => option.value === value) || null;
  };

  const handleOptionClick = optionValue => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`neu-select-container ${className}`} ref={selectRef}>
      {label && <label className="neu-select-label">{label}</label>}
      <div
        className={`neu-select-wrapper ${getVariantClass()} ${getSizeClass()} ${isOpen ? 'neu-select-open' : ''} ${disabled ? 'neu-select-disabled' : ''} ${error ? 'neu-select-error' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="neu-select-value">
          {getSelectedOption() ? getSelectedOption().label : placeholder}
        </div>
        <div className="neu-select-arrow">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points={isOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
        </div>

        {isOpen && (
          <div className="neu-select-dropdown">
            {options.map(option => (
              <div
                key={option.value}
                className={`neu-select-option ${option.value === value ? 'neu-select-option-selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {helperText && (
        <div className={`neu-select-helper-text ${error ? 'neu-select-error-text' : ''}`}>
          {helperText}
        </div>
      )}
    </div>
  );
};

NeuSelect.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'luxury', 'playful']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string,
};

export default NeuSelect;
