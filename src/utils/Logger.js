class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        if (Logger.instance) {
            return Logger.instance;
        }
        Logger.instance = this;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    static setLevel(level) {
        Logger.currentLevel = level;
    }
    static subscribe(callback) {
        Logger.subscribers.push(callback);
        return () => {
            Logger.subscribers = Logger.subscribers.filter(cb => cb !== callback);
        };
    }
    static notify(entry) {
        Logger.subscribers.forEach(callback => callback(entry));
    }
    static log(level, component, message, data = null) {
        if (level < Logger.currentLevel)
            return;
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(Logger.LEVELS).find(key => Logger.LEVELS[key] === level);
        const entry = {
            timestamp,
            level,
            levelName,
            component,
            message,
            data,
        };
        Logger.logHistory = [...Logger.logHistory, entry].slice(-1000);
        Logger.notify(entry);
        const logMethod = level === Logger.LEVELS.ERROR
            ? console.error
            : level === Logger.LEVELS.WARN
                ? console.warn
                : level === Logger.LEVELS.INFO
                    ? console.info
                    : console.debug;
        logMethod(`[${entry.levelName}][${component}] ${message}`, data);
    }
    static info(component, message, data = null) {
        Logger.log(Logger.LEVELS.INFO, component, message, data);
    }
    static warn(component, message, data = null) {
        Logger.log(Logger.LEVELS.WARN, component, message, data);
    }
    static error(component, message, error = null) {
        Logger.log(Logger.LEVELS.ERROR, component, message, error);
    }
    static debug(component, message, data = null) {
        Logger.log(Logger.LEVELS.DEBUG, component, message, data);
    }
    static performance(operation, duration) {
        Logger.log(Logger.LEVELS.INFO, 'Performance', `${operation} took ${duration}ms`);
    }
    static userAction(action, data = null) {
        Logger.log(Logger.LEVELS.INFO, 'UserAction', action, data);
    }
    static getHistory(filter = {}) {
        let filtered = [...Logger.logHistory];
        if (typeof filter.level === 'number') {
            filtered = filtered.filter(entry => entry.level >= filter.level);
        }
        if (filter.component) {
            filtered = filtered.filter(entry => entry.component === filter.component);
        }
        return filtered;
    }
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
Logger.instance = null;
Logger.LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};
Logger.currentLevel = Logger.LEVELS.INFO;
Logger.logHistory = [];
Logger.subscribers = [];
export default Logger;
//# sourceMappingURL=Logger.js.map