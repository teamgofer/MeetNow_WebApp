import '@testing-library/jest-dom';

// Mock the Leaflet library
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    flyTo: jest.fn(),
    panTo: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn().mockReturnValue(13),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    setLatLng: jest.fn(),
    bindPopup: jest.fn().mockReturnValue({
      openPopup: jest.fn()
    }),
    remove: jest.fn()
  })),
  icon: jest.fn(),
  divIcon: jest.fn(),
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  CRS: {
    EPSG3857: {}
  }
}));

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn(({ children }) => <div data-testid="map-container">{children}</div>),
  TileLayer: jest.fn(() => <div data-testid="tile-layer" />),
  Marker: jest.fn(({ children }) => <div data-testid="marker">{children}</div>),
  Popup: jest.fn(({ children }) => <div data-testid="popup">{children}</div>),
  useMap: jest.fn(() => ({
    setView: jest.fn(),
    flyTo: jest.fn(),
    panTo: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn().mockReturnValue(13),
    invalidateSize: jest.fn()
  }))
}));

// Mock the geolocation API
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    clearWatch: jest.fn(),
    getCurrentPosition: jest.fn().mockImplementation(success => 
      success({ 
        coords: { 
          latitude: 35.6895, 
          longitude: 139.6917,
          accuracy: 10
        } 
      })
    ),
    watchPosition: jest.fn()
  }
});

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Silence console errors during tests
console.error = jest.fn(); 