import { useEffect } from 'react';
import Logger from '../utils/Logger';

/**
 * Hook for using the Logger in React components
 * Provides a consistent interface for logging with component context
 */
const useLogger = (componentName) => {
  useEffect(() => {
    // Subscribe to log events when component mounts
    const unsubscribe = Logger.subscribe((entry) => {
      // You can handle log events here if needed
      console.log(`[${componentName}] Log event:`, entry);
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [componentName]);

  // Return an object with logging methods that include the component name
  return {
    debug: (message, data) => Logger.debug(componentName, message, data),
    info: (message, data) => Logger.info(componentName, message, data),
    warn: (message, data) => Logger.warn(componentName, message, data),
    error: (message, error) => Logger.error(componentName, message, error),
    performance: (operation, duration) => Logger.performance(operation, duration),
    userAction: (action, data) => Logger.userAction(action, data)
  };
};

export default useLogger; 
 