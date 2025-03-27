import React from 'react';
import { LazyComponents } from '../utils/LazyComponents';
import withPerformanceTracking from '../hocs/withPerformanceTracking';

/**
 * PerformancePage component that displays the performance dashboard
 */
const PerformancePage = () => {
  return (
    <div className="performance-page">
      <header className="performance-header">
        <h1>MeetNow Performance Dashboard</h1>
        <p>Real-time application metrics and performance monitoring</p>
      </header>
      
      <main className="performance-content">
        <LazyComponents.PerformanceDashboard />
      </main>
    </div>
  );
};

export default withPerformanceTracking(PerformancePage, {
  componentId: 'PerformancePage',
  logToConsole: false
}); 