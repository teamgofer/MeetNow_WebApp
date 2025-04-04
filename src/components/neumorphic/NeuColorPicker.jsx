import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Color Picker component
 * A customizable color picker with neumorphic styling
 */
const NeuColorPicker = ({
  value = '#3f51b5',
  onChange,
  label,
  showAlpha = false,
  variant = 'default',
  size = 'medium',
  disabled = false,
  className = '',
  style = {},
}) => {
  // State for internal color and alpha values
  const [internalColor, setInternalColor] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  // Parse the color value into hex, rgba, etc.
  useEffect(() => {
    setInternalColor(value);
  }, [value]);

  // Extract hex color and alpha from color string
  const parseColor = colorStr => {
    // Check if it's a hex with alpha
    if (/^#[0-9A-F]{8}$/i.test(colorStr)) {
      const hex = colorStr.substring(0, 7);
      const alpha = parseInt(colorStr.substring(7), 16) / 255;
      return { hex, alpha };
    }

    // Check if it's rgba
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (rgbaMatch) {
      // Convert RGB to hex
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      const alpha = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
      return { hex, alpha };
    }

    // Just a regular hex color
    return { hex: colorStr, alpha: 1 };
  };

  // Handle color change
  const handleColorChange = e => {
    if (disabled) return;

    const newColor = e.target.value;
    setInternalColor(newColor);

    if (onChange) {
      onChange(newColor);
    }
  };

  // Handle alpha change
  const handleAlphaChange = e => {
    if (disabled) return;

    const newAlpha = parseFloat(e.target.value);
    const { hex } = parseColor(internalColor);

    // Convert hex and alpha to rgba
    const hexToRgb = hex => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgb = hexToRgb(hex);
    if (rgb) {
      const newColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${newAlpha})`;
      setInternalColor(newColor);

      if (onChange) {
        onChange(newColor);
      }
    }
  };

  // Toggle color picker dropdown
  const togglePicker = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get variant class based on prop
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-color-picker-primary';
      case 'minimal':
        return 'neu-color-picker-minimal';
      case 'inset':
        return 'neu-color-picker-inset';
      default:
        return '';
    }
  };

  // Get size class based on prop
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-color-picker-small';
      case 'large':
        return 'neu-color-picker-large';
      default:
        return '';
    }
  };

  // Extract color parts for display
  const { hex, alpha } = parseColor(internalColor);

  return (
    <div
      className={`
        neu-color-picker-container 
        ${getVariantClass()} 
        ${getSizeClass()} 
        ${disabled ? 'neu-color-picker-disabled' : ''} 
        ${className}
      `}
      style={style}
      ref={pickerRef}
    >
      {label && <label className="neu-color-picker-label">{label}</label>}

      <div className="neu-color-picker-swatch-container">
        <button
          type="button"
          className="neu-color-picker-swatch"
          style={{ backgroundColor: internalColor }}
          onClick={togglePicker}
          disabled={disabled}
          aria-label="Select color"
          aria-expanded={isOpen}
        >
          <span className="neu-color-picker-swatch-inner" />
        </button>

        <div className="neu-color-picker-value">{internalColor}</div>
      </div>

      {isOpen && (
        <div className="neu-color-picker-dropdown">
          <div className="neu-color-picker-controls">
            <input
              type="color"
              className="neu-color-picker-color-input"
              value={hex}
              onChange={handleColorChange}
              disabled={disabled}
              aria-label="Color"
            />

            {showAlpha && (
              <div className="neu-color-picker-alpha-container">
                <div
                  className="neu-color-picker-alpha-track"
                  style={{
                    background: `linear-gradient(to right, transparent, ${hex})`,
                  }}
                >
                  <input
                    type="range"
                    className="neu-color-picker-alpha-input"
                    min="0"
                    max="1"
                    step="0.01"
                    value={alpha}
                    onChange={handleAlphaChange}
                    disabled={disabled}
                    aria-label="Alpha (opacity)"
                  />
                </div>
                <div className="neu-color-picker-alpha-value">{Math.round(alpha * 100)}%</div>
              </div>
            )}
          </div>

          <div className="neu-color-picker-presets">
            {[
              '#f44336',
              '#e91e63',
              '#9c27b0',
              '#673ab7',
              '#3f51b5',
              '#2196f3',
              '#03a9f4',
              '#00bcd4',
              '#009688',
              '#4caf50',
              '#8bc34a',
              '#cddc39',
              '#ffeb3b',
              '#ffc107',
              '#ff9800',
              '#ff5722',
              '#795548',
              '#9e9e9e',
              '#607d8b',
            ].map(color => (
              <button
                key={color}
                className={`neu-color-picker-preset ${color === hex ? 'neu-color-picker-preset-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  handleColorChange({ target: { value: color } });
                  setIsOpen(false);
                }}
                aria-label={`Select color ${color}`}
                type="button"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

NeuColorPicker.propTypes = {
  /** Color value */
  value: PropTypes.string,
  /** Callback for when color changes */
  onChange: PropTypes.func,
  /** Label text */
  label: PropTypes.node,
  /** Whether to show alpha channel slider */
  showAlpha: PropTypes.bool,
  /** Styling variant */
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'inset']),
  /** Size variant */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Whether the color picker is disabled */
  disabled: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default NeuColorPicker;
