/**
 * Utilities for monitoring component extraction progress and diagnostics
 */
import { isFeatureEnabled } from '../config/featureFlags';
import { componentDependencyMap, getStateDependencies } from './component-analysis';

// Track extracted components and their rendering status
const extractedComponents = new Map();
const renderingStatistics = new Map();

/**
 * Register a component as extracted
 * @param {string} componentId - The component ID
 * @param {Object} metadata - Additional metadata about the component
 */
export const registerExtractedComponent = (componentId, metadata = {}) => {
  extractedComponents.set(componentId, {
    extractedAt: new Date(),
    renderCount: 0,
    errorCount: 0,
    lastRenderDuration: 0,
    featureFlagEnabled: isFeatureEnabled(`USE_EXTRACTED_${componentId.toUpperCase()}`),
    ...metadata
  });
  
  // Initialize rendering statistics
  if (!renderingStatistics.has(componentId)) {
    renderingStatistics.set(componentId, {
      renderTimes: [],
      errorEvents: [],
      lastRenderAt: null
    });
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Extraction] Registered component: ${componentId}`);
  }
};

/**
 * Track component render events
 * @param {string} componentId - The component ID
 * @param {number} renderDuration - The time it took to render in ms
 */
export const trackComponentRender = (componentId, renderDuration) => {
  if (!extractedComponents.has(componentId)) {
    registerExtractedComponent(componentId);
  }
  
  // Update component metadata
  const metadata = extractedComponents.get(componentId);
  metadata.renderCount++;
  metadata.lastRenderDuration = renderDuration;
  extractedComponents.set(componentId, metadata);
  
  // Update rendering statistics
  const stats = renderingStatistics.get(componentId);
  stats.renderTimes.push({
    timestamp: new Date(),
    duration: renderDuration
  });
  stats.lastRenderAt = new Date();
  
  // Keep only the last 10 render times
  if (stats.renderTimes.length > 10) {
    stats.renderTimes.shift();
  }
  
  renderingStatistics.set(componentId, stats);
};

/**
 * Track component errors
 * @param {string} componentId - The component ID
 * @param {Error} error - The error that occurred
 */
export const trackComponentError = (componentId, error) => {
  if (!extractedComponents.has(componentId)) {
    registerExtractedComponent(componentId);
  }
  
  // Update component metadata
  const metadata = extractedComponents.get(componentId);
  metadata.errorCount++;
  extractedComponents.set(componentId, metadata);
  
  // Update rendering statistics
  const stats = renderingStatistics.get(componentId);
  stats.errorEvents.push({
    timestamp: new Date(),
    error: error.message,
    stack: error.stack
  });
  
  // Keep only the last 5 errors
  if (stats.errorEvents.length > 5) {
    stats.errorEvents.shift();
  }
  
  renderingStatistics.set(componentId, stats);
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Extraction] Error in component ${componentId}:`, error);
  }
};

/**
 * Get extraction status for all components
 * @returns {Array} Status of all components
 */
export const getExtractionStatus = () => {
  const results = [];
  
  // For each component in the dependency map
  Object.keys(componentDependencyMap).forEach(componentId => {
    const isExtracted = extractedComponents.has(componentId);
    const featureFlagName = `USE_EXTRACTED_${componentId.toUpperCase()}`;
    const isEnabled = isFeatureEnabled(featureFlagName);
    
    const dependencies = componentDependencyMap[componentId]?.dependencies || [];
    const stateDeps = getStateDependencies(componentId);
    
    // Check if all dependencies are extracted
    const dependenciesExtracted = dependencies.every(depId => extractedComponents.has(depId));
    
    // Get rendering stats if available
    const renderStats = isExtracted ? renderingStatistics.get(componentId) : null;
    const averageRenderTime = renderStats ? 
      renderStats.renderTimes.reduce((sum, { duration }) => sum + duration, 0) / 
      Math.max(renderStats.renderTimes.length, 1) : 
      null;
    
    results.push({
      componentId,
      isExtracted,
      isEnabled,
      hasRendered: isExtracted && extractedComponents.get(componentId).renderCount > 0,
      renderCount: isExtracted ? extractedComponents.get(componentId).renderCount : 0,
      errorCount: isExtracted ? extractedComponents.get(componentId).errorCount : 0,
      lastRenderDuration: isExtracted ? extractedComponents.get(componentId).lastRenderDuration : null,
      averageRenderTime,
      lastRenderAt: renderStats?.lastRenderAt || null,
      dependencies,
      dependenciesExtracted,
      readyForExtraction: !isExtracted && dependenciesExtracted,
      stateDependencies: stateDeps
    });
  });
  
  return results;
};

