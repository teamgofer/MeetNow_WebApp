interface IMarkerOptions {
    icon?: string;
    draggable?: boolean;
    visible?: boolean;
    zIndex?: number;
    title?: string;
    animation?: 'DROP' | 'BOUNCE' | null;
    [key: string]: any;
}
interface IMarker {
    id: string;
    position: {
        lat: number;
        lng: number;
    };
    options?: IMarkerOptions;
    onClick?: () => void;
    onDrag?: (position: {
        lat: number;
        lng: number;
    }) => void;
}
interface IMarkerCollection {
    markers: Map<string, IMarker>;
    add: (marker: IMarker) => void;
    remove: (markerId: string) => void;
    update: (markerId: string, updates: Partial<IMarker>) => void;
    updatePosition: (markerId: string, position: {
        lat: number;
        lng: number;
    }) => void;
    updateOptions: (markerId: string, options: IMarkerOptions) => void;
    clear: () => void;
    getById: (markerId: string) => IMarker | undefined;
    getAll: () => IMarker[];
    getVisible: () => IMarker[];
}
declare const useMapMarkers: () => IMarkerCollection;
export default useMapMarkers;
