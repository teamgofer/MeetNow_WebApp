import { renderHook, act } from '@testing-library/react';
import { UIStateProvider, useUIState } from './useUIState';

describe('useUIState', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UIStateProvider>{children}</UIStateProvider>
  );

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });
    expect(result.current.isLocationSearchOpen).toBe(false);
  });

  it('should open location search', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openLocationSearch();
    });

    expect(result.current.isLocationSearchOpen).toBe(true);
  });

  it('should close location search', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openLocationSearch();
    });
    expect(result.current.isLocationSearchOpen).toBe(true);

    act(() => {
      result.current.closeLocationSearch();
    });
    expect(result.current.isLocationSearchOpen).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useUIState());
    expect(() => result.current).toThrow('useUIState must be used within a UIStateProvider');
    consoleError.mockRestore();
  });
});
