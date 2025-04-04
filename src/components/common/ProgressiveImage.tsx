import React, { useState, useEffect, useRef } from 'react';

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

/**
 * ProgressiveImage component for optimized image loading
 * - Implements lazy loading using intersection observer
 * - Shows color placeholder while loading
 * - Handles loading errors with fallback image
 * - Provides smooth transitions between loading states
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  width = '100%',
  height = 'auto',
  placeholderColor = '#f0f0f0',
  fallbackSrc,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  id,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    // Skip if IntersectionObserver is not available or eager loading is requested
    if (!window.IntersectionObserver || loading === 'eager') {
      setIsInView(true);
      return;
    }

    // Create and configure intersection observer
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries.length === 0) return;
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          // Disconnect once in view for cleanup
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { threshold: 0.1 } // Start loading when 10% visible
    );

    // Start observing the container
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading]);

  // Handle successful image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image loading error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);

    // Apply fallback image if provided
    if (fallbackSrc && e.currentTarget) {
      e.currentTarget.src = fallbackSrc;
    }

    if (onError) onError(e);
  };

  return (
    <div
      ref={imgRef}
      className={`progressive-image-container relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        backgroundColor: placeholderColor,
        position: 'relative',
      }}
    >
      {/* Placeholder shown while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}

      {/* Only render image once in view (for lazy loading) */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full transition-opacity duration-500"
          style={{
            opacity: isLoaded ? 1 : 0,
            objectFit,
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          id={id}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="text-gray-500 text-sm text-center p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mx-auto mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Failed to load image
          </div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ProgressiveImageProps, nextProps: ProgressiveImageProps) => {
  // Most important props that should trigger a re-render if changed
  if (prevProps.src !== nextProps.src) return false;
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.alt !== nextProps.alt) return false;
  if (prevProps.loading !== nextProps.loading) return false;

  // Style-related props
  if (prevProps.width !== nextProps.width) return false;
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.objectFit !== nextProps.objectFit) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.placeholderColor !== nextProps.placeholderColor) return false;

  // Ignore certain props, as they shouldn't cause re-renders
  // e.g., onLoad and onError functions can be safely ignored if they're stable callbacks

  return true;
};

export default React.memo(ProgressiveImage, arePropsEqual);
