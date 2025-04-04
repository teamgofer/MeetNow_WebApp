import { useState, useEffect } from 'react';
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);
        const handler = (event) => {
            setMatches(event.matches);
        };
        if (mediaQuery.addListener) {
            mediaQuery.addListener(handler);
        }
        else {
            mediaQuery.addEventListener('change', handler);
        }
        return () => {
            if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handler);
            }
            else {
                mediaQuery.removeEventListener('change', handler);
            }
        };
    }, [query]);
    return matches;
};
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
    reducedMotion: '(prefers-reduced-motion: reduce)',
};
export const useMediaQueries = (queries) => {
    const matches = {};
    queries.forEach(query => {
        matches[query] = useMediaQuery(query);
    });
    return matches;
};
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
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    };
};
export const useSystemPreferences = () => {
    const isDark = useMediaQuery(breakpoints.dark);
    const isLight = useMediaQuery(breakpoints.light);
    const prefersReducedMotion = useMediaQuery(breakpoints.reducedMotion);
    return {
        isDark,
        isLight,
        prefersReducedMotion,
        colorScheme: isDark ? 'dark' : 'light',
    };
};
export const useOrientation = () => {
    const isPortrait = useMediaQuery(breakpoints.portrait);
    const isLandscape = useMediaQuery(breakpoints.landscape);
    return {
        isPortrait,
        isLandscape,
        orientation: isPortrait ? 'portrait' : 'landscape',
    };
};
//# sourceMappingURL=useMediaQuery.js.map