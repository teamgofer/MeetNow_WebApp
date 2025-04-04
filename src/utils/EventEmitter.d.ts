export declare class EventEmitter {
    private _events;
    constructor();
    on(event: string, handler: Function): () => void;
    off(event: string, handler: Function): void;
    emit(event: string, data: unknown): void;
    removeAllListeners(event: string): void;
    hasListeners(event: string): boolean;
    listenerCount(event: string): number;
    eventNames(): string[];
}
export default EventEmitter;
