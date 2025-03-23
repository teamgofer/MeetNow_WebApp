import L from 'leaflet';

export const initializeLeaflet = () => {
  // Delete default icon prototype to prevent issues
  delete L.Icon.Default.prototype._getIconUrl;

  // Set default icon paths
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Set default image path if not set
  if (!L.Icon.Default.imagePath) {
    L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
  }
};

export const createBounds = (center, points = []) => {
  const bounds = L.latLngBounds([center]);
  points.forEach(point => {
    if (point?.lat && point?.lng) {
      bounds.extend([point.lat, point.lng]);
    }
  });
  return bounds;
};

export const calculateDistance = (point1, point2) => {
  if (!point1?.lat || !point1?.lng || !point2?.lat || !point2?.lng) {
    return Infinity;
  }
  return L.latLng(point1).distanceTo(L.latLng(point2));
};

export const isValidLocation = (location) => {
  return location && 
         typeof location.lat === 'number' && 
         (typeof location.lng === 'number' || typeof location.lon === 'number') &&
         !isNaN(location.lat) && 
         (!isNaN(location.lng) || !isNaN(location.lon));
}; 