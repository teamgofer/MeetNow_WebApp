import { useEffect } from 'react';
import Logger, { ILogEntry } from '../utils/Logger';

/**
 * Interface for logger methods returned by the hook
 */
export interface ILoggerMethods {
  /** Log a debug message */
  debug: (message: string, data?: unknown) => void;
  /** Log an info message */
  info: (message: string, data?: unknown) => void;
  /** Log a warning message */
  warn: (message: string, data?: unknown) => void;
  /** Log an error message */
  error: (message: string, error?: unknown) => void;
  /** Log performance metrics */
  performance: (operation: string, duration: number) => void;
  /** Log user actions */
  userAction: (action: string, data?: unknown) => void;
}

/**
 * Hook for using the Logger in React components
 * Provides a consistent interface for logging with component context
 * @param componentName - The name of the component using the logger
 * @returns Object with logging methods that include the component name
 */
const useLogger = (componentName: string): ILoggerMethods => {
  useEffect(() => {
    // Subscribe to log events when component mounts
    const unsubscribe = Logger.subscribe((entry: ILogEntry) => {
      // You can handle log events here if needed
      console.log(`[${componentName}] Log event:`, entry);
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [componentName]);

  // Return an object with logging methods that include the component name
  return {
    debug: (message: string, data?: unknown): void => Logger.debug(componentName, message, data),
    info: (message: string, data?: unknown): void => Logger.info(componentName, message, data),
    warn: (message: string, data?: unknown): void => Logger.warn(componentName, message, data),
    error: (message: string, error?: unknown): void => Logger.error(componentName, message, error),
    performance: (operation: string, duration: number): void =>
      Logger.performance(operation, duration),
    userAction: (action: string, data?: unknown): void => Logger.userAction(action, data),
  };
};

export default useLogger;
