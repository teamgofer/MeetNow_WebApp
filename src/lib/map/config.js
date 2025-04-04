export const TILE_SERVERS = [
    {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous'
    },
    {
        url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous'
    },
    {
        url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous'
    }
];
export const MAP_CONSTANTS = {
    MIN_ZOOM: 12,
    MAX_ZOOM: 20,
    MIN_RADIUS: 150,
    MAX_RADIUS: 10000,
    DEFAULT_RADIUS: 200,
    DEFAULT_ZOOM: 19.5,
    MAX_MEETUP_DISTANCE: 50000
};
export const calculateSearchRadius = (zoom) => {
    const clampedZoom = Math.min(Math.max(zoom, MAP_CONSTANTS.MIN_ZOOM), MAP_CONSTANTS.MAX_ZOOM);
    const zoomDiff = MAP_CONSTANTS.MAX_ZOOM - clampedZoom;
    const radius = MAP_CONSTANTS.MIN_RADIUS * Math.pow(2, zoomDiff);
    return Math.min(Math.max(radius, MAP_CONSTANTS.MIN_RADIUS), MAP_CONSTANTS.MAX_RADIUS);
};
export const calculateOptimalZoom = (boundsSize, isMobile = false) => {
    if (boundsSize < 500)
        return 16;
    if (boundsSize < 2000)
        return 15;
    if (boundsSize < 5000)
        return 14;
    if (boundsSize < 10000)
        return 13;
    return 12;
};
export const MAP_STYLES = {
    container: {
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1
    },
    compact: {
        height: 'calc(100% - 60px)'
    }
};
//# sourceMappingURL=config.js.map