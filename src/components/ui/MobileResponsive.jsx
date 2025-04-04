import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import { FaMobile, FaDesktop } from 'react-icons/fa';

import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * Component to handle mobile responsiveness and touch interactions
 */
const MobileResponsive = ({
  children,
  className = '',
  breakpoints = {
    mobile: '(max-width: 640px)',
    tablet: '(min-width: 641px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)',
  },
  onBreakpointChange,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Use media queries to detect screen size
  const isMobileQuery = useMediaQuery(breakpoints.mobile);
  const isTabletQuery = useMediaQuery(breakpoints.tablet);
  const isDesktopQuery = useMediaQuery(breakpoints.desktop);

  // Update breakpoint states
  useEffect(() => {
    setIsMobile(isMobileQuery);
    setIsTablet(isTabletQuery);
    setIsDesktop(isDesktopQuery);

    if (onBreakpointChange) {
      onBreakpointChange({
        isMobile: isMobileQuery,
        isTablet: isTabletQuery,
        isDesktop: isDesktopQuery,
      });
    }
  }, [isMobileQuery, isTabletQuery, isDesktopQuery, onBreakpointChange]);

  // Handle touch events
  const handleTouchStart = useCallback(event => {
    setTouchStart(event.touches[0].clientY);
    setIsScrolling(false);
  }, []);

  const handleTouchMove = useCallback(
    event => {
      if (!touchStart) return;

      const touchEnd = event.touches[0].clientY;
      const diff = touchStart - touchEnd;

      // If the difference is significant, mark as scrolling
      if (Math.abs(diff) > 10) {
        setIsScrolling(true);
      }

      setTouchEnd(touchEnd);
    },
    [touchStart]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setTouchEnd(null);
    setIsScrolling(false);
  }, []);

  // Get responsive classes based on breakpoint
  const getResponsiveClasses = () => {
    const baseClasses = 'transition-all duration-300';
    const mobileClasses = isMobile ? 'w-full' : '';
    const tabletClasses = isTablet ? 'w-full max-w-2xl mx-auto' : '';
    const desktopClasses = isDesktop ? 'w-full max-w-4xl mx-auto' : '';

    return `${baseClasses} ${mobileClasses} ${tabletClasses} ${desktopClasses}`;
  };

  // Get device icon based on breakpoint
  const getDeviceIcon = () => {
    if (isMobile) return <FaMobile className="w-5 h-5" />;
    if (isTablet) return <FaMobile className="w-6 h-6" />;
    return <FaDesktop className="w-6 h-6" />;
  };

  return (
    <div
      className={`${getResponsiveClasses()} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Device indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full flex items-center space-x-2 text-xs">
          {getDeviceIcon()}
          <span>{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</span>
        </div>
      )}

      {/* Render children with responsive context */}
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              isMobile,
              isTablet,
              isDesktop,
              isScrolling,
            })
          : child
      )}
    </div>
  );
};

MobileResponsive.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  breakpoints: PropTypes.shape({
    mobile: PropTypes.string,
    tablet: PropTypes.string,
    desktop: PropTypes.string,
  }),
  onBreakpointChange: PropTypes.func,
};

export default MobileResponsive;
