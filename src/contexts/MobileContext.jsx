import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

// Breakpoint definitions
export const Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Mobile context
const MobileContext = createContext();

// Initial state
const initialState = {
  isMobile: window.innerWidth < Breakpoints.md,
  isTablet: window.innerWidth >= Breakpoints.md && window.innerWidth < Breakpoints.lg,
  isDesktop: window.innerWidth >= Breakpoints.lg,
  currentBreakpoint: getCurrentBreakpoint(window.innerWidth),
  orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
  isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
};

// Helper function to get current breakpoint
function getCurrentBreakpoint(width) {
  if (width < Breakpoints.sm) return 'xs';
  if (width < Breakpoints.md) return 'sm';
  if (width < Breakpoints.lg) return 'md';
  if (width < Breakpoints.xl) return 'lg';
  if (width < Breakpoints['2xl']) return 'xl';
  return '2xl';
}

// Action types
const ActionTypes = {
  SET_MOBILE: 'SET_MOBILE',
  SET_TABLET: 'SET_TABLET',
  SET_DESKTOP: 'SET_DESKTOP',
  SET_BREAKPOINT: 'SET_BREAKPOINT',
  SET_ORIENTATION: 'SET_ORIENTATION',
};

// Mobile reducer
const mobileReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_MOBILE:
      return {
        ...state,
        isMobile: action.isMobile,
      };
    case ActionTypes.SET_TABLET:
      return {
        ...state,
        isTablet: action.isTablet,
      };
    case ActionTypes.SET_DESKTOP:
      return {
        ...state,
        isDesktop: action.isDesktop,
      };
    case ActionTypes.SET_BREAKPOINT:
      return {
        ...state,
        currentBreakpoint: action.breakpoint,
      };
    case ActionTypes.SET_ORIENTATION:
      return {
        ...state,
        orientation: action.orientation,
      };
    default:
      return state;
  }
};

/**
 * Global mobile context provider component
 */
export const MobileProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mobileReducer, initialState);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update breakpoint
      const breakpoint = getCurrentBreakpoint(width);
      dispatch({ type: ActionTypes.SET_BREAKPOINT, breakpoint });

      // Update device type
      dispatch({ type: ActionTypes.SET_MOBILE, isMobile: width < Breakpoints.md });
      dispatch({
        type: ActionTypes.SET_TABLET,
        isTablet: width >= Breakpoints.md && width < Breakpoints.lg,
      });
      dispatch({ type: ActionTypes.SET_DESKTOP, isDesktop: width >= Breakpoints.lg });

      // Update orientation
      dispatch({
        type: ActionTypes.SET_ORIENTATION,
        orientation: height > width ? 'portrait' : 'landscape',
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if current breakpoint is above specified breakpoint
  const isAboveBreakpoint = useCallback(
    breakpoint => {
      return Breakpoints[state.currentBreakpoint] >= Breakpoints[breakpoint];
    },
    [state.currentBreakpoint]
  );

  // Check if current breakpoint is below specified breakpoint
  const isBelowBreakpoint = useCallback(
    breakpoint => {
      return Breakpoints[state.currentBreakpoint] < Breakpoints[breakpoint];
    },
    [state.currentBreakpoint]
  );

  // Get responsive value based on breakpoint
  const getResponsiveValue = useCallback(
    values => {
      const breakpoint = state.currentBreakpoint;
      return values[breakpoint] || values.default;
    },
    [state.currentBreakpoint]
  );

  const value = {
    ...state,
    isAboveBreakpoint,
    isBelowBreakpoint,
    getResponsiveValue,
  };

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
};

MobileProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use the mobile context
 */
export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

export default MobileContext;
