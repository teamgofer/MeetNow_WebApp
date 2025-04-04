/**
 * Simple event emitter implementation for subscription-based event handling
 */
export class EventEmitter<T = unknown> {
  private listeners: ((data: T) => void)[];

  constructor() {
    this.listeners = [];
  }

  /**
   * Subscribe to events
   * @param callback - The function to call when events are emitted
   * @returns A function to unsubscribe this callback
   */
  on(callback: (data: T) => void): () => void {
    if (typeof callback !== 'function') {
      throw new Error('Event listener callback must be a function');
    }

    this.listeners.push(callback);

    // Return a function to remove this specific listener
    return () => this.off(callback);
  }

  /**
   * Unsubscribe from events
   * @param callback - The callback function to remove
   */
  off(callback: (data: T) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Emit an event to all listeners
   * @param data - The data to pass to all listener callbacks
   */
  emit(data: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
    this.listeners = [];
  }
}

export default EventEmitter;
