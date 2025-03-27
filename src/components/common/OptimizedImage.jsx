import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import withPerformanceTracking from '../../hocs/withPerformanceTracking';
import './OptimizedImage.css';

/**
 * OptimizedImage component for efficient image loading
 * - Lazy loads images when they enter the viewport
 * - Shows placeholders during loading
 * - Supports blurhash or color placeholders
 * - Provides progressive loading for large images
 * - Handles loading errors with fallbacks
 */
const OptimizedImage = ({
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
  threshold = 0.1,
  onLoad = () => {},
  onError = () => {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    // Skip if IntersectionObserver is not available (older browsers)
    if (!('IntersectionObserver' in window) || loading === 'eager') {
      setIsInView(true);
      return;
    }
    
    // Create observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // Disconnect once in view
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { threshold }
    );
    
    // Start observing
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }
    
    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, threshold]);
  
  // Handle successful image load
  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };
  
  // Handle image loading error
  const handleError = (e) => {
    setHasError(true);
    onError(e);
  };
  
  return (
    <div
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        backgroundColor: placeholderColor
      }}
      data-loaded={isLoaded}
      data-error={hasError}
    >
      {/* Blurhash placeholder if provided */}
      {blurhash && !isLoaded && (
        <div 
          className="image-placeholder blurhash"
          style={{ 
            backgroundImage: `url(${blurhash})` 
          }}
        />
      )}
      
      {/* Solid color placeholder */}
      {!blurhash && !isLoaded && (
        <div 
          className="image-placeholder color"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <>
          <img
            src={hasError && fallbackSrc ? fallbackSrc : src}
            alt={alt}
            className="optimized-image"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              objectFit
            }}
            onLoad={handleLoad}
            onError={handleError}
            width={width}
            height={height}
            loading={loading}
          />
          
          {/* Error overlay */}
          {hasError && !fallbackSrc && (
            <div className="image-error">
              <span className="error-icon">!</span>
              <span className="error-text">Failed to load image</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  placeholderColor: PropTypes.string,
  blurhash: PropTypes.string,
  fallbackSrc: PropTypes.string,
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  loading: PropTypes.oneOf(['lazy', 'eager']),
  threshold: PropTypes.number,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default withPerformanceTracking(OptimizedImage, { 
  componentId: 'OptimizedImage',
  trackMounts: false
}); 