import { renderHook, act } from '@testing-library/react';
import useLogger from './useLogger';
import Logger from '../utils/Logger';

// Mock the Logger utility
jest.mock('../utils/Logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    performance: jest.fn(),
    userAction: jest.fn(),
    subscribe: jest.fn().mockReturnValue(jest.fn()),
  },
}));

describe('useLogger', () => {
  const mockComponentName = 'TestComponent';
  const mockLogEntry = {
    timestamp: '2024-05-19T12:00:00Z',
    level: 0,
    levelName: 'DEBUG',
    component: 'TestComponent',
    message: 'Test message',
    data: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with component name', () => {
    const { result } = renderHook(() => useLogger(mockComponentName));

    expect(result.current).toBeDefined();
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.performance).toBe('function');
    expect(typeof result.current.userAction).toBe('function');
  });

  it('should subscribe to log events on mount', () => {
    renderHook(() => useLogger(mockComponentName));

    expect(Logger.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should unsubscribe from log events on unmount', () => {
    const unsubscribe = jest.fn();
    (Logger.subscribe as jest.Mock).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useLogger(mockComponentName));

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should call logger methods with correct parameters', () => {
    const { result } = renderHook(() => useLogger(mockComponentName));

    act(() => {
      result.current.debug('Debug message', { data: 'test' });
      result.current.info('Info message', { data: 'test' });
      result.current.warn('Warning message', { data: 'test' });
      result.current.error('Error message', new Error('Test error'));
      result.current.performance('Test operation', 100);
      result.current.userAction('Test action', { data: 'test' });
    });

    expect(Logger.debug).toHaveBeenCalledWith(mockComponentName, 'Debug message', { data: 'test' });
    expect(Logger.info).toHaveBeenCalledWith(mockComponentName, 'Info message', { data: 'test' });
    expect(Logger.warn).toHaveBeenCalledWith(mockComponentName, 'Warning message', {
      data: 'test',
    });
    expect(Logger.error).toHaveBeenCalledWith(
      mockComponentName,
      'Error message',
      expect.any(Error)
    );
    expect(Logger.performance).toHaveBeenCalledWith('Test operation', 100);
    expect(Logger.userAction).toHaveBeenCalledWith('Test action', { data: 'test' });
  });

  it('should handle log events from subscription', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { result } = renderHook(() => useLogger(mockComponentName));

    // Get the subscription callback
    const subscribeCallback = (Logger.subscribe as jest.Mock).mock.calls[0][0];

    // Simulate a log event
    act(() => {
      subscribeCallback(mockLogEntry);
    });

    expect(consoleSpy).toHaveBeenCalledWith(`[${mockComponentName}] Log event:`, mockLogEntry);

    consoleSpy.mockRestore();
  });
});
