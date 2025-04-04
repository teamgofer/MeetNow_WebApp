import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
const Breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};
const initialState = {
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    currentBreakpoint: 'xs',
    orientation: 'portrait',
    isTouchDevice: false,
};
function getCurrentBreakpoint(width) {
    if (width >= Breakpoints['2xl'])
        return '2xl';
    if (width >= Breakpoints.xl)
        return 'xl';
    if (width >= Breakpoints.lg)
        return 'lg';
    if (width >= Breakpoints.md)
        return 'md';
    if (width >= Breakpoints.sm)
        return 'sm';
    return 'xs';
}
var EActionType;
(function (EActionType) {
    EActionType["SET_MOBILE"] = "SET_MOBILE";
    EActionType["SET_TABLET"] = "SET_TABLET";
    EActionType["SET_DESKTOP"] = "SET_DESKTOP";
    EActionType["SET_BREAKPOINT"] = "SET_BREAKPOINT";
    EActionType["SET_ORIENTATION"] = "SET_ORIENTATION";
})(EActionType || (EActionType = {}));
const MobileContext = createContext(undefined);
const mobileReducer = (state, action) => {
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
export const MobileProvider = ({ children }) => {
    const [state, dispatch] = useReducer(mobileReducer, initialState);
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const orientation = width > height ? 'landscape' : 'portrait';
            const breakpoint = getCurrentBreakpoint(width);
            dispatch({ type: EActionType.SET_MOBILE, isMobile: width < Breakpoints.md });
            dispatch({
                type: EActionType.SET_TABLET,
                isTablet: width >= Breakpoints.md && width < Breakpoints.lg,
            });
            dispatch({ type: EActionType.SET_DESKTOP, isDesktop: width >= Breakpoints.lg });
            dispatch({ type: EActionType.SET_BREAKPOINT, breakpoint });
            dispatch({ type: EActionType.SET_ORIENTATION, orientation });
        };
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        initialState.isTouchDevice = isTouchDevice;
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const isAboveBreakpoint = useCallback((breakpoint) => {
        return Breakpoints[state.currentBreakpoint] >= Breakpoints[breakpoint];
    }, [state.currentBreakpoint]);
    const isBelowBreakpoint = useCallback((breakpoint) => {
        return Breakpoints[state.currentBreakpoint] < Breakpoints[breakpoint];
    }, [state.currentBreakpoint]);
    const getResponsiveValue = useCallback((values) => {
        const breakpoint = state.currentBreakpoint;
        return values[breakpoint] ?? values.default;
    }, [state.currentBreakpoint]);
    const value = {
        ...state,
        isAboveBreakpoint,
        isBelowBreakpoint,
        getResponsiveValue,
    };
    return _jsx(MobileContext.Provider, { value: value, children: children });
};
export const useMobile = () => {
    const context = useContext(MobileContext);
    if (!context) {
        throw new Error('useMobile must be used within a MobileProvider');
    }
    return context;
};
export default MobileContext;
//# sourceMappingURL=MobileContext.js.map