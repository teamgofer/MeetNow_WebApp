export class EventEmitter {
    constructor() {
        this.listeners = [];
    }
    on(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Event listener callback must be a function');
        }
        this.listeners.push(callback);
        return () => this.off(callback);
    }
    off(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    emit(data) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            }
            catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }
    clear() {
        this.listeners = [];
    }
}
export default EventEmitter;
//# sourceMappingURL=EventEmitter.js.map