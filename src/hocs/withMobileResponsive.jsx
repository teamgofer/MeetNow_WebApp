import PropTypes from 'prop-types';
import React from 'react';

import { useMobile } from '../contexts/MobileContext';

/**
 * Higher-order component that adds mobile responsiveness to a component
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Mobile responsive options
 * @param {boolean} [options.hideOnMobile=false] - Whether to hide component on mobile
 * @param {boolean} [options.hideOnDesktop=false] - Whether to hide component on desktop
 * @param {Object} [options.responsiveProps] - Props to apply based on breakpoint
 * @returns {React.Component} Wrapped component with mobile responsiveness
 */
const withMobileResponsive = (
  WrappedComponent,
  { hideOnMobile = false, hideOnDesktop = false, responsiveProps = {} } = {}
) => {
  const WithMobileResponsive = ({ ...props }) => {
    const {
      isMobile,
      isTablet,
      isDesktop,
      currentBreakpoint,
      orientation,
      isTouchDevice,
      isAboveBreakpoint,
      isBelowBreakpoint,
      getResponsiveValue,
    } = useMobile();

    // Apply responsive props
    const enhancedProps = {
      ...props,
      ...getResponsiveValue(responsiveProps),
      isMobile,
      isTablet,
      isDesktop,
      currentBreakpoint,
      orientation,
      isTouchDevice,
    };

    // Handle visibility based on device type
    if (hideOnMobile && isMobile) return null;
    if (hideOnDesktop && isDesktop) return null;

    return <WrappedComponent {...enhancedProps} />;
  };

  WithMobileResponsive.propTypes = {
    ...WrappedComponent.propTypes,
    isMobile: PropTypes.bool,
    isTablet: PropTypes.bool,
    isDesktop: PropTypes.bool,
    currentBreakpoint: PropTypes.string,
    orientation: PropTypes.string,
    isTouchDevice: PropTypes.bool,
  };

  WithMobileResponsive.displayName = `WithMobileResponsive(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithMobileResponsive;
};

export default withMobileResponsive;
