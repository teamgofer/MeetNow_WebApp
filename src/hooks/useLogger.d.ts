export interface ILoggerMethods {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, error?: unknown) => void;
    performance: (operation: string, duration: number) => void;
    userAction: (action: string, data?: unknown) => void;
}
declare const useLogger: (componentName: string) => ILoggerMethods;
export default useLogger;
