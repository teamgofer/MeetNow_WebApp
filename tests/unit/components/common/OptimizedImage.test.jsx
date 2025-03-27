import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OptimizedImage from '../OptimizedImage';

// Mock the IntersectionObserver implementation
let intersectionObserverCallback;
beforeEach(() => {
  intersectionObserverCallback = null;
  window.IntersectionObserver = jest.fn((callback) => {
    intersectionObserverCallback = callback;
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });
});

// Mock withPerformanceTracking HOC
jest.mock('../../../hocs/withPerformanceTracking', () => (Component) => {
  const WithMockedPerformance = (props) => <Component {...props} />;
  WithMockedPerformance.displayName = `MockedPerformance(${Component.displayName || Component.name || 'Component'})`;
  return WithMockedPerformance;
});

describe('OptimizedImage Component', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    width: 300,
    height: 200,
  };

  test('renders with placeholder before image load', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    // Container should be rendered
    const container = screen.getByClassName('optimized-image-container');
    expect(container).toBeInTheDocument();
    
    // Default placeholder should be visible
    const placeholder = container.querySelector('.image-placeholder');
    expect(placeholder).toBeInTheDocument();
    
    // Image should not be visible yet as IntersectionObserver hasn't triggered
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  test('loads image when in viewport', () => {
    render(<OptimizedImage {...defaultProps} loading="eager" />);
    
    // With eager loading, image should be visible immediately
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/image.jpg');
    
    // Simulate image load
    fireEvent.load(img);
    
    // After loading, image should be visible and container should have data-loaded="true"
    const container = screen.getByClassName('optimized-image-container');
    expect(container.getAttribute('data-loaded')).toBe('true');
  });

  test('uses IntersectionObserver for lazy loading', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    // Image shouldn't be loaded yet
    expect(screen.queryByAltText('Test image')).not.toBeInTheDocument();
    
    // Simulate intersection
    act(() => {
      intersectionObserverCallback([{ isIntersecting: true }]);
    });
    
    // Now image should be loaded
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  test('shows error state when image fails to load', () => {
    render(<OptimizedImage {...defaultProps} />);
    
    // Simulate intersection
    act(() => {
      intersectionObserverCallback([{ isIntersecting: true }]);
    });
    
    const img = screen.getByAltText('Test image');
    
    // Simulate error
    fireEvent.error(img);
    
    // Container should have error state
    const container = screen.getByClassName('optimized-image-container');
    expect(container.getAttribute('data-error')).toBe('true');
    
    // Error message should be displayed
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });

  test('uses fallback when primary image fails', () => {
    const fallbackSrc = 'https://example.com/fallback.jpg';
    render(<OptimizedImage {...defaultProps} fallbackSrc={fallbackSrc} />);
    
    // Simulate intersection
    act(() => {
      intersectionObserverCallback([{ isIntersecting: true }]);
    });
    
    const img = screen.getByAltText('Test image');
    
    // Simulate error
    fireEvent.error(img);
    
    // Image src should be changed to fallback
    expect(img.src).toBe(fallbackSrc);
  });

  test('uses blurhash placeholder when provided', () => {
    const blurhash = 'data:image/png;base64,someBase64String';
    render(<OptimizedImage {...defaultProps} blurhash={blurhash} />);
    
    // Container should be rendered
    const container = screen.getByClassName('optimized-image-container');
    
    // Blurhash placeholder should be visible
    const placeholder = container.querySelector('.image-placeholder.blurhash');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.style.backgroundImage).toBe(`url(${blurhash})`);
  });

  test('calls onLoad callback when image loads', () => {
    const onLoad = jest.fn();
    render(<OptimizedImage {...defaultProps} onLoad={onLoad} loading="eager" />);
    
    const img = screen.getByAltText('Test image');
    
    // Simulate load
    fireEvent.load(img);
    
    // onLoad should be called
    expect(onLoad).toHaveBeenCalled();
  });

  test('calls onError callback when image fails', () => {
    const onError = jest.fn();
    render(<OptimizedImage {...defaultProps} onError={onError} loading="eager" />);
    
    const img = screen.getByAltText('Test image');
    
    // Simulate error
    fireEvent.error(img);
    
    // onError should be called
    expect(onError).toHaveBeenCalled();
  });
}); 