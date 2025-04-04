import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Slider component
 * An interactive range slider with neumorphic styling
 */
const NeuSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 50,
  onChange,
  label,
  showValue = false,
  valuePrefix = '',
  valueSuffix = '',
  disabled = false,
  variant = 'default',
  size = 'medium',
  className = '',
  style = {},
}) => {
  // Handle controlled vs uncontrolled component
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(isControlled ? value : defaultValue);
  const actualValue = isControlled ? value : internalValue;

  // Refs for element measurements
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update internal value when controlled value changes
  useEffect(() => {
    if (isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  // Calculate percentage for positioning
  const calculatePercentage = val => {
    return ((val - min) / (max - min)) * 100;
  };

  const percentage = calculatePercentage(actualValue);

  // Handle value change
  const handleChange = newValue => {
    // Ensure the value stays within bounds and follows step
    const clampedValue = Math.min(max, Math.max(min, newValue));
    const steppedValue = Math.round((clampedValue - min) / step) * step + min;

    if (!isControlled) {
      setInternalValue(steppedValue);
    }

    if (onChange) {
      onChange(steppedValue);
    }
  };

  // Handle mouse/touch events for dragging
  const handleInteractionStart = clientX => {
    if (disabled) return;

    setIsDragging(true);
    updateValueFromPosition(clientX);

    // Add event listeners for move and end events
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  };

  const handleMove = e => {
    if (!isDragging) return;
    updateValueFromPosition(e.clientX);
  };

  const handleTouchMove = e => {
    if (!isDragging || !e.touches[0]) return;
    updateValueFromPosition(e.touches[0].clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);

    // Remove event listeners
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchend', handleEnd);
  };

  const updateValueFromPosition = clientX => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const position = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (position / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);

    handleChange(newValue);
  };

  // Handle mouse down events
  const handleMouseDown = e => {
    handleInteractionStart(e.clientX);
  };

  // Handle touch events
  const handleTouchStart = e => {
    if (!e.touches[0]) return;
    handleInteractionStart(e.touches[0].clientX);
  };

  // Get variant class based on prop
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-slider-primary';
      case 'success':
        return 'neu-slider-success';
      case 'danger':
        return 'neu-slider-danger';
      case 'warning':
        return 'neu-slider-warning';
      case 'info':
        return 'neu-slider-info';
      case 'gradient':
        return 'neu-slider-gradient';
      default:
        return '';
    }
  };

  // Get size class based on prop
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-slider-small';
      case 'large':
        return 'neu-slider-large';
      default:
        return '';
    }
  };

  // Format displayed value
  const formattedValue = `${valuePrefix}${actualValue}${valueSuffix}`;

  return (
    <div
      className={`
        neu-slider-container 
        ${getVariantClass()} 
        ${getSizeClass()} 
        ${disabled ? 'neu-slider-disabled' : ''} 
        ${className}
      `}
      style={style}
    >
      {label && (
        <div className="neu-slider-label">
          <span>{label}</span>
          {showValue && <span className="neu-slider-value">{formattedValue}</span>}
        </div>
      )}

      <div
        className="neu-slider-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="neu-slider-track-inner" aria-hidden="true">
          <div className="neu-slider-progress" style={{ width: `${percentage}%` }} />

          <div className="neu-slider-thumb" ref={thumbRef} style={{ left: `${percentage}%` }} />
        </div>
      </div>

      <input
        type="range"
        className="neu-slider-input"
        min={min}
        max={max}
        step={step}
        value={actualValue}
        onChange={e => handleChange(parseFloat(e.target.value))}
        disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={actualValue}
        aria-valuetext={formattedValue}
        aria-label={label || 'Slider'}
      />
    </div>
  );
};

NeuSlider.propTypes = {
  /** Minimum value */
  min: PropTypes.number,
  /** Maximum value */
  max: PropTypes.number,
  /** Step value */
  step: PropTypes.number,
  /** Current value (controlled) */
  value: PropTypes.number,
  /** Default value (uncontrolled) */
  defaultValue: PropTypes.number,
  /** Callback when value changes */
  onChange: PropTypes.func,
  /** Label text */
  label: PropTypes.node,
  /** Whether to show the current value */
  showValue: PropTypes.bool,
  /** Text to display before the value */
  valuePrefix: PropTypes.string,
  /** Text to display after the value */
  valueSuffix: PropTypes.string,
  /** Whether the slider is disabled */
  disabled: PropTypes.bool,
  /** Styling variant */
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'gradient',
  ]),
  /** Size variant */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default NeuSlider;
