import React from 'react';
import type { ReactNode } from 'react';
declare const Breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
};
export type TBreakpointKey = keyof typeof Breakpoints;
export type TOrientationType = 'portrait' | 'landscape';
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
    getResponsiveValue: <T>(values: Partial<Record<TBreakpointKey, T>> & {
        default: T;
    }) => T;
}
declare const MobileContext: React.Context<IMobileContextType | undefined>;
interface IMobileProviderProps {
    children: ReactNode;
}
export declare const MobileProvider: React.FC<IMobileProviderProps>;
export declare const useMobile: () => IMobileContextType;
export default MobileContext;
