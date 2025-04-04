import { jsx as _jsx } from 'react/jsx-runtime';
import React, { useEffect, useRef } from 'react';
const withPerformanceTracking = (
  Component,
  {
    componentId = Component.displayName || Component.name || 'UnknownComponent',
    logToConsole = process.env.NODE_ENV === 'development',
    trackMounts = true,
  } = {}
) => {
  const wrappedDisplayName = `WithPerformanceTracking(${componentId})`;
  const WithPerformanceTracking = props => {
    const renderStart = useRef(0);
    const renderCount = useRef(0);
    const mountTime = useRef(null);
    const getPerformanceMonitor = () => {
      if (typeof window !== 'undefined') {
        return window.performanceMonitor;
      }
      return null;
    };
    renderStart.current = performance.now();
    renderCount.current += 1;
    useEffect(() => {
      if (!trackMounts) return;
      const mountDuration = performance.now() - renderStart.current;
      mountTime.current = performance.now();
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.trackOperationTiming('component', `${componentId}:mount`, mountDuration, {
          renderCount: renderCount.current,
        });
      }
      if (logToConsole) {
        console.log(`[Performance] ${componentId} mounted in ${mountDuration.toFixed(2)}ms`);
      }
      return () => {
        const unmountStart = performance.now();
        const unmountDuration = performance.now() - unmountStart;
        if (monitor) {
          monitor.trackOperationTiming('component', `${componentId}:unmount`, unmountDuration, {
            totalMountedTime: performance.now() - mountTime.current,
            renderCount: renderCount.current,
          });
        }
        if (logToConsole) {
          console.log(`[Performance] ${componentId} unmounted in ${unmountDuration.toFixed(2)}ms`);
          console.log(
            `[Performance] ${componentId} was mounted for ${(performance.now() - mountTime.current).toFixed(2)}ms`
          );
        }
      };
    }, []);
    useEffect(() => {
      const renderDuration = performance.now() - renderStart.current;
      const monitor = getPerformanceMonitor();
      if (monitor) {
        monitor.trackOperationTiming('component', `${componentId}:render`, renderDuration, {
          renderCount: renderCount.current,
        });
      }
      if (logToConsole && renderCount.current > 1) {
        console.log(
          `[Performance] ${componentId} re-render #${renderCount.current - 1} took ${renderDuration.toFixed(2)}ms`
        );
      }
    });
    return _jsx(Component, { ...props });
  };
  WithPerformanceTracking.displayName = wrappedDisplayName;
  return WithPerformanceTracking;
};
export default withPerformanceTracking;
//# sourceMappingURL=withPerformanceTracking.js.map
