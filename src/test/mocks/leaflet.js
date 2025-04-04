// Mock Leaflet library
const L = {
  map: () => ({
    setView: () => ({ on: () => {}, off: () => {} }),
    on: () => {},
    off: () => {},
    remove: () => {},
    getZoom: () => 13,
    getCenter: () => ({ lat: 0, lng: 0 }),
    flyTo: () => Promise.resolve(true),
    setZoom: () => {},
    panTo: () => Promise.resolve(true),
  }),
  tileLayer: () => ({
    addTo: () => {},
    remove: () => {},
  }),
  marker: () => ({
    setLatLng: () => {},
    addTo: () => {},
    remove: () => {},
    bindPopup: () => {},
    setIcon: () => {},
    getLatLng: () => ({ lat: 0, lng: 0 }),
  }),
  divIcon: options => ({
    options,
  }),
  latLng: (lat, lng) => ({ lat, lng }),
  point: (x, y) => ({ x, y }),
};

export default L;
