import React from 'react';
interface ProgressiveImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: string | number;
    height?: string | number;
    placeholderColor?: string;
    fallbackSrc?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    loading?: 'lazy' | 'eager';
    onLoad?: () => void;
    onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    id?: string;
}
declare const _default: React.NamedExoticComponent<ProgressiveImageProps>;
export default _default;
