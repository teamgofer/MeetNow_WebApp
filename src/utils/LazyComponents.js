import React, { lazy, Suspense } from 'react';

/**
 * Default loading component for lazy-loaded components
 */
export const DefaultLoadingComponent = ({ componentName = 'Component' }) => (
  <div className="lazy-loading-container">
    <div className="lazy-loading-content">
      <div className="loading-spinner"></div>
      <p>Loading {componentName}...</p>
    </div>
  </div>
);

/**
 * Creates a lazy-loaded component with customizable loading state
 * @param {Function} importFunc - Dynamic import function for the component
 * @param {string} componentName - Name of the component for display in loading state
 * @param {React.ComponentType} [LoadingComponent] - Custom loading component
 * @returns {React.LazyExoticComponent} - Lazy-loaded component wrapped in Suspense
 */
export const createLazyComponent = (importFunc, componentName, LoadingComponent = null) => {
  // Create the lazy component
  const LazyComponent = lazy(importFunc);

  // Create a component that handles suspense
  const LazyComponentWithSuspense = props => (
    <Suspense
      fallback={
        LoadingComponent ? (
          <LoadingComponent />
        ) : (
          <DefaultLoadingComponent componentName={componentName} />
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );

  // Set the display name
  LazyComponentWithSuspense.displayName = `Lazy(${componentName})`;

  return LazyComponentWithSuspense;
};

/**
 * A collection of lazy-loaded components for the application
 * Usage:
 *   import { LazyComponents } from '../utils/LazyComponents';
 *   <LazyComponents.PerformanceDashboard />
 */
export const LazyComponents = {
  /**
   * Lazy-loaded Performance Dashboard
   */
  PerformanceDashboard: createLazyComponent(
    () => import('../components/performance/PerformanceDashboard'),
    'PerformanceDashboard'
  ),

  /**
   * Lazy-loaded NearbyMeetups
   */
  NearbyMeetups: createLazyComponent(
    () => import('../components/meetup/NearbyMeetups'),
    'NearbyMeetups'
  ),

  /**
   * Lazy-loaded SearchFilter
   */
  SearchFilter: createLazyComponent(
    () => import('../components/filters/SearchFilter'),
    'SearchFilter'
  ),

  /**
   * Lazy-loaded MeetupDetails
   */
  MeetupDetails: createLazyComponent(
    () => import('../components/meetup/MeetupDetails'),
    'MeetupDetails'
  ),
};

/**
 * Creates a lazy-loaded route component
 * @param {Function} importFunc - Dynamic import function for the component
 * @param {string} componentName - Name of the component for display in loading state
 * @returns {React.LazyExoticComponent} - Lazy-loaded component for routing
 */
export const createLazyRoute = (importFunc, componentName) => {
  return createLazyComponent(importFunc, componentName);
};

// CSS for the default loading component
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .lazy-loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      width: 100%;
    }
    
    .lazy-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .loading-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-color, #4a6cf7);
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}
