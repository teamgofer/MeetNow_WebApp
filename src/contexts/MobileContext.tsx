import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

// Define breakpoints
const Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Define types
export type TBreakpointKey = keyof typeof Breakpoints;
export type TOrientationType = 'portrait' | 'landscape';

// Define interfaces
export interface IMobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: TBreakpointKey;
  orientation: TOrientationType;
  isTouchDevice: boolean;
}

export interface IMobileContextType extends IMobileState {
  isAboveBreakpoint: (breakpoint: TBreakpointKey) => boolean;
  isBelowBreakpoint: (breakpoint: TBreakpointKey) => boolean;
  getResponsiveValue: <T>(values: Partial<Record<TBreakpointKey, T>> & { default: T }) => T;
}

// Initial state
const initialState: IMobileState = {
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  currentBreakpoint: 'xs',
  orientation: 'portrait',
  isTouchDevice: false,
};

/**
 * Helper to determine current breakpoint based on window width
 */
function getCurrentBreakpoint(width: number): TBreakpointKey {
  if (width >= Breakpoints['2xl']) return '2xl';
  if (width >= Breakpoints.xl) return 'xl';
  if (width >= Breakpoints.lg) return 'lg';
  if (width >= Breakpoints.md) return 'md';
  if (width >= Breakpoints.sm) return 'sm';
  return 'xs';
}

// Action types
enum EActionType {
  SET_MOBILE = 'SET_MOBILE',
  SET_TABLET = 'SET_TABLET',
  SET_DESKTOP = 'SET_DESKTOP',
  SET_BREAKPOINT = 'SET_BREAKPOINT',
  SET_ORIENTATION = 'SET_ORIENTATION',
}

// Define action interfaces
interface ISetMobileAction {
  type: EActionType.SET_MOBILE;
  isMobile: boolean;
}

interface ISetTabletAction {
  type: EActionType.SET_TABLET;
  isTablet: boolean;
}

interface ISetDesktopAction {
  type: EActionType.SET_DESKTOP;
  isDesktop: boolean;
}

interface ISetBreakpointAction {
  type: EActionType.SET_BREAKPOINT;
  breakpoint: TBreakpointKey;
}

interface ISetOrientationAction {
  type: EActionType.SET_ORIENTATION;
  orientation: TOrientationType;
}

type TMobileAction =
  | ISetMobileAction
  | ISetTabletAction
  | ISetDesktopAction
  | ISetBreakpointAction
  | ISetOrientationAction;

// Create context
const MobileContext = createContext<IMobileContextType | undefined>(undefined);

// Mobile reducer
const mobileReducer = (state: IMobileState, action: TMobileAction): IMobileState => {
  switch (action.type) {
    case EActionType.SET_MOBILE:
      return {
        ...state,
        isMobile: action.isMobile,
      };
    case EActionType.SET_TABLET:
      return {
        ...state,
        isTablet: action.isTablet,
      };
    case EActionType.SET_DESKTOP:
      return {
        ...state,
        isDesktop: action.isDesktop,
      };
    case EActionType.SET_BREAKPOINT:
      return {
        ...state,
        currentBreakpoint: action.breakpoint,
      };
    case EActionType.SET_ORIENTATION:
      return {
        ...state,
        orientation: action.orientation,
      };
    default:
      return state;
  }
};

interface IMobileProviderProps {
  children: ReactNode;
}

// Provider component
export const MobileProvider: React.FC<IMobileProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mobileReducer, initialState);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation: TOrientationType = width > height ? 'landscape' : 'portrait';
      const breakpoint = getCurrentBreakpoint(width);

      // Update state with current device information
      dispatch({ type: EActionType.SET_MOBILE, isMobile: width < Breakpoints.md });
      dispatch({
        type: EActionType.SET_TABLET,
        isTablet: width >= Breakpoints.md && width < Breakpoints.lg,
      });
      dispatch({ type: EActionType.SET_DESKTOP, isDesktop: width >= Breakpoints.lg });
      dispatch({ type: EActionType.SET_BREAKPOINT, breakpoint });
      dispatch({ type: EActionType.SET_ORIENTATION, orientation });
    };

    // Detect if device is touch-enabled
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    initialState.isTouchDevice = isTouchDevice;

    // Set initial sizes
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check if current breakpoint is above specified breakpoint
  const isAboveBreakpoint = useCallback(
    (breakpoint: TBreakpointKey): boolean => {
      return Breakpoints[state.currentBreakpoint] >= Breakpoints[breakpoint];
    },
    [state.currentBreakpoint]
  );

  // Check if current breakpoint is below specified breakpoint
  const isBelowBreakpoint = useCallback(
    (breakpoint: TBreakpointKey): boolean => {
      return Breakpoints[state.currentBreakpoint] < Breakpoints[breakpoint];
    },
    [state.currentBreakpoint]
  );

  // Get responsive value based on breakpoint
  const getResponsiveValue = useCallback(
    <T,>(values: Partial<Record<TBreakpointKey, T>> & { default: T }): T => {
      const breakpoint = state.currentBreakpoint;
      return values[breakpoint] ?? values.default;
    },
    [state.currentBreakpoint]
  );

  const value: IMobileContextType = {
    ...state,
    isAboveBreakpoint,
    isBelowBreakpoint,
    getResponsiveValue,
  };

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
};

/**
 * Custom hook to use the mobile context
 */
export const useMobile = (): IMobileContextType => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

export default MobileContext;
