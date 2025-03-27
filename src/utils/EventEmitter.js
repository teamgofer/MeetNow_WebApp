/**
 * Simple EventEmitter implementation for handling events
 */
class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} - Function to remove the handler
   */
  on(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(handler);
    
    // Return a function to remove the handler
    return () => this.off(event, handler);
  }

  /**
   * Remove an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    if (this._events.has(event)) {
      this._events.get(event).delete(handler);
    }
  }

  /**
   * Emit an event with data
   * @param {string} event - Event name
   * @param {*} data - Data to pass to handlers
   */
  emit(event, data) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(handler => {
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
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (this._events.has(event)) {
      this._events.delete(event);
    }
  }

  /**
   * Check if there are any handlers for an event
   * @param {string} event - Event name
   * @returns {boolean} - Whether there are handlers
   */
  hasListeners(event) {
    return this._events.has(event) && this._events.get(event).size > 0;
  }

  /**
   * Get the number of handlers for an event
   * @param {string} event - Event name
   * @returns {number} - Number of handlers
   */
  listenerCount(event) {
    return this._events.has(event) ? this._events.get(event).size : 0;
  }

  /**
   * Get all registered event names
   * @returns {string[]} - Array of event names
   */
  eventNames() {
    return Array.from(this._events.keys());
  }
}

export { EventEmitter };
export default EventEmitter; 