/**
 * Comprehensive logging system for MeetNow application
 * Provides structured logging, history, and export capabilities
 */

export interface ILogLevels {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

export interface ILogEntry {
  timestamp: string;
  level: number;
  levelName: keyof LogLevels;
  component: string;
  message: string;
  data: unknown | null;
}

export interface ILogFilter {
  level?: number;
  component?: string;
}

export type TLogSubscriber = (entry: LogEntry) => void;

class Logger {
  private static instance: Logger | null = null;

  static readonly LEVELS: LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private static currentLevel: number = Logger.LEVELS.INFO;
  private static logHistory: LogEntry[] = [];
  private static subscribers: LogSubscriber[] = [];
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  private constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    Logger.instance = this;
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level to capture
   */
  static setLevel(level: number): void {
    Logger.currentLevel = level;
  }

  /**
   * Subscribe to log events in real-time
   */
  static subscribe(callback: LogSubscriber): () => void {
    Logger.subscribers.push(callback);
    return () => {
      Logger.subscribers = Logger.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of a new log entry
   */
  private static notify(entry: LogEntry): void {
    Logger.subscribers.forEach(callback => callback(entry));
  }

  /**
   * Log a message with specified level
   */
  static log(level: number, component: string, message: string, data: unknown = null): void {
    if (level < Logger.currentLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = Object.keys(Logger.LEVELS).find(
      key => Logger.LEVELS[key as keyof LogLevels] === level
    ) as keyof LogLevels;

    const entry: LogEntry = {
      timestamp,
      level,
      levelName,
      component,
      message,
      data,
    };

    // Add to history, limiting to last 1000 entries
    Logger.logHistory = [...Logger.logHistory, entry].slice(-1000);

    // Notify subscribers
    Logger.notify(entry);

    // Also log to console for immediate visibility
    const logMethod =
      level === Logger.LEVELS.ERROR
        ? console.error
        : level === Logger.LEVELS.WARN
          ? console.warn
          : level === Logger.LEVELS.INFO
            ? console.info
            : console.debug;

    logMethod(`[${entry.levelName}][${component}] ${message}`, data);
  }

  /**
   * Log an info message
   */
  static info(component: string, message: string, data: unknown = null): void {
    Logger.log(Logger.LEVELS.INFO, component, message, data);
  }

  /**
   * Log a warning message
   */
  static warn(component: string, message: string, data: unknown = null): void {
    Logger.log(Logger.LEVELS.WARN, component, message, data);
  }

  /**
   * Log an error message
   */
  static error(component: string, message: string, error: unknown = null): void {
    Logger.log(Logger.LEVELS.ERROR, component, message, error);
  }

  /**
   * Log a debug message
   */
  static debug(component: string, message: string, data: unknown = null): void {
    Logger.log(Logger.LEVELS.DEBUG, component, message, data);
  }

  /**
   * Log performance metrics
   */
  static performance(operation: string, duration: number): void {
    Logger.log(Logger.LEVELS.INFO, 'Performance', `${operation} took ${duration}ms`);
  }

  /**
   * Log user action
   */
  static userAction(action: string, data: unknown = null): void {
    Logger.log(Logger.LEVELS.INFO, 'UserAction', action, data);
  }

  /**
   * Get filtered log history
   */
  static getHistory(filter: LogFilter = {}): LogEntry[] {
    let filtered = [...Logger.logHistory];

    if (typeof filter.level === 'number') {
      filtered = filtered.filter(entry => entry.level >= filter.level!);
    }

    if (filter.component) {
      filtered = filtered.filter(entry => entry.component === filter.component);
    }

    return filtered;
  }

  /**
   * Export logs to a downloadable JSON file
   */
  static exportLogs(): void {
    const json = JSON.stringify(Logger.logHistory, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `meetnow-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default Logger;
