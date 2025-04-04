import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Carousel component
 * A customizable carousel/slider with neumorphic styling
 */
const NeuCarousel = ({
  slides = [],
  autoPlay = false,
  interval = 5000,
  showControls = true,
  showIndicators = true,
  animation = 'slide',
  variant = 'default',
  className = '',
  style = {},
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayIntervalRef = useRef(null);
  const slidesRef = useRef(null);

  // Set up autoplay interval
  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      autoPlayIntervalRef.current = setInterval(() => {
        goToNext();
      }, interval);
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [autoPlay, interval, activeIndex, slides.length]);

  // Handle transition end
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };

  // Go to specific slide index
  const goToSlide = index => {
    if (isTransitioning || index === activeIndex) return;

    // Reset autoplay timer
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      if (autoPlay) {
        autoPlayIntervalRef.current = setInterval(() => {
          goToNext();
        }, interval);
      }
    }

    setIsTransitioning(true);
    setActiveIndex(index);
  };

  // Go to previous slide
  const goToPrev = () => {
    const prevIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    goToSlide(prevIndex);
  };

  // Go to next slide
  const goToNext = () => {
    const nextIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    goToSlide(nextIndex);
  };

  // Get variant class based on prop
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-carousel-primary';
      case 'minimal':
        return 'neu-carousel-minimal';
      case 'inset':
        return 'neu-carousel-inset';
      case 'glass':
        return 'neu-carousel-glass';
      default:
        return '';
    }
  };

  // Get animation class based on prop
  const getAnimationClass = () => {
    switch (animation) {
      case 'fade':
        return 'neu-carousel-animation-fade';
      case 'zoom':
        return 'neu-carousel-animation-zoom';
      case 'slide':
      default:
        return 'neu-carousel-animation-slide';
    }
  };

  return (
    <div
      className={`
        neu-carousel 
        ${getVariantClass()} 
        ${getAnimationClass()} 
        ${className}
      `}
      style={style}
    >
      <div className="neu-carousel-slides" ref={slidesRef} onTransitionEnd={handleTransitionEnd}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`
              neu-carousel-slide 
              ${index === activeIndex ? 'neu-carousel-slide-active' : ''}
              ${isTransitioning ? 'neu-carousel-slide-transitioning' : ''}
            `}
            style={{
              transform:
                animation === 'slide' ? `translateX(${(index - activeIndex) * 100}%)` : undefined,
            }}
            aria-hidden={index !== activeIndex}
          >
            {slide}
          </div>
        ))}
      </div>

      {showControls && slides.length > 1 && (
        <div className="neu-carousel-controls">
          <button
            className="neu-carousel-control neu-carousel-control-prev"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5 19L8.5 12L15.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            className="neu-carousel-control neu-carousel-control-next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 5L15.5 12L8.5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {showIndicators && slides.length > 1 && (
        <div className="neu-carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`
                neu-carousel-indicator 
                ${index === activeIndex ? 'neu-carousel-indicator-active' : ''}
              `}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

NeuCarousel.propTypes = {
  /** Array of slide content */
  slides: PropTypes.arrayOf(PropTypes.node).isRequired,
  /** Whether to automatically cycle through slides */
  autoPlay: PropTypes.bool,
  /** Time between slide transitions (ms) */
  interval: PropTypes.number,
  /** Whether to show next/prev controls */
  showControls: PropTypes.bool,
  /** Whether to show indicator dots */
  showIndicators: PropTypes.bool,
  /** Animation type for transitions */
  animation: PropTypes.oneOf(['slide', 'fade', 'zoom']),
  /** Styling variant */
  variant: PropTypes.oneOf(['default', 'primary', 'minimal', 'inset', 'glass']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** Additional inline styles */
  style: PropTypes.object,
};

export default NeuCarousel;
