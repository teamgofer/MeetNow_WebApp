import React from 'react';
import { LazyComponents } from '../../utils/LazyComponents';

/**
 * Performance dashboard routes component
 * This can be conditionally added to the main app component
 */
const PerformanceRoutes = () => {
  return (
    <div className="performance-routes">
      <LazyComponents.PerformanceDashboard />
    </div>
  );
};

export default PerformanceRoutes; 