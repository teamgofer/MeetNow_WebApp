import React, { useEffect, useRef } from 'react';

/**
 * Higher-order component for tracking component render performance
 * @param {React.ComponentType} Component - Component to track
 * @param {Object} options - Configuration options
 * @param {string} options.componentId - Unique identifier for the component
 * @param {boolean} options.logToConsole - Whether to log performance data to console
 * @param {boolean} options.trackMounts - Whether to track mount/unmount timing
 * @returns {React.ComponentType} - Wrapped component with performance tracking
 */
const withPerformanceTracking = (
  Component, 
  { 
    componentId = Component.displayName || Component.name || 'UnknownComponent',
    logToConsole = process.env.NODE_ENV === 'development',
    trackMounts = true
  } = {}
) => {
  // Create a display name for the wrapped component
  const wrappedDisplayName = `WithPerformanceTracking(${componentId})`;
  
  // The wrapped component
  const WithPerformanceTracking = (props) => {
    // Store render timing information
    const renderStart = useRef(0);
    const renderCount = useRef(0);
    const mountTime = useRef(null);
    
    // Get PerformanceMonitor if it exists (might not be available)
    const getPerformanceMonitor = () => {
      if (typeof window !== 'undefined') {
        return window.performanceMonitor;
      }
      return null;
    };
    
    // Track render start time
    renderStart.current = performance.now();
    renderCount.current += 1;
    
    // Track mount and unmount times
    useEffect(() => {
      if (!trackMounts) return;
      
      const mountDuration = performance.now() - renderStart.current;
      mountTime.current = performance.now();
      
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.trackOperationTiming('component', `${componentId}:mount`, mountDuration, {
          renderCount: renderCount.current
        });
      }
      
      if (logToConsole) {
        console.log(`[Performance] ${componentId} mounted in ${mountDuration.toFixed(2)}ms`);
      }
      
      // Track unmount time
      return () => {
        const unmountStart = performance.now();
        const unmountDuration = performance.now() - unmountStart;
        
        if (monitor) {
          monitor.trackOperationTiming('component', `${componentId}:unmount`, unmountDuration, {
            totalMountedTime: performance.now() - mountTime.current,
            renderCount: renderCount.current
          });
        }
        
        if (logToConsole) {
          console.log(`[Performance] ${componentId} unmounted in ${unmountDuration.toFixed(2)}ms`);
          console.log(`[Performance] ${componentId} was mounted for ${(performance.now() - mountTime.current).toFixed(2)}ms`);
        }
      };
    }, []);
    
    // Track render complete time
    useEffect(() => {
      const renderDuration = performance.now() - renderStart.current;
      
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.trackOperationTiming('component', `${componentId}:render`, renderDuration, {
          renderCount: renderCount.current
        });
      }
      
      if (logToConsole && renderCount.current > 1) {
        console.log(`[Performance] ${componentId} re-render #${renderCount.current - 1} took ${renderDuration.toFixed(2)}ms`);
      }
    });
    
    // Render the wrapped component
    return <Component {...props} />;
  };
  
  // Set the display name for DevTools
  WithPerformanceTracking.displayName = wrappedDisplayName;
  
  return WithPerformanceTracking;
};

export default withPerformanceTracking; 