/**
 * Service for monitoring operation performance
 */
export class PerformanceMonitor {
  private static _operations: Map<string, number> = new Map();
  private static _metrics: Map<string, number[]> = new Map();

  /**
   * Start tracking an operation
   * @param operation - Operation name
   */
  public static startOperation(operation: string): void {
    this._operations.set(operation, Date.now());
  }

  /**
   * End tracking an operation
   * @param operation - Operation name
   */
  public static endOperation(operation: string): void {
    const startTime = this._operations.get(operation);
    if (startTime) {
      const duration = Date.now() - startTime;
      this._operations.delete(operation);

      // Store metric
      if (!this._metrics.has(operation)) {
        this._metrics.set(operation, []);
      }
      this._metrics.get(operation)!.push(duration);
    }
  }

  /**
   * Track operation timing
   * @param category - Operation category
   * @param operation - Operation name
   * @param duration - Operation duration
   * @param metadata - Additional metadata
   */
  public static trackOperationTiming(
    category: string,
    operation: string,
    duration: number,
    metadata: Record<string, unknown> = {}
  ): void {
    const key = `${category}:${operation}`;
    if (!this._metrics.has(key)) {
      this._metrics.set(key, []);
    }
    this._metrics.get(key)!.push(duration);
  }

  /**
   * Track error
   * @param category - Error category
   * @param operation - Operation name
   * @param error - Error object
   */
  public static trackError(category: string, operation: string, error: Error): void {
    console.error(`[${category}:${operation}] Error:`, error);
  }

  /**
   * Get average duration for an operation
   * @param operation - Operation name
   * @returns Average duration in milliseconds
   */
  public static getAverageDuration(operation: string): number {
    const metrics = this._metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return 0;
    }
    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
  }

  /**
   * Get all metrics for an operation
   * @param operation - Operation name
   * @returns Array of durations in milliseconds
   */
  public static getMetrics(operation: string): number[] {
    return this._metrics.get(operation) || [];
  }

  /**
   * Clear all metrics
   */
  public static clearMetrics(): void {
    this._metrics.clear();
  }

  /**
   * Get all operation names
   * @returns Array of operation names
   */
  public static getOperations(): string[] {
    return Array.from(this._metrics.keys());
  }
}
