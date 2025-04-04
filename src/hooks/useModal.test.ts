import { renderHook, act } from '@testing-library/react';
import useModal from './useModal';

describe('useModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animationDuration).toBe(300);
  });

  it('should initialize with custom values', () => {
    const { result } = renderHook(() => useModal({ initialState: true, animationDuration: 500 }));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animationDuration).toBe(500);
  });

  it('should open modal', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isAnimating).toBe(true);
  });

  it('should close modal with animation', () => {
    const { result } = renderHook(() => useModal({ initialState: true }));

    act(() => {
      result.current.close();
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isOpen).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle modal state', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isAnimating).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isOpen).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should handle custom animation duration', () => {
    const { result } = renderHook(() => useModal({ initialState: true, animationDuration: 500 }));

    act(() => {
      result.current.close();
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.isOpen).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isOpen).toBe(false);
  });
});
