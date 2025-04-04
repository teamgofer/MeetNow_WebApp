import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import useGeolocation from '../../hooks/useGeolocation';

// Mock dependencies
vi.mock('../../utils/location-services', () => ({
  locationRequestManager: {
    requestLocation: vi.fn(),
    getCurrentPosition: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('../../utils/Logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/error-handler', () => ({
  handleGeolocationError: vi.fn(),
  createGeolocationError: vi.fn(msg => new Error(msg)),
}));

describe('useGeolocation hook', () => {
  // Mock geolocation API
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  beforeEach(() => {
    // Setup geolocation mock
    global.navigator.geolocation = mockGeolocation;

    // Reset mocks before each test
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return loading state initially', async () => {
    let result;
    await act(async () => {
      const rendered = renderHook(() => useGeolocation());
      result = rendered.result;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle successful geolocation', async () => {
    // Setup mock to succeed immediately with act
    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      act(() => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      });
    });

    let result;
    await act(async () => {
      const rendered = renderHook(() => useGeolocation());
      result = rendered.result;

      // Fast-forward timers
      vi.runAllTimers();
    });

    // Check that location was set correctly
    expect(result.current.isLoading).toBe(false);
    expect(result.current.location).toEqual({
      lat: 37.7749,
      lng: -122.4194,
      display_name: 'Your Location',
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle geolocation error', async () => {
    // Setup mock to fail with act
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      act(() => {
        error({ code: 1, message: 'User denied geolocation' });
      });
    });

    let result;
    await act(async () => {
      const rendered = renderHook(() => useGeolocation());
      result = rendered.result;

      // Fast-forward timers
      vi.runAllTimers();
    });

    // Check that error was set correctly
    expect(result.current.isLoading).toBe(false);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('Location permission denied');
  });

  it('should retry on geolocation failure', async () => {
    // Setup mock to fail initially, then succeed on 2nd attempt
    mockGeolocation.getCurrentPosition
      .mockImplementationOnce((success, error) => {
        act(() => {
          error({ code: 2, message: 'Position unavailable' });
        });
      })
      .mockImplementationOnce(success => {
        act(() => {
          success({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10,
            },
          });
        });
      });

    let result;
    await act(async () => {
      const rendered = renderHook(() =>
        useGeolocation({
          retryCount: 1,
          retryDelay: 1000,
        })
      );
      result = rendered.result;

      // Advance timers for retry delay
      vi.advanceTimersByTime(1000);
      // Run any remaining timers
      vi.runAllTimers();
    });

    // Verify the hook made 2 attempts
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);

    // Check that location was set correctly after retry
    expect(result.current.isLoading).toBe(false);
    expect(result.current.location).toEqual({
      lat: 37.7749,
      lng: -122.4194,
      display_name: 'Your Location',
    });
    expect(result.current.error).toBeNull();
  });

  it('should use cached location when available', async () => {
    // First render to "prime" cache
    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      act(() => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      });
    });

    let result;
    let rerender;

    await act(async () => {
      const rendered = renderHook(() =>
        useGeolocation({
          useCaching: true,
          maximumAge: 60000,
        })
      );
      result = rendered.result;
      rerender = rendered.rerender;

      // Run timers
      vi.runAllTimers();
    });

    // Reset mock and render again
    mockGeolocation.getCurrentPosition.mockClear();

    // Re-render the hook to test cache behavior
    await act(async () => {
      rerender();
    });

    // Cached location should be used, so getCurrentPosition shouldn't be called again
    expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();

    // Location should still be available
    expect(result.current.location).toEqual({
      lat: 37.7749,
      lng: -122.4194,
      display_name: 'Your Location',
    });
  });

  it('should refresh location when requested', async () => {
    // Setup mock
    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      act(() => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
        });
      });
    });

    let result;
    await act(async () => {
      const rendered = renderHook(() => useGeolocation());
      result = rendered.result;

      // Run timers
      vi.runAllTimers();
    });

    // Update mock for the refresh call
    mockGeolocation.getCurrentPosition.mockClear();
    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      act(() => {
        success({
          coords: {
            latitude: 34.0522,
            longitude: -118.2437,
            accuracy: 10,
          },
        });
      });
    });

    // Call refresh
    await act(async () => {
      result.current.refresh();
      // Run timers
      vi.runAllTimers();
    });

    // Should have new location
    expect(result.current.isLoading).toBe(false);
    expect(result.current.location).toEqual({
      lat: 34.0522,
      lng: -118.2437,
      display_name: 'Your Location',
    });
  });

  it('should handle browsers without geolocation support', async () => {
    // Remove geolocation from navigator
    delete global.navigator.geolocation;

    let result;
    await act(async () => {
      const rendered = renderHook(() => useGeolocation());
      result = rendered.result;
    });

    // Should not be loading and have error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Geolocation is not supported by your browser');
    expect(result.current.location).toBeNull();
  });
});
