import type { ComponentType } from 'react';
import type { LoadingStateProps, MobileResponsiveProps, OfflineSupportProps } from './components';
export interface IWithLoadingOptions {
    loadingComponent?: ComponentType<LoadingStateProps>;
    loadingProps?: Partial<LoadingStateProps>;
}
export interface IWithMobileResponsiveOptions {
    breakpoints?: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
    orientationTimeout?: number;
}
export interface IWithOfflineSupportOptions {
    storage?: 'local' | 'session' | 'memory';
    retryAttempts?: number;
    retryDelay?: number;
}
export interface IWithErrorHandlingOptions {
    errorComponent?: ComponentType<{
        error: Error;
    }>;
    onError?: (error: Error) => void;
}
export interface IWithPerformanceTrackingOptions {
    trackingId?: string;
    sampleRate?: number;
    metrics?: string[];
}
export interface IWithExtractionMonitorOptions {
    monitorId?: string;
    interval?: number;
    threshold?: number;
}
export type TWithLoading = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithLoadingOptions) => ComponentType<P & LoadingStateProps>;
export type TWithMobileResponsive = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithMobileResponsiveOptions) => ComponentType<P & MobileResponsiveProps>;
export type TWithOfflineSupport = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithOfflineSupportOptions) => ComponentType<P & OfflineSupportProps>;
export type TWithErrorHandling = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithErrorHandlingOptions) => ComponentType<P>;
export type TWithPerformanceTracking = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithPerformanceTrackingOptions) => ComponentType<P>;
export type TWithExtractionMonitor = <P extends object>(WrappedComponent: ComponentType<P>, options?: WithExtractionMonitorOptions) => ComponentType<P>;
