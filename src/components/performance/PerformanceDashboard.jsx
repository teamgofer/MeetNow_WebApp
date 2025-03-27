import React, { useState, useEffect, useMemo } from 'react';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';
import { getPerformanceMetrics, getExtractionStatus } from '../../utils/extraction-monitor';
import './performance-dashboard.css';

/**
 * Performance Dashboard component for visualizing application performance metrics
 */
const PerformanceDashboard = () => {
  // State for metrics
  const [metrics, setMetrics] = useState(null);
  const [extractionMetrics, setExtractionMetrics] = useState(null);
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get PerformanceMonitor instance (singleton)
  const performanceMonitor = useMemo(() => {
    try {
      // Access existing instance if available
      return window.performanceMonitor || new PerformanceMonitor();
    } catch (err) {
      console.error('Failed to access performance monitor:', err);
      return null;
    }
  }, []);
  
  // Fetch metrics when the dashboard is opened
  useEffect(() => {
    if (performanceMonitor) {
      const summary = performanceMonitor.getSummary();
      setMetrics(summary);
    }
    
    // Get extraction metrics
    try {
      const extractionData = getPerformanceMetrics();
      const detailedStatus = getExtractionStatus();
      setExtractionMetrics({
        summary: extractionData,
        details: detailedStatus
      });
    } catch (err) {
      console.error('Failed to get extraction metrics:', err);
    }
  }, [performanceMonitor, refreshTime]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTime(new Date());
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };
  
  // Format duration for display
  const formatDuration = (ms) => {
    if (ms === null || ms === undefined) return 'N/A';
    return ms < 1 ? `${(ms * 1000).toFixed(2)}μs` : `${ms.toFixed(2)}ms`;
  };
  
  // Format memory size for display
  const formatMemory = (bytes) => {
    if (bytes === null || bytes === undefined) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };
  
  // If metrics aren't loaded yet, show loading state
  if (!metrics || !extractionMetrics) {
    return (
      <div className="performance-dashboard">
        <h2>Performance Dashboard</h2>
        <p>Loading metrics...</p>
      </div>
    );
  }
  
  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h2>Performance Dashboard</h2>
        <div className="dashboard-controls">
          <button onClick={handleRefresh}>Refresh</button>
          <span className="last-updated">
            Last updated: {formatDate(refreshTime)}
          </span>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'api' ? 'active' : ''} 
          onClick={() => setActiveTab('api')}
        >
          API Calls
        </button>
        <button 
          className={activeTab === 'components' ? 'active' : ''} 
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button 
          className={activeTab === 'memory' ? 'active' : ''} 
          onClick={() => setActiveTab('memory')}
        >
          Memory
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>API Calls</h3>
                <div className="metric-value">{metrics.apiCalls.totalCalls}</div>
                <div className="metric-detail">Success rate: {(metrics.apiCalls.successRate * 100).toFixed(1)}%</div>
                <div className="metric-detail">Avg. duration: {formatDuration(metrics.apiCalls.averageDuration)}</div>
              </div>
              
              <div className="metric-card">
                <h3>Cache Performance</h3>
                <div className="metric-value">{(metrics.cache.hitRate * 100).toFixed(1)}%</div>
                <div className="metric-detail">Hit rate</div>
                <div className="metric-detail">Total size: {formatMemory(metrics.cache.totalSize)}</div>
              </div>
              
              <div className="metric-card">
                <h3>Component Extraction</h3>
                <div className="metric-value">
                  {extractionMetrics.summary.totalExtracted}/{extractionMetrics.details.length}
                </div>
                <div className="metric-detail">Components extracted</div>
                <div className="metric-detail">Avg. render time: {formatDuration(extractionMetrics.summary.averageRenderTime)}</div>
              </div>
              
              <div className="metric-card">
                <h3>Error Rate</h3>
                <div className="metric-value">{metrics.errors.totalErrors}</div>
                <div className="metric-detail">Total errors</div>
                <div className="metric-detail">Most common: {metrics.errors.mostCommonError || 'None'}</div>
              </div>
            </div>
            
            <div className="metrics-warnings">
              <h3>Warnings & Recommendations</h3>
              <ul className="warnings-list">
                {metrics.warnings.length > 0 ? (
                  metrics.warnings.map((warning, index) => (
                    <li key={index} className={`warning-item ${warning.severity}`}>
                      <span className="warning-severity">{warning.severity}</span>
                      <span className="warning-message">{warning.message}</span>
                    </li>
                  ))
                ) : (
                  <li className="warning-item info">
                    <span className="warning-severity">INFO</span>
                    <span className="warning-message">No performance warnings detected</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'api' && (
          <div className="api-tab">
            <h3>API Call Performance</h3>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Operation</th>
                  <th>Calls</th>
                  <th>Avg. Duration</th>
                  <th>Success Rate</th>
                  <th>Last Called</th>
                </tr>
              </thead>
              <tbody>
                {metrics.apiCalls.details.map((api, index) => (
                  <tr key={index}>
                    <td>{api.service}</td>
                    <td>{api.operation}</td>
                    <td>{api.calls}</td>
                    <td>{formatDuration(api.averageDuration)}</td>
                    <td>{(api.successRate * 100).toFixed(1)}%</td>
                    <td>{formatDate(api.lastCalled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'components' && (
          <div className="components-tab">
            <h3>Component Performance</h3>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Extracted</th>
                  <th>Enabled</th>
                  <th>Render Count</th>
                  <th>Avg. Render Time</th>
                  <th>Error Count</th>
                  <th>Last Rendered</th>
                </tr>
              </thead>
              <tbody>
                {extractionMetrics.details.map((component, index) => (
                  <tr key={index} className={component.isExtracted ? (component.isEnabled ? 'enabled' : 'disabled') : ''}>
                    <td>{component.componentId}</td>
                    <td>{component.isExtracted ? '✅' : '❌'}</td>
                    <td>{component.isEnabled ? '✅' : '❌'}</td>
                    <td>{component.renderCount}</td>
                    <td>{formatDuration(component.averageRenderTime)}</td>
                    <td>{component.errorCount}</td>
                    <td>{formatDate(component.lastRenderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'memory' && (
          <div className="memory-tab">
            <h3>Memory Usage</h3>
            <div className="memory-overview">
              <div className="metric-card">
                <h4>Total Memory Usage</h4>
                <div className="metric-value">{formatMemory(metrics.memory.totalUsage)}</div>
                <div className="metric-detail">
                  {(metrics.memory.totalUsage / metrics.memory.limit * 100).toFixed(1)}% of limit
                </div>
              </div>
              
              <div className="metric-card">
                <h4>Cache Memory</h4>
                <div className="metric-value">{formatMemory(metrics.cache.totalSize)}</div>
                <div className="metric-detail">
                  {(metrics.cache.totalSize / metrics.memory.totalUsage * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
            
            <h4>Memory Usage by Category</h4>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Usage</th>
                  <th>% of Total</th>
                  <th>Peak Usage</th>
                </tr>
              </thead>
              <tbody>
                {metrics.memory.categoryBreakdown.map((category, index) => (
                  <tr key={index}>
                    <td>{category.name}</td>
                    <td>{formatMemory(category.usage)}</td>
                    <td>{(category.usage / metrics.memory.totalUsage * 100).toFixed(1)}%</td>
                    <td>{formatMemory(category.peakUsage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard; 