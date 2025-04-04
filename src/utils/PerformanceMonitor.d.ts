export declare class PerformanceMonitor {
    private static _operations;
    private static _metrics;
    static startOperation(operation: string): void;
    static endOperation(operation: string): void;
    static trackOperationTiming(category: string, operation: string, duration: number, metadata?: Record<string, unknown>): void;
    static trackError(category: string, operation: string, error: Error): void;
    static getAverageDuration(operation: string): number;
    static getMetrics(operation: string): number[];
    static clearMetrics(): void;
    static getOperations(): string[];
}
