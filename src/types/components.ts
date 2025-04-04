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
  /** Source URL of the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image container */
  width: number | string;
  /** Height of the image container */
  height: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Background color shown while image is loading */
  placeholderColor?: string;
  /** Base64 encoded blur hash for loading placeholder */
  blurhash?: string | null;
  /** Fallback image source if main image fails to load */
  fallbackSrc?: string | null;
  /** CSS object-fit property */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Image loading strategy */
  loading?: 'lazy' | 'eager';
  /** Intersection observer threshold */
  threshold?: number;
  /** Callback fired when image loads successfully */
  onLoad?: () => void;
  /** Callback fired when image fails to load */
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
