export interface TileServer {
    url: string;
    attribution: string;
    crossOrigin: string;
}
export declare const TILE_SERVERS: TileServer[];
export declare const MAP_CONSTANTS: {
    MIN_ZOOM: number;
    MAX_ZOOM: number;
    MIN_RADIUS: number;
    MAX_RADIUS: number;
    DEFAULT_RADIUS: number;
    DEFAULT_ZOOM: number;
    MAX_MEETUP_DISTANCE: number;
};
export declare const calculateSearchRadius: (zoom: number) => number;
export declare const calculateOptimalZoom: (boundsSize: number, isMobile?: boolean) => 12 | 13 | 14 | 15 | 16;
export declare const MAP_STYLES: {
    container: {
        readonly width: "100%";
        readonly height: "100%";
        readonly position: "relative";
        readonly zIndex: 1;
    };
    compact: {
        readonly height: "calc(100% - 60px)";
    };
};
