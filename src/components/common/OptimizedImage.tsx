import React, { useState, useEffect, useRef } from 'react';

import withPerformanceTracking from '../../hocs/withPerformanceTracking';
import type { IOptimizedImageProps } from '../../types';

const OptimizedImage: React.FC<IOptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#f0f0f0',
  blurhash = null,
  fallbackSrc = null,
  objectFit = 'cover',
  loading = 'lazy',
  threshold = 0.01,
  onLoad = () => {},
  onError = () => {},
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imgRef.current || !loading || loading === 'eager') return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (imgRef.current) {
              imgRef.current.src = src;
            }
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      { threshold }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, loading, threshold]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    if (fallbackSrc) {
      (e.target as HTMLImageElement).src = fallbackSrc;
    }
    onError();
  };

  return (
    <div
      className={`optimized-image-container relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        backgroundColor: placeholderColor,
      }}
    >
      {blurhash && !isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${blurhash})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <img
        ref={imgRef}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        alt={alt}
        width={width}
        height={height}
        src={loading === 'eager' ? src : ''}
        style={{
          objectFit: objectFit,
        }}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default withPerformanceTracking(OptimizedImage as any, {
  componentId: 'OptimizedImage',
  trackMounts: false,
  logToConsole: false,
});
