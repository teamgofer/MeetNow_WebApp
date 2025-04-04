export class EventEmitter {
    constructor() {
        this._events = new Map();
    }
    on(event, handler) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        this._events.get(event).add(handler);
        return () => this.off(event, handler);
    }
    off(event, handler) {
        if (this._events.has(event)) {
            this._events.get(event).delete(handler);
        }
    }
    emit(event, data) {
        if (this._events.has(event)) {
            this._events.get(event).forEach(handler => {
                try {
                    handler(data);
                }
                catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    removeAllListeners(event) {
        if (this._events.has(event)) {
            this._events.delete(event);
        }
    }
    hasListeners(event) {
        return this._events.has(event) && this._events.get(event).size > 0;
    }
    listenerCount(event) {
        return this._events.has(event) ? this._events.get(event).size : 0;
    }
    eventNames() {
        return Array.from(this._events.keys());
    }
}
export default EventEmitter;
//# sourceMappingURL=EventEmitter.js.map