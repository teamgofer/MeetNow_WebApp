export declare class EventEmitter<T = unknown> {
    private listeners;
    constructor();
    on(callback: (data: T) => void): () => void;
    off(callback: (data: T) => void): void;
    emit(data: T): void;
    clear(): void;
}
export default EventEmitter;
