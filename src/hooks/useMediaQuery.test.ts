import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useMediaQueries,
  useDeviceType,
  useSystemPreferences,
  useOrientation,
} from './useMediaQuery';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  return {
    matches,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
};

describe('useMediaQuery', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should return initial matches value', () => {
    window.matchMedia = jest.fn().mockImplementation(() => mockMatchMedia(true));
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    const mediaQuery = mockMatchMedia(false);
    window.matchMedia = jest.fn().mockImplementation(() => mediaQuery);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      mediaQuery.matches = true;
      // Trigger the change event
      const changeEvent = new Event('change') as MediaQueryListEvent;
      Object.defineProperty(changeEvent, 'matches', { value: true });
      mediaQuery.addEventListener.mock.calls[0][1](changeEvent);
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const mediaQuery = mockMatchMedia(false);
    window.matchMedia = jest.fn().mockImplementation(() => mediaQuery);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(mediaQuery.removeEventListener).toHaveBeenCalled();
  });
});

describe('useMediaQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle multiple media queries', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return mockMatchMedia(query.includes('min-width'));
    });

    const { result } = renderHook(() =>
      useMediaQueries(['(min-width: 768px)', '(max-width: 768px)'])
    );

    expect(result.current['(min-width: 768px)']).toBe(true);
    expect(result.current['(max-width: 768px)']).toBe(false);
  });
});

describe('useDeviceType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect mobile device', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return mockMatchMedia(query.includes('max-width: 640px'));
    });

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('mobile');
  });

  it('should detect tablet device', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('min-width: 641px') && query.includes('max-width: 1024px');
    });

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('tablet');
  });

  it('should detect desktop device', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('min-width: 1025px');
    });

    const { result } = renderHook(() => useDeviceType());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.deviceType).toBe('desktop');
  });
});

describe('useSystemPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect dark mode', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('prefers-color-scheme: dark');
    });

    const { result } = renderHook(() => useSystemPreferences());

    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
    expect(result.current.colorScheme).toBe('dark');
  });

  it('should detect light mode', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('prefers-color-scheme: light');
    });

    const { result } = renderHook(() => useSystemPreferences());

    expect(result.current.isDark).toBe(false);
    expect(result.current.isLight).toBe(true);
    expect(result.current.colorScheme).toBe('light');
  });
});

describe('useOrientation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect portrait orientation', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('portrait');
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.orientation).toBe('portrait');
  });

  it('should detect landscape orientation', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      return query.includes('landscape');
    });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.isPortrait).toBe(false);
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.orientation).toBe('landscape');
  });
});
