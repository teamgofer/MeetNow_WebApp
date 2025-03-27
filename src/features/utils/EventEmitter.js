/**
 * Simple event emitter implementation for subscription-based event handling
 */
class EventEmitter {
  constructor() {
    this.listeners = [];
  }

  /**
   * Subscribe to events
   * @param {Function} callback - The function to call when events are emitted
   * @returns {Function} A function to unsubscribe this callback
   */
  on(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Event listener callback must be a function');
    }
    
    this.listeners.push(callback);
    
    // Return a function to remove this specific listener
    return () => this.off(callback);
  }

  /**
   * Unsubscribe from events
   * @param {Function} callback - The callback function to remove
   */
  off(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Emit an event to all listeners
   * @param {any} data - The data to pass to all listener callbacks
   */
  emit(data) {
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
  clear() {
    this.listeners = [];
  }
}

export { EventEmitter }; 