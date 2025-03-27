import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import withSafeExtraction from '../../hocs/withSafeExtraction';
import { withExtractionMonitor } from '../../utils/extraction-monitor';
import { isFeatureEnabled } from '../../config/featureFlags';
import { useMeetupState, useUIState } from '../../contexts/ComponentStateContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * DistanceSlider component allows users to set search radius
 * This is extracted from the SearchFilter component
 */
const DistanceSlider = ({ className = '', initialValue = 5, min = 1, max = 50, onChange }) => {
  // Get responsive design information
  const { getResponsiveValue, isMobile } = useBreakpoint();
  
  // Access centralized state via hooks
  const { meetupState, meetupActions } = useMeetupState();
  const { uiState, uiActions } = useUIState();
  
  // Local state for slider value (controlled component)
  const [sliderValue, setSliderValue] = useState(
    meetupState.filters.distance || initialValue
  );
  
  // Memoized change handler to prevent rerenders
  const handleSliderChange = useCallback((e) => {
    const newValue = parseInt(e.target.value, 10);
    setSliderValue(newValue);
    
    // If onChange prop is provided, call it
    if (onChange) {
      onChange(newValue);
    }
    
    // Also update global state
    meetupActions.updateFilters({ distance: newValue });
    
    // Show loading state if needed
    if (uiState.isLoading !== true) {
      uiActions.setLoading(true);
      
      // Simulate API call delay (remove in production)
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          uiActions.setLoading(false);
        }, 500);
      }
    }
  }, [onChange, meetupActions, uiActions, uiState.isLoading]);
  
  // Sync with external state changes
  useEffect(() => {
    if (meetupState.filters.distance !== sliderValue) {
      setSliderValue(meetupState.filters.distance || initialValue);
    }
  }, [meetupState.filters.distance, initialValue, sliderValue]);
  
  // Responsive styling
  const sliderHeight = getResponsiveValue({
    xs: '36px',
    md: '44px',
    lg: '48px',
    default: '44px'
  });
  
  const thumbSize = getResponsiveValue({
    xs: '24px',
    md: '28px',
    lg: '32px',
    default: '28px'
  });
  
  const sliderStyle = {
    container: {
      padding: '12px 0',
      width: '100%'
    },
    slider: {
      width: '100%',
      height: sliderHeight,
      appearance: 'none',
      background: 'linear-gradient(to right, #4dbbbb 0%, #4dbbbb ' + (sliderValue - min) / (max - min) * 100 + '%, #e0e0e0 ' + (sliderValue - min) / (max - min) * 100 + '%, #e0e0e0 100%)',
      borderRadius: '8px',
      outline: 'none'
    },
    thumb: {
      appearance: 'none',
      width: thumbSize,
      height: thumbSize,
      borderRadius: '50%',
      background: '#ffffff',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      border: '2px solid #4dbbbb',
      transition: 'transform 0.1s ease'
    },
    label: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      fontSize: '14px'
    }
  };
  
  return (
    <div className={`distance-slider ${className}`} style={sliderStyle.container} data-testid="distance-slider">
      <div style={sliderStyle.label}>
        <span>Distance</span>
        <span data-testid="distance-value">{sliderValue} miles</span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        value={sliderValue}
        onChange={handleSliderChange}
        className="distance-slider-input"
        style={sliderStyle.slider}
        data-component-id="DistanceSlider"
        data-extracted={true}
      />
      
      {/* Display extraction mode in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="extraction-indicator">
          <small style={{ 
            fontSize: '8px',
            opacity: 0.5,
            textAlign: 'right',
            display: 'block',
            marginTop: '4px'
          }}>
            Extracted Component
          </small>
        </div>
      )}
    </div>
  );
};

DistanceSlider.propTypes = {
  className: PropTypes.string,
  initialValue: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func
};

// Apply high-order components for safe extraction
const DistanceSliderWithSafeExtraction = withSafeExtraction(DistanceSlider, {
  id: 'DistanceSlider',
  dependencies: [],
  errorBoundary: true,
  defaultProps: { initialValue: 5, min: 1, max: 50 }
});

// Apply extraction monitoring in development or if explicitly enabled
const EnhancedDistanceSlider = isFeatureEnabled('ENABLE_COMPONENT_REGISTRY') || process.env.NODE_ENV === 'development' 
  ? withExtractionMonitor(DistanceSliderWithSafeExtraction, 'DistanceSlider')
  : DistanceSliderWithSafeExtraction;

export default EnhancedDistanceSlider; 