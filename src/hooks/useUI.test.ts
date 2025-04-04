import { renderHook, act } from '@testing-library/react';
import useUI from './useUI';

describe('useUI', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUI());

    expect(result.current.isMapExpanded).toBe(false);
    expect(result.current.isMeetupCreatorOpen).toBe(false);
    expect(result.current.isLocationSearchOpen).toBe(false);
    expect(result.current.isMeetupDetailsOpen).toBe(false);
    expect(result.current.isLoadingOverlayVisible).toBe(false);
    expect(result.current.loadingMessage).toBe('');
    expect(result.current.toast).toBe(null);
  });

  it('should toggle map expansion', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.toggleMapExpanded();
    });
    expect(result.current.isMapExpanded).toBe(true);

    act(() => {
      result.current.toggleMapExpanded();
    });
    expect(result.current.isMapExpanded).toBe(false);
  });

  it('should handle meetup creator state', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.openMeetupCreator();
    });
    expect(result.current.isMeetupCreatorOpen).toBe(true);

    act(() => {
      result.current.closeMeetupCreator();
    });
    expect(result.current.isMeetupCreatorOpen).toBe(false);
  });

  it('should handle location search state', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.openLocationSearch();
    });
    expect(result.current.isLocationSearchOpen).toBe(true);

    act(() => {
      result.current.closeLocationSearch();
    });
    expect(result.current.isLocationSearchOpen).toBe(false);
  });

  it('should handle meetup details state', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.openMeetupDetails();
    });
    expect(result.current.isMeetupDetailsOpen).toBe(true);

    act(() => {
      result.current.closeMeetupDetails();
    });
    expect(result.current.isMeetupDetailsOpen).toBe(false);
  });

  it('should handle loading overlay state', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.showLoadingOverlay('Custom loading message');
    });
    expect(result.current.isLoadingOverlayVisible).toBe(true);
    expect(result.current.loadingMessage).toBe('Custom loading message');

    act(() => {
      result.current.hideLoadingOverlay();
    });
    expect(result.current.isLoadingOverlayVisible).toBe(false);
    expect(result.current.loadingMessage).toBe('');
  });

  it('should handle toast messages', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.showToast('Test message', 'success');
    });
    expect(result.current.toast).toEqual({
      message: 'Test message',
      type: 'success',
    });

    act(() => {
      result.current.hideToast();
    });
    expect(result.current.toast).toBe(null);
  });

  it('should use default values for optional parameters', () => {
    const { result } = renderHook(() => useUI());

    act(() => {
      result.current.showLoadingOverlay();
    });
    expect(result.current.loadingMessage).toBe('Loading...');

    act(() => {
      result.current.showToast('Test message');
    });
    expect(result.current.toast).toEqual({
      message: 'Test message',
      type: 'info',
    });
  });
});
