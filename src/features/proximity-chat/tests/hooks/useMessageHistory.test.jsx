import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';

import { useProximityChatContext } from '../../context/ProximityChatContext';
import useMessageHistory from '../../hooks/useMessageHistory';
import messageHistoryService from '../../services/messageHistoryService';

// Mock the services and context
jest.mock('../../services/messageHistoryService', () => ({
  loadMessagesBeforeArrival: jest.fn(),
  loadOlderMessages: jest.fn(),
  markMessagesAsRead: jest.fn(),
}));

jest.mock('../../context/ProximityChatContext', () => ({
  useProximityChatContext: jest.fn(),
}));

describe('useMessageHistory', () => {
  // Sample messages to use in tests
  const mockMessages = [
    { id: 'msg1', content: 'Hello', timestamp: '2023-06-12T12:00:00Z' },
    { id: 'msg2', content: 'Hi there', timestamp: '2023-06-12T12:05:00Z' },
  ];

  // Sample context state
  const mockContextState = {
    messages: mockMessages,
    isConnected: true,
    currentRegion: { id: 'region-123', name: 'Test Region' },
    updateRegionEntryTime: jest.fn(),
  };

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock context implementation
    useProximityChatContext.mockReturnValue(mockContextState);

    // Mock service implementations
    messageHistoryService.loadMessagesBeforeArrival.mockResolvedValue(mockMessages);
    messageHistoryService.loadOlderMessages.mockResolvedValue(mockMessages);
    messageHistoryService.markMessagesAsRead.mockResolvedValue({ success: true });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMessageHistory());

    expect(result.current.historyMessages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.loadBeforeArrival).toBe('function');
    expect(typeof result.current.loadOlderMessages).toBe('function');
  });

  it('should load messages before arrival', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // Call the hook method
    act(() => {
      result.current.loadBeforeArrival();
    });

    // Check loading state
    expect(result.current.loading).toBe(true);

    // Wait for the async operation to complete
    await waitForNextUpdate();

    // Check service was called with correct params
    expect(messageHistoryService.loadMessagesBeforeArrival).toHaveBeenCalledWith(
      'region-123',
      expect.any(Number),
      undefined
    );

    // Check state updates
    expect(result.current.historyMessages).toEqual(mockMessages);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when loading messages before arrival', async () => {
    // Mock service to throw error
    const errorMessage = 'Failed to load messages';
    messageHistoryService.loadMessagesBeforeArrival.mockRejectedValue(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // Call the hook method
    act(() => {
      result.current.loadBeforeArrival();
    });

    // Wait for the async operation to complete
    await waitForNextUpdate();

    // Check error state
    expect(result.current.error).toEqual(new Error(errorMessage));
    expect(result.current.loading).toBe(false);
    expect(result.current.historyMessages).toEqual([]);
  });

  it('should load older messages', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // First, load some initial messages
    act(() => {
      result.current.loadBeforeArrival();
    });

    await waitForNextUpdate();

    // Then, load older messages
    const oldestTimestamp = new Date('2023-06-12T12:00:00Z').getTime();

    act(() => {
      result.current.loadOlderMessages(oldestTimestamp);
    });

    // Check loading state
    expect(result.current.loading).toBe(true);

    // Wait for the async operation to complete
    await waitForNextUpdate();

    // Check service was called with correct params
    expect(messageHistoryService.loadOlderMessages).toHaveBeenCalledWith(
      'region-123',
      oldestTimestamp,
      undefined
    );

    // Check state updates - should append the newly loaded messages
    expect(result.current.historyMessages).toHaveLength(4);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when loading older messages', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // First, load some initial messages
    act(() => {
      result.current.loadBeforeArrival();
    });

    await waitForNextUpdate();

    // Mock service to throw error for the next call
    const errorMessage = 'Failed to load older messages';
    messageHistoryService.loadOlderMessages.mockRejectedValue(new Error(errorMessage));

    // Try to load older messages
    act(() => {
      result.current.loadOlderMessages(1686571200000);
    });

    // Wait for the async operation to complete
    await waitForNextUpdate();

    // Check error state
    expect(result.current.error).toEqual(new Error(errorMessage));
    expect(result.current.loading).toBe(false);
    // The previously loaded messages should still be available
    expect(result.current.historyMessages).toEqual(mockMessages);
  });

  it('should mark messages as read when called', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // Call the markAsRead method
    act(() => {
      result.current.markAsRead();
    });

    // Wait for the async operation to complete
    await waitForNextUpdate();

    // Check service was called with correct params
    expect(messageHistoryService.markMessagesAsRead).toHaveBeenCalledWith('region-123');
  });

  it('should handle connection state changes', () => {
    // Initial render with connected state
    const { result, rerender } = renderHook(() => useMessageHistory());

    // Update the context to disconnected state
    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      isConnected: false,
    });

    // Re-render with updated context
    rerender();

    // The hook should clear message history
    expect(result.current.historyMessages).toEqual([]);
  });

  it('should handle region changes', async () => {
    // Initial render with region-123
    const { result, waitForNextUpdate, rerender } = renderHook(() => useMessageHistory());

    // Load messages for initial region
    act(() => {
      result.current.loadBeforeArrival();
    });

    await waitForNextUpdate();

    // Update the context with a new region
    const newRegion = { id: 'region-456', name: 'New Region' };
    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      currentRegion: newRegion,
    });

    // Re-render with updated context
    rerender();

    // The hook should clear message history for the new region
    expect(result.current.historyMessages).toEqual([]);

    // Load messages for the new region
    act(() => {
      result.current.loadBeforeArrival();
    });

    await waitForNextUpdate();

    // Check service was called with the new region ID
    expect(messageHistoryService.loadMessagesBeforeArrival).toHaveBeenCalledWith(
      'region-456',
      expect.any(Number),
      undefined
    );
  });

  it('should handle loadMoreMessages with custom limit', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useMessageHistory());

    // Call with custom limit
    const customLimit = 15;

    act(() => {
      result.current.loadBeforeArrival(customLimit);
    });

    await waitForNextUpdate();

    // Check service was called with custom limit
    expect(messageHistoryService.loadMessagesBeforeArrival).toHaveBeenCalledWith(
      'region-123',
      expect.any(Number),
      customLimit
    );
  });

  it('should not load messages when no current region', async () => {
    // Mock context with no current region
    useProximityChatContext.mockReturnValue({
      ...mockContextState,
      currentRegion: null,
    });

    const { result } = renderHook(() => useMessageHistory());

    // Call the hook method
    act(() => {
      result.current.loadBeforeArrival();
    });

    // Service should not be called
    expect(messageHistoryService.loadMessagesBeforeArrival).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
