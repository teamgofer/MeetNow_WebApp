export interface IGeofence {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    onEnter?: () => void;
    onExit?: () => void;
    onDwell?: (duration: number) => void;
}
