import { useState, useEffect, useCallback } from 'react';

// Standardized breakpoints that match CSS variables
const BREAKPOINTS = {
  xs: 375,  // iPhone SE
  sm: 414,  // iPhone 8 Plus
  md: 576,  // Small tablets
  lg: 768,  // Tablets
  xl: 1024, // Small laptops
  '2xl': 1536 // Large screens
};

/**
 * Enhanced hook for responsive design and device detection
 * @returns {Object} Responsive state and helper functions
 */
export const useBreakpoint = () => {
  // Current breakpoint state
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());
  // Device orientation
  const [orientation, setOrientation] = useState(
    window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  );
  // Touch capability detection
  const [isTouchDevice, setIsTouchDevice] = useState(
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
  // Safe area insets from notches
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: getCSSVar('--safe-area-top', '0px'),
    bottom: getCSSVar('--safe-area-bottom', '0px'),
    left: getCSSVar('--safe-area-left', '0px'),
    right: getCSSVar('--safe-area-right', '0px')
  });
  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Helper to get a CSS variable value
  function getCSSVar(name, fallback) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim() || fallback;
  }

  // Function to determine current breakpoint based on window width
  function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < BREAKPOINTS.xs) return 'xxs';
    if (width < BREAKPOINTS.sm) return 'xs';
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    if (width < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  }

  // Update responsive values on resize
  useEffect(() => {
    const handleResize = () => {
      // Update breakpoint
      setBreakpoint(getCurrentBreakpoint());
      
      // Update orientation
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
      
      // Update safe area insets
      setSafeAreaInsets({
        top: getCSSVar('--safe-area-top', '0px'),
        bottom: getCSSVar('--safe-area-bottom', '0px'),
        left: getCSSVar('--safe-area-left', '0px'),
        right: getCSSVar('--safe-area-right', '0px')
      });
    };

    // Use a more efficient resize handler with requestAnimationFrame
    let ticking = false;
    const throttledResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleResize();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Listen for window resize events
    window.addEventListener('resize', throttledResize);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleResize);
    
    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      setPrefersReducedMotion(e.matches);
    });

    // Initial update
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', handleResize);
      reducedMotionQuery.removeEventListener('change', (e) => {
        setPrefersReducedMotion(e.matches);
      });
    };
  }, []);

  // Check if viewport is at or above specific breakpoint
  const isAboveBreakpoint = useCallback((checkBreakpoint) => {
    const breakpointOrder = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    const checkIndex = breakpointOrder.indexOf(checkBreakpoint);
    return currentIndex >= checkIndex;
  }, [breakpoint]);

  // Check if viewport is at or below specific breakpoint
  const isBelowBreakpoint = useCallback((checkBreakpoint) => {
    const breakpointOrder = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    const checkIndex = breakpointOrder.indexOf(checkBreakpoint);
    return currentIndex <= checkIndex;
  }, [breakpoint]);

  // Get responsive value based on breakpoint
  const getResponsiveValue = useCallback((values) => {
    // Try exact breakpoint match first
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
    
    // Fallback to nearest smaller breakpoint
    const breakpointOrder = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs', 'xxs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Look for the nearest smaller breakpoint with a defined value
    for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
      const smallerBreakpoint = breakpointOrder[i];
      if (values[smallerBreakpoint] !== undefined) {
        return values[smallerBreakpoint];
      }
    }
    
    // If no smaller breakpoint value found, try larger breakpoints
    for (let i = currentIndex - 1; i >= 0; i--) {
      const largerBreakpoint = breakpointOrder[i];
      if (values[largerBreakpoint] !== undefined) {
        return values[largerBreakpoint];
      }
    }
    
    // Fallback to default or null
    return values.default || null;
  }, [breakpoint]);

  // Detect if device is mobile based on breakpoint
  const isMobile = breakpoint === 'xxs' || breakpoint === 'xs' || breakpoint === 'sm';
  
  // Detect if device is tablet
  const isTablet = breakpoint === 'md' || breakpoint === 'lg';
  
  // Detect if device is desktop
  const isDesktop = breakpoint === 'xl' || breakpoint === '2xl';

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isTouchDevice,
    isAboveBreakpoint,
    isBelowBreakpoint,
    getResponsiveValue,
    safeAreaInsets,
    prefersReducedMotion,
    breakpoints: BREAKPOINTS
  };
};

export default useBreakpoint; 