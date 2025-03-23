import React from 'react';
import PropTypes from 'prop-types';
import './neumorphic.css';

/**
 * Neumorphic Skeleton component
 * A customizable loading skeleton with neumorphic styling and animation
 */
const NeuSkeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'shine',
  className = '',
  style = {},
}) => {
  // Determine variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return {
          width: width || '50px',
          height: height || '50px',
          borderRadius: '50%',
        };
      case 'button':
        return {
          width: width || '120px',
          height: height || '40px',
          borderRadius: '8px',
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || '100px',
          borderRadius: '12px',
        };
      case 'text':
      default:
        return {
          width: width || '100%',
          height: height || '1rem',
          borderRadius: '4px',
          marginBottom: '8px',
        };
    }
  };

  // Get animation class
  const getAnimationClass = () => {
    switch (animation) {
      case 'wave':
        return 'neu-skeleton-wave';
      case 'shine':
        return 'neu-skeleton-shine';
      case 'pulse':
        return 'neu-skeleton-pulse';
      case 'none':
      default:
        return '';
    }
  };

  // Generate multiple skeleton elements if count > 1
  const renderSkeletons = () => {
    const skeletons = [];
    const variantStyles = getVariantStyles();
    const animationClass = getAnimationClass();
    
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div 
          key={i}
          className={`neu-skeleton ${animationClass} ${className}`}
          style={{
            ...variantStyles,
            ...style,
          }}
          aria-hidden="true"
        />
      );
    }
    
    return skeletons;
  };

  return <>{renderSkeletons()}</>;
};

NeuSkeleton.propTypes = {
  /** The type of skeleton to render */
  variant: PropTypes.oneOf(['text', 'circle', 'button', 'card']),
  /** Custom width for the skeleton */
  width: PropTypes.string,
  /** Custom height for the skeleton */
  height: PropTypes.string,
  /** Number of skeleton elements to render */
  count: PropTypes.number,
  /** Animation type for the skeleton */
  animation: PropTypes.oneOf(['shine', 'wave', 'pulse', 'none']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default NeuSkeleton; 