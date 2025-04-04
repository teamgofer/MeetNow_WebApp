export class PerformanceMonitor {
    static startOperation(operation) {
        this._operations.set(operation, Date.now());
    }
    static endOperation(operation) {
        const startTime = this._operations.get(operation);
        if (startTime) {
            const duration = Date.now() - startTime;
            this._operations.delete(operation);
            if (!this._metrics.has(operation)) {
                this._metrics.set(operation, []);
            }
            this._metrics.get(operation).push(duration);
        }
    }
    static trackOperationTiming(category, operation, duration, metadata = {}) {
        const key = `${category}:${operation}`;
        if (!this._metrics.has(key)) {
            this._metrics.set(key, []);
        }
        this._metrics.get(key).push(duration);
    }
    static trackError(category, operation, error) {
        console.error(`[${category}:${operation}] Error:`, error);
    }
    static getAverageDuration(operation) {
        const metrics = this._metrics.get(operation);
        if (!metrics || metrics.length === 0) {
            return 0;
        }
        return metrics.reduce((a, b) => a + b, 0) / metrics.length;
    }
    static getMetrics(operation) {
        return this._metrics.get(operation) || [];
    }
    static clearMetrics() {
        this._metrics.clear();
    }
    static getOperations() {
        return Array.from(this._metrics.keys());
    }
}
PerformanceMonitor._operations = new Map();
PerformanceMonitor._metrics = new Map();
//# sourceMappingURL=PerformanceMonitor.js.map