/**
 * Get components that are ready for extraction
 * @returns {Array} Components ready for extraction
 */
export const getComponentsReadyForExtraction = () => {
  return getExtractionStatus()
    .filter(status => status.readyForExtraction)
    .sort((a, b) => a.dependencies.length - b.dependencies.length);
};

/**
 * Get performance metrics for extracted components
 * @returns {Object} Performance metrics
 */
export const getPerformanceMetrics = () => {
  const stats = getExtractionStatus();
  
  return {
    totalExtracted: stats.filter(s => s.isExtracted).length,
    totalEnabled: stats.filter(s => s.isEnabled).length,
    totalWithErrors: stats.filter(s => s.errorCount > 0).length,
    slowestComponent: stats
      .filter(s => s.isExtracted && s.hasRendered)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)[0]?.componentId || null,
    fastestComponent: stats
      .filter(s => s.isExtracted && s.hasRendered)
      .sort((a, b) => a.averageRenderTime - b.averageRenderTime)[0]?.componentId || null,
    readyForExtraction: stats.filter(s => s.readyForExtraction).length,
    averageRenderTime: stats
      .filter(s => s.isExtracted && s.hasRendered)
      .reduce((sum, s) => sum + s.averageRenderTime, 0) / 
      Math.max(stats.filter(s => s.isExtracted && s.hasRendered).length, 1)
  };
};

/**
 * Print extraction status report to console
 */
export const printExtractionReport = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const status = getExtractionStatus();
  const metrics = getPerformanceMetrics();
  
  console.group('Component Extraction Status Report');
  console.log(`Extracted: ${metrics.totalExtracted} / ${status.length} components`);
  console.log(`Components with errors: ${metrics.totalWithErrors}`);
  console.log(`Ready for extraction: ${metrics.readyForExtraction}`);
  
  console.group('Performance');
  console.log(`Average render time: ${metrics.averageRenderTime.toFixed(2)}ms`);
  if (metrics.slowestComponent) {
    console.log(`Slowest component: ${metrics.slowestComponent}`);
  }
  if (metrics.fastestComponent) {
    console.log(`Fastest component: ${metrics.fastestComponent}`);
  }
  console.groupEnd();
  
  console.group('Component Status');
  status.forEach(s => {
    const emoji = s.isExtracted ? (s.errorCount > 0 ? '⚠️' : '✅') : (s.readyForExtraction ? '🟡' : '⏳');
    console.log(`${emoji} ${s.componentId}: ${s.isExtracted ? 'Extracted' : 'Not extracted'}`);
  });
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Create a performance monitor HOC for extracted components
 * @param {Function} Component - The component to monitor
 * @param {string} componentId - The component ID
 * @returns {Function} The monitored component
 */
export const withExtractionMonitor = (Component, componentId) => {
  // Register the component if it hasn't been registered yet
  if (!extractedComponents.has(componentId)) {
    registerExtractedComponent(componentId);
  }
  
  return function MonitoredComponent(props) {
    const start = performance.now();
    
    try {
      const result = <Component {...props} />;
      const end = performance.now();
      trackComponentRender(componentId, end - start);
      return result;
    } catch (error) {
      trackComponentError(componentId, error);
      throw error;
    }
  };
}; 