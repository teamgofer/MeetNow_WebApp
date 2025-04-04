import L from 'leaflet';
export const initializeLeaflet = () => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    if (!L.Icon.Default.imagePath) {
        L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
    }
};
export const createBounds = (center, points = []) => {
    const latLng = [center.lat, center.lng || center.lon || 0];
    const bounds = L.latLngBounds([latLng]);
    points.forEach(point => {
        if (isValidLocation(point)) {
            bounds.extend([point.lat, point.lng || point.lon || 0]);
        }
    });
    return bounds;
};
export const calculateDistance = (point1, point2) => {
    if (!isValidLocation(point1) || !isValidLocation(point2)) {
        return Infinity;
    }
    return L.latLng(point1.lat, point1.lng || point1.lon || 0).distanceTo(L.latLng(point2.lat, point2.lng || point2.lon || 0));
};
export const isValidLocation = (location) => {
    return (location &&
        typeof location.lat === 'number' &&
        (typeof location.lng === 'number' || typeof location.lon === 'number') &&
        !isNaN(location.lat) &&
        (!isNaN(location.lng) || !isNaN(location.lon)));
};
const tryUrls = async (urls) => {
    for (const url of urls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                return url;
            }
        }
        catch (e) {
            continue;
        }
    }
    return urls[0] || '';
};
//# sourceMappingURL=utils.js.map