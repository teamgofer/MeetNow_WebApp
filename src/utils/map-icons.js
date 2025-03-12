import L from 'leaflet';

export const createMapIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/location-marker.png',
    iconUrl: '/location-marker.png',
    shadowUrl: null
  });

  const userIcon = L.icon({
    iconUrl: '/location-marker.png',
    iconRetinaUrl: '/location-marker.png',
    shadowUrl: null,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const selectedIcon = L.icon({
    iconUrl: '/location-marker2.png',
    iconRetinaUrl: '/location-marker2.png',
    shadowUrl: null,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return { userIcon, selectedIcon };
};