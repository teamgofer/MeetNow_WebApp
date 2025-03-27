import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ComponentRegistryProvider } from '../components/ui/ComponentRegistry';
import { vi } from 'vitest';

// Mock geolocation API
vi.mock('navigator.geolocation', () => ({
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}));

// Mock Leaflet
vi.mock('leaflet', () => {
  const L = {
    divIcon: vi.fn().mockReturnValue({
      className: 'custom-marker',
      html: '<div></div>'
    }),
    icon: vi.fn().mockReturnValue({
      className: 'custom-icon',
      html: '<div></div>'
    }),
    latLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      off: vi.fn(),
      setView: vi.fn(),
      getBounds: vi.fn(),
      getCenter: vi.fn(),
      getZoom: vi.fn(),
      setZoom: vi.fn(),
      panTo: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      remove: vi.fn()
    })),
    marker: vi.fn().mockImplementation(() => ({
      addTo: vi.fn(),
      remove: vi.fn(),
      setLatLng: vi.fn(),
      getLatLng: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    })),
    tileLayer: vi.fn().mockImplementation(() => ({
      addTo: vi.fn()
    })),
    popup: vi.fn().mockImplementation(() => ({
      setContent: vi.fn(),
      addTo: vi.fn()
    }))
  };

  return {
    default: L,
    ...L
  };
});

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    })
  })
}));

// Create a custom render function that includes the ComponentRegistryProvider
const customRender = (ui, options) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ComponentRegistryProvider>
        {children}
      </ComponentRegistryProvider>
    ),
    ...options
  });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the render method to use our custom render
export { customRender as render }; 