/**
 * Simple EventEmitter implementation for handling events
 */
export class EventEmitter {
  private _events: Map<string, Set<Function>>;

  constructor() {
    this._events = new Map();
  }

  /**
   * Register an event handler
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Function to remove the handler
   */
  on(event: string, handler: Function): () => void {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event)!.add(handler);

    // Return a function to remove the handler
    return () => this.off(event, handler);
  }

  /**
   * Remove an event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  off(event: string, handler: Function): void {
    if (this._events.has(event)) {
      this._events.get(event)!.delete(handler);
    }
  }

  /**
   * Emit an event with data
   * @param event - Event name
   * @param data - Data to pass to handlers
   */
  emit(event: string, data: unknown): void {
    if (this._events.has(event)) {
      this._events.get(event)!.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all handlers for an event
   * @param event - Event name
   */
  removeAllListeners(event: string): void {
    if (this._events.has(event)) {
      this._events.delete(event);
    }
  }

  /**
   * Check if there are any handlers for an event
   * @param event - Event name
   * @returns Whether there are handlers
   */
  hasListeners(event: string): boolean {
    return this._events.has(event) && this._events.get(event)!.size > 0;
  }

  /**
   * Get the number of handlers for an event
   * @param event - Event name
   * @returns Number of handlers
   */
  listenerCount(event: string): number {
    return this._events.has(event) ? this._events.get(event)!.size : 0;
  }

  /**
   * Get all registered event names
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Array.from(this._events.keys());
  }
}

export default EventEmitter;
