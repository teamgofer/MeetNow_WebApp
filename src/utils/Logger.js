/**
 * Comprehensive logging system for MeetNow application
 * Provides structured logging, history, and export capabilities
 */
class Logger {
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };
  
  static currentLevel = Logger.LEVELS.INFO;
  static logHistory = [];
  static subscribers = [];
  
  /**
   * Set the minimum log level to capture
   * @param {number} level - Minimum level to log
   */
  static setLevel(level) {
    Logger.currentLevel = level;
  }
  
  /**
   * Subscribe to log events in real-time
   * @param {Function} callback - Function to call when new logs are added
   * @returns {Function} Unsubscribe function
   */
  static subscribe(callback) {
    Logger.subscribers.push(callback);
    return () => {
      Logger.subscribers = Logger.subscribers.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all subscribers of a new log entry
   * @param {Object} entry - Log entry
   * @private
   */
  static notify(entry) {
    Logger.subscribers.forEach(callback => callback(entry));
  }
  
  /**
   * Log a message with specified level
   * @param {number} level - Log level
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional additional data
   */
  static log(level, component, message, data = null) {
    if (level < Logger.currentLevel) return;
    
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      levelName: Object.keys(Logger.LEVELS).find(key => Logger.LEVELS[key] === level),
      component,
      message,
      data
    };
    
    // Add to history, limiting to last 1000 entries
    Logger.logHistory = [...Logger.logHistory, entry].slice(-1000);
    
    // Notify subscribers
    Logger.notify(entry);
    
    // Also log to console for immediate visibility
    const logMethod = level === Logger.LEVELS.ERROR ? console.error :
                      level === Logger.LEVELS.WARN ? console.warn :
                      level === Logger.LEVELS.INFO ? console.info :
                      console.debug;
    
    logMethod(`[${entry.levelName}][${component}] ${message}`, data);
  }
  
  /**
   * Log a debug message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional additional data
   */
  static debug(component, message, data) {
    Logger.log(Logger.LEVELS.DEBUG, component, message, data);
  }
  
  /**
   * Log an info message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional additional data
   */
  static info(component, message, data) {
    Logger.log(Logger.LEVELS.INFO, component, message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional additional data
   */
  static warn(component, message, data) {
    Logger.log(Logger.LEVELS.WARN, component, message, data);
  }
  
  /**
   * Log an error message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} data - Optional additional data
   */
  static error(component, message, data) {
    Logger.log(Logger.LEVELS.ERROR, component, message, data);
  }
  
  /**
   * Get filtered log history
   * @param {Object} filter - Filter options
   * @param {number} filter.level - Minimum level
   * @param {string} filter.component - Filter by component
   * @returns {Array} Filtered log entries
   */
  static getHistory(filter = {}) {
    let filtered = [...Logger.logHistory];
    
    if (filter.level !== undefined) {
      filtered = filtered.filter(entry => entry.level >= filter.level);
    }
    
    if (filter.component) {
      filtered = filtered.filter(entry => entry.component === filter.component);
    }
    
    return filtered;
  }
  
  /**
   * Export logs to a downloadable JSON file
   */
  static exportLogs() {
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