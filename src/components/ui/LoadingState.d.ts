import React from 'react';
interface ILoadingStateProps {
    isLoading: boolean;
    children?: React.ReactNode;
    className?: string;
    overlay?: boolean;
    spinner?: boolean;
    text?: string;
    delay?: number;
    fade?: boolean;
}
declare const LoadingState: React.FC<ILoadingStateProps>;
interface ILoadingSkeletonProps {
    className?: string;
    lines?: number;
    height?: string;
    width?: string;
    rounded?: string;
}
export declare const LoadingSkeleton: React.FC<ILoadingSkeletonProps>;
interface ILoadingProgressProps {
    progress: number;
    className?: string;
    height?: string;
    rounded?: string;
    color?: string;
}
export declare const LoadingProgress: React.FC<ILoadingProgressProps>;
export default LoadingState;
