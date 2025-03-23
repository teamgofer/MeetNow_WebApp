// Map Configuration
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

// Zoom and radius constants
export const MAP_CONSTANTS = {
  MIN_ZOOM: 12, // ~10km radius
  MAX_ZOOM: 18, // ~150m radius
  MIN_RADIUS: 150, // meters
  MAX_RADIUS: 10000, // meters
  DEFAULT_RADIUS: 200, // meters - initial search radius
  DEFAULT_ZOOM: 17,
  MAX_MEETUP_DISTANCE: 50000 // 50km - maximum distance to show meetups
};

// Map utility functions
export const calculateSearchRadius = (zoom) => {
  const clampedZoom = Math.min(Math.max(zoom, MAP_CONSTANTS.MIN_ZOOM), MAP_CONSTANTS.MAX_ZOOM);
  const zoomDiff = MAP_CONSTANTS.MAX_ZOOM - clampedZoom;
  const radius = MAP_CONSTANTS.MIN_RADIUS * Math.pow(2, zoomDiff);
  return Math.min(Math.max(radius, MAP_CONSTANTS.MIN_RADIUS), MAP_CONSTANTS.MAX_RADIUS);
};

// Calculate optimal zoom based on bounds size
export const calculateOptimalZoom = (boundsSize, isMobile = false) => {
  if (boundsSize < 500) return 16; // Less than 500m
  if (boundsSize < 2000) return 15; // Less than 2km
  if (boundsSize < 5000) return 14; // Less than 5km
  if (boundsSize < 10000) return 13; // Less than 10km
  return 12;
};

// Map style configurations
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