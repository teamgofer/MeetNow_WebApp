import { useState, useEffect } from 'react';

/**
 * Custom hook for handling media queries
 * @param {string} query - Media query string
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event) => {
      setMatches(event.matches);
    };

    // Add event listener
    if (mediaQuery.addListener) {
      // Support for older browsers
      mediaQuery.addListener(handler);
    } else {
      // Modern browsers
      mediaQuery.addEventListener('change', handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeListener) {
        // Support for older browsers
        mediaQuery.removeListener(handler);
      } else {
        // Modern browsers
        mediaQuery.removeEventListener('change', handler);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Predefined media query breakpoints
 */
export const breakpoints = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)'
};

/**
 * Hook to detect multiple media queries
 * @param {string[]} queries - Array of media query strings
 * @returns {Object} Object containing matches for each query
 */
export const useMediaQueries = (queries) => {
  const matches = {};
  
  queries.forEach(query => {
    matches[query] = useMediaQuery(query);
  });

  return matches;
};

/**
 * Hook to detect device type based on media queries
 * @returns {Object} Object containing device type information
 */
export const useDeviceType = () => {
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.desktop);
  const isTouch = useMediaQuery(breakpoints.touch);
  const isHover = useMediaQuery(breakpoints.hover);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isHover,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};

/**
 * Hook to detect system preferences
 * @returns {Object} Object containing system preference information
 */
export const useSystemPreferences = () => {
  const isDark = useMediaQuery(breakpoints.dark);
  const isLight = useMediaQuery(breakpoints.light);
  const prefersReducedMotion = useMediaQuery(breakpoints.reducedMotion);

  return {
    isDark,
    isLight,
    prefersReducedMotion,
    colorScheme: isDark ? 'dark' : 'light'
  };
};

/**
 * Hook to detect orientation
 * @returns {Object} Object containing orientation information
 */
export const useOrientation = () => {
  const isPortrait = useMediaQuery(breakpoints.portrait);
  const isLandscape = useMediaQuery(breakpoints.landscape);

  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape'
  };
}; 