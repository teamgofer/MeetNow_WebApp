export default withPerformanceTracking;
declare function withPerformanceTracking(
  Component: React.ComponentType,
  {
    componentId,
    logToConsole,
    trackMounts,
  }?: {
    componentId: string;
    logToConsole: boolean;
    trackMounts: boolean;
  }
): React.ComponentType;
import React from 'react';
