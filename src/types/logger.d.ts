export type TLogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface ILogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
export interface ILogContext {
    [key: string]: any;
}
