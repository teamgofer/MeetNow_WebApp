// Setup file for Jest tests
import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive tests
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };

// Mock the Intersection Observer
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();

  // Helper to simulate intersection
  simulateIntersection(isIntersecting) {
    this.callback([
      {
        isIntersecting,
        target: {},
        intersectionRatio: isIntersecting ? 1 : 0,
      },
    ]);
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock the browser's navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation(success =>
    success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      },
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

global.navigator.geolocation = mockGeolocation;

// Mock the local storage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();

// Mock feature flags
jest.mock('./config/featureFlags', () => ({
  FEATURE_FLAGS: {
    USE_EXTRACTED_DISTANCE_SLIDER: true,
    USE_EXTRACTED_CATEGORY_FILTER: true,
    ENABLE_PERFORMANCE_TRACKING: true,
  },
  isFeatureEnabled: jest.fn(flag => true),
  FeatureFlag: ({ children }) => children,
}));

// Mock performance API if not available
if (typeof window.performance === 'undefined') {
  window.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  };
}

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    return;
  }
  originalConsoleError(...args);
};
