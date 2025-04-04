export interface IBreakpoints {
    mobile: string;
    tablet: string;
    desktop: string;
    dark: string;
    light: string;
    portrait: string;
    landscape: string;
    retina: string;
    touch: string;
    hover: string;
    reducedMotion: string;
}
export interface IDeviceType {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouch: boolean;
    isHover: boolean;
    deviceType: 'mobile' | 'tablet' | 'desktop';
}
export interface ISystemPreferences {
    isDark: boolean;
    isLight: boolean;
    prefersReducedMotion: boolean;
    colorScheme: 'dark' | 'light';
}
export interface IOrientation {
    isPortrait: boolean;
    isLandscape: boolean;
    orientation: 'portrait' | 'landscape';
}
export interface IMediaQueryMatches {
    [key: string]: boolean;
}
export declare const useMediaQuery: (query: string) => boolean;
export declare const breakpoints: IBreakpoints;
export declare const useMediaQueries: (queries: string[]) => IMediaQueryMatches;
export declare const useDeviceType: () => IDeviceType;
export declare const useSystemPreferences: () => ISystemPreferences;
export declare const useOrientation: () => IOrientation;
