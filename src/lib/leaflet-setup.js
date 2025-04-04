import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export function fixLeafletIcons() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
        iconUrl: '/images/leaflet/marker-icon.png',
        shadowUrl: '/images/leaflet/marker-shadow.png',
    });
}
export function setupLeaflet() {
    try {
        if (typeof window !== 'undefined') {
            fixLeafletIcons();
            console.log('Leaflet setup complete');
        }
    }
    catch (error) {
        console.error('Error setting up Leaflet:', error);
    }
}
setupLeaflet();
//# sourceMappingURL=leaflet-setup.js.map