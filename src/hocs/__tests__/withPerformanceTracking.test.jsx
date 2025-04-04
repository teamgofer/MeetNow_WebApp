import { render, act } from '@testing-library/react';
import React from 'react';

import withPerformanceTracking from '../withPerformanceTracking';

// Mock performance.now to return predictable values
const originalPerformanceNow = performance.now;
let performanceNowCallCount = 0;
const mockPerformanceNowValues = [100, 150, 200, 250, 300, 350];

beforeEach(() => {
  performanceNowCallCount = 0;
  performance.now = jest.fn(() => mockPerformanceNowValues[performanceNowCallCount++]);

  // Reset between tests
  if (window.performanceMonitor) {
    window.performanceMonitor = undefined;
  }

  // Clear mocks
  jest.clearAllMocks();
});

afterAll(() => {
  performance.now = originalPerformanceNow;
});

// Test component
const TestComponent = props => <div data-testid="test-component">Test Component</div>;
TestComponent.displayName = 'TestComponent';

describe('withPerformanceTracking HOC', () => {
  test('renders the wrapped component correctly', () => {
    const WrappedComponent = withPerformanceTracking(TestComponent);
    const { getByTestId } = render(<WrappedComponent />);

    expect(getByTestId('test-component')).toBeInTheDocument();
  });

  test('sets the correct display name', () => {
    const WrappedComponent = withPerformanceTracking(TestComponent);
    expect(WrappedComponent.displayName).toBe('WithPerformanceTracking(TestComponent)');

    // Test with unnamed component
    const UnnamedComponent = () => <div>Unnamed</div>;
    const WrappedUnnamedComponent = withPerformanceTracking(UnnamedComponent);
    expect(WrappedUnnamedComponent.displayName).toBe('WithPerformanceTracking(UnnamedComponent)');
  });

  test('tracks mount timing with default options', () => {
    // Mock console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const WrappedComponent = withPerformanceTracking(TestComponent);

    // Component rendering and useEffect execution
    let component;
    act(() => {
      component = render(<WrappedComponent />);
    });

    // Check that mount timing was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] TestComponent mounted in'),
      expect.any(String)
    );

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test('tracks unmount timing', () => {
    // Mock console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const WrappedComponent = withPerformanceTracking(TestComponent);

    // Component rendering
    let component;
    act(() => {
      component = render(<WrappedComponent />);
    });

    // Unmounting component
    act(() => {
      component.unmount();
    });

    // Check unmount timing was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] TestComponent unmounted in'),
      expect.any(String)
    );

    // Check total mounted time was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] TestComponent was mounted for'),
      expect.any(String)
    );

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test('respects logToConsole option when set to false', () => {
    // Mock console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    const WrappedComponent = withPerformanceTracking(TestComponent, { logToConsole: false });

    // Component rendering and useEffect execution
    let component;
    act(() => {
      component = render(<WrappedComponent />);
    });

    // Check that nothing was logged
    expect(console.log).not.toHaveBeenCalled();

    // Restore console.log
    console.log = originalConsoleLog;
  });

  test('works with performance monitor if available', () => {
    // Mock performance monitor
    window.performanceMonitor = {
      trackOperationTiming: jest.fn(),
    };

    const WrappedComponent = withPerformanceTracking(TestComponent, {
      componentId: 'CustomID',
      logToConsole: false,
    });

    // Component rendering and useEffect execution
    let component;
    act(() => {
      component = render(<WrappedComponent />);
    });

    // Check that monitor was called
    expect(window.performanceMonitor.trackOperationTiming).toHaveBeenCalledWith(
      'component',
      'CustomID:mount',
      expect.any(Number),
      expect.objectContaining({ renderCount: expect.any(Number) })
    );

    // Unmounting component
    act(() => {
      component.unmount();
    });

    // Check that unmount was tracked
    expect(window.performanceMonitor.trackOperationTiming).toHaveBeenCalledWith(
      'component',
      'CustomID:unmount',
      expect.any(Number),
      expect.objectContaining({
        totalMountedTime: expect.any(Number),
        renderCount: expect.any(Number),
      })
    );
  });

  test('skips mount tracking when trackMounts is false', () => {
    // Mock performance monitor
    window.performanceMonitor = {
      trackOperationTiming: jest.fn(),
    };

    const WrappedComponent = withPerformanceTracking(TestComponent, {
      trackMounts: false,
    });

    // Component rendering
    let component;
    act(() => {
      component = render(<WrappedComponent />);
    });

    // Check that mount wasn't tracked
    expect(window.performanceMonitor.trackOperationTiming).not.toHaveBeenCalledWith(
      'component',
      expect.stringContaining(':mount'),
      expect.any(Number),
      expect.anything()
    );

    // Should still track render
    expect(window.performanceMonitor.trackOperationTiming).toHaveBeenCalledWith(
      'component',
      expect.stringContaining(':render'),
      expect.any(Number),
      expect.anything()
    );
  });
});
