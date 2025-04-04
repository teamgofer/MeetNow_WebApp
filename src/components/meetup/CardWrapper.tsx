import React, { ReactNode } from 'react';
import { getFeatureFlag } from '../../utils/feature-flags';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { breakpoints } from '../../hooks/useMediaQuery';

export type CardPosition =
  | 'top'
  | 'bottom'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right';

export interface CardWrapperProps {
  children: ReactNode;
  position?: CardPosition;
  isVisible?: boolean;
  className?: string;
  zIndex?: number;
  withAnimation?: boolean;
  animationType?: 'slide-down' | 'slide-up' | 'fade-in' | 'zoom-in';
  maxWidth?: string;
}

/**
 * A wrapper component for cards that handles positioning, visibility, and animations
 * Provides consistent positioning and appearance for all card components
 */
const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  position = 'top',
  withAnimation = true,
  className = '',
}) => {
  const shouldAnimate = withAnimation && getFeatureFlag('ENABLE_ANIMATIONS');
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);

  // Adjust position for mobile devices
  const getPositionClasses = () => {
    if (isMobile) {
      switch (position) {
        case 'top':
          return 'top-0 left-0 right-0 max-h-[85vh]';
        case 'bottom':
          return 'bottom-0 left-0 right-0 max-h-[85vh]';
        case 'left':
          return 'top-0 left-0 bottom-0 max-w-[85vw]';
        case 'right':
          return 'top-0 right-0 bottom-0 max-w-[85vw]';
        default:
          return 'top-0 left-0 right-0 max-h-[85vh]';
      }
    }

    // Desktop/tablet positions
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'left':
        return 'left-4 top-1/2 -translate-y-1/2';
      case 'right':
        return 'right-4 top-1/2 -translate-y-1/2';
      default:
        return 'top-4 left-1/2 -translate-x-1/2';
    }
  };

  // Adjust animation classes for mobile
  const getAnimationClasses = () => {
    if (!shouldAnimate) return '';

    if (isMobile) {
      switch (position) {
        case 'top':
          return 'animate-slide-down';
        case 'bottom':
          return 'animate-slide-up';
        case 'left':
          return 'animate-slide-right';
        case 'right':
          return 'animate-slide-left';
        default:
          return 'animate-slide-down';
      }
    }

    // Desktop/tablet animations
    switch (position) {
      case 'top':
        return 'animate-fade-in';
      case 'bottom':
        return 'animate-fade-in';
      case 'left':
        return 'animate-fade-in';
      case 'right':
        return 'animate-fade-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div
      className={`
        fixed z-50 bg-white rounded-lg shadow-lg overflow-hidden
        ${getPositionClasses()}
        ${getAnimationClasses()}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default CardWrapper;
