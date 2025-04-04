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
declare class Logger {
    private static instance;
    static readonly LEVELS: LogLevels;
    private static currentLevel;
    private static logHistory;
    private static subscribers;
    private isDevelopment;
    private constructor();
    static getInstance(): Logger;
    static setLevel(level: number): void;
    static subscribe(callback: LogSubscriber): () => void;
    private static notify;
    static log(level: number, component: string, message: string, data?: unknown): void;
    static info(component: string, message: string, data?: unknown): void;
    static warn(component: string, message: string, data?: unknown): void;
    static error(component: string, message: string, error?: unknown): void;
    static debug(component: string, message: string, data?: unknown): void;
    static performance(operation: string, duration: number): void;
    static userAction(action: string, data?: unknown): void;
    static getHistory(filter?: LogFilter): LogEntry[];
    static exportLogs(): void;
}
export default Logger;
