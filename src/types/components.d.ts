import type { ReactNode } from 'react';
export interface ILocation {
    lat: number;
    lng: number;
    name?: string;
    display_name?: string;
    lon?: number;
}
export interface IMeetupData {
    title: string;
    description: string;
    lat: number;
    lng: number;
    address: string;
    max_participants: number;
    duration: number;
    start_time: string;
    image?: string | File;
    imageSignedUrl?: string;
}
export interface IBottomSheetProps {
    children: ReactNode;
    snapPoints: string[];
    initialSnapIndex?: number;
    onSnapChange?: (index: number) => void;
}
export interface IOptimizedImageProps {
    src: string;
    alt: string;
    width: number | string;
    height: number | string;
    className?: string;
    placeholderColor?: string;
    blurhash?: string | null;
    fallbackSrc?: string | null;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    loading?: 'lazy' | 'eager';
    threshold?: number;
    onLoad?: () => void;
    onError?: () => void;
}
export interface IDebugMenuProps {
    onShowPerformanceDashboard: () => void;
}
export interface ICreditsProps {
    user: {
        id: string;
        credits: number;
    };
    onCreditsUpdated: (newCredits: number) => void;
}
export interface IDebugConsoleProps {
    mapRef: any;
    mapNavigator: any;
    userLocation: Location | null;
    selectedLocation: Location | null;
    onNavigationTest: () => void;
}
export interface IErrorBoundaryProps {
    children: ReactNode;
}
export interface IErrorBoundaryState {
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}
export interface IModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}
export interface ILoadingStateProps {
    isLoading: boolean;
    children: ReactNode;
    className?: string;
    overlay?: boolean;
    spinner?: boolean;
    text?: string;
    delay?: number;
    fade?: boolean;
}
export interface IMobileResponsiveProps {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    isTouchDevice: boolean;
    currentBreakpoint: string;
}
export interface IOfflineSupportProps {
    isOffline: boolean;
    withOfflineOperation: <T>(operation: () => Promise<T>) => Promise<T>;
}
export interface ICategoryFilterProps {
    initialCategory?: string;
    onChange?: (category: string) => void;
    className?: string;
}
export interface IDistanceSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
}
