import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import ChatRegionEntryNotice from '../../components/ChatRegionEntryNotice';

// Mock timeUtils module
vi.mock('../../utils/timeUtils', () => ({
  formatRelativeTime: vi.fn().mockReturnValue('10 minutes ago'),
}));

describe('ChatRegionEntryNotice', () => {
  // Mock function for loading previous messages
  const mockLoadPreviousMessages = vi.fn().mockResolvedValue([]);

  // Set up timers for testing auto-hide
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const defaultProps = {
    regionId: 'region-123',
    regionName: 'Downtown',
    enteredAt: new Date(),
    onLoadPreviousMessages: mockLoadPreviousMessages,
    messageCount: 5,
  };

  it('should render with region name', () => {
    render(<ChatRegionEntryNotice {...defaultProps} />);

    expect(screen.getByText(/You've entered Downtown/)).toBeInTheDocument();
  });

  it('should use regionId when no regionName is provided', () => {
    const { regionName, ...propsWithoutName } = defaultProps;

    render(<ChatRegionEntryNotice {...propsWithoutName} />);

    expect(screen.getByText(/You've entered the region-123 area/)).toBeInTheDocument();
  });

  it('should show message count when messages exist', () => {
    render(<ChatRegionEntryNotice {...defaultProps} />);

    expect(screen.getByText(/There are 5 messages from before you arrived/)).toBeInTheDocument();
  });

  it('should use singular form for message count of 1', () => {
    render(<ChatRegionEntryNotice {...defaultProps} messageCount={1} />);

    expect(screen.getByText(/There is 1 message from before you arrived/)).toBeInTheDocument();
  });

  it('should not show message count or load button when messageCount is 0', () => {
    render(<ChatRegionEntryNotice {...defaultProps} messageCount={0} />);

    expect(screen.queryByText(/There/)).not.toBeInTheDocument();
    expect(screen.queryByText('Load Previous')).not.toBeInTheDocument();
  });

  it('should call onLoadPreviousMessages when button is clicked', async () => {
    render(<ChatRegionEntryNotice {...defaultProps} />);

    fireEvent.click(screen.getByText('Load Previous'));

    expect(mockLoadPreviousMessages).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when loading messages', async () => {
    // Create a promise that we can control when it resolves
    let resolvePromise;
    const loadingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    const loadingMock = vi.fn().mockReturnValue(loadingPromise);

    render(<ChatRegionEntryNotice {...defaultProps} onLoadPreviousMessages={loadingMock} />);

    // Click the button to start loading
    fireEvent.click(screen.getByText('Load Previous'));

    // Check that loading state is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolvePromise();
    });

    // Notice should be hidden after loading completes
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should hide when close button is clicked', () => {
    render(<ChatRegionEntryNotice {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '' }); // SVG button
    fireEvent.click(closeButton);

    // Notice should be hidden
    expect(screen.queryByText(/You've entered/)).not.toBeInTheDocument();
  });

  it('should auto-hide after specified time', () => {
    render(<ChatRegionEntryNotice {...defaultProps} autoHide={true} hideAfter={5000} />);

    // Notice should be visible initially
    expect(screen.getByText(/You've entered/)).toBeInTheDocument();

    // Advance timers by less than the hideAfter time
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Notice should still be visible
    expect(screen.getByText(/You've entered/)).toBeInTheDocument();

    // Advance timers past the hideAfter time
    act(() => {
      vi.advanceTimersByTime(1001);
    });

    // Notice should be hidden
    expect(screen.queryByText(/You've entered/)).not.toBeInTheDocument();
  });

  it('should not auto-hide when autoHide is false', () => {
    render(<ChatRegionEntryNotice {...defaultProps} autoHide={false} hideAfter={5000} />);

    // Notice should be visible initially
    expect(screen.getByText(/You've entered/)).toBeInTheDocument();

    // Advance timers past the hideAfter time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Notice should still be visible
    expect(screen.getByText(/You've entered/)).toBeInTheDocument();
  });

  it('should apply custom class names and styles', () => {
    const { container } = render(
      <ChatRegionEntryNotice
        {...defaultProps}
        className="custom-notice"
        style={{ backgroundColor: 'red' }}
      />
    );

    const noticeElement = container.firstChild;
    expect(noticeElement).toHaveClass('chat-region-entry-notice');
    expect(noticeElement).toHaveClass('custom-notice');
    expect(noticeElement).toHaveStyle('background-color: red');
  });
});
