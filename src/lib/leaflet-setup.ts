import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Fix Leaflet default icon paths
 * This is necessary because Webpack/Vite bundling breaks the default icon paths
 */
export function fixLeafletIcons(): void {
  // Fix for default marker icons
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
    iconUrl: '/images/leaflet/marker-icon.png',
    shadowUrl: '/images/leaflet/marker-shadow.png',
  });
}

/**
 * Setup Leaflet and its plugins
 */
export function setupLeaflet(): void {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Fix Leaflet default icon paths
      fixLeafletIcons();

      console.log('Leaflet setup complete');
    }
  } catch (error) {
    console.error('Error setting up Leaflet:', error);
  }
}

// Initialize Leaflet when this module is imported
setupLeaflet();
