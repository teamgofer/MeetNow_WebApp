import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatMessageHistory from '../../components/ChatMessageHistory';
import useMessageHistory from '../../hooks/useMessageHistory';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useMessageHistory', () => vi.fn());

// Mock the components used in ChatMessageHistory
vi.mock('../../components/MessageHistoryHeader', () => ({ 
  regionName, 
  messageCount, 
  enteredAreaTime 
}) => (
  <div data-testid="message-history-header">
    Header: {regionName} ({messageCount} messages)
    {enteredAreaTime && <span>Entered at: {enteredAreaTime.toISOString()}</span>}
  </div>
));

vi.mock('../../components/MessageList', () => ({ 
  messages, 
  isHistory,
  hasMore,
  onLoadMore
}) => (
  <div data-testid="message-list">
    {messages.map(msg => (
      <div key={msg.id} data-testid={`message-${msg.id}`}>
        {msg.content}
      </div>
    ))}
    {hasMore && (
      <button 
        data-testid="load-more-button" 
        onClick={onLoadMore}
      >
        Load More
      </button>
    )}
    {isHistory && <span data-testid="is-history-flag">History View</span>}
  </div>
));

describe('ChatMessageHistory', () => {
  // Sample messages and state for testing
  const mockHistoryMessages = [
    { id: 'msg1', content: 'Message 1', timestamp: '2023-06-12T12:00:00Z' },
    { id: 'msg2', content: 'Message 2', timestamp: '2023-06-12T12:05:00Z' }
  ];
  
  const mockTimeInfo = {
    enteredAt: new Date('2023-06-12T12:10:00Z')
  };
  
  const mockUseMessageHistory = {
    historyMessages: mockHistoryMessages,
    loading: false,
    error: null,
    loadBeforeArrival: vi.fn(),
    loadOlderMessages: vi.fn(),
    markAsRead: vi.fn(),
    hasMoreMessages: true
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    useMessageHistory.mockReturnValue(mockUseMessageHistory);
  });
  
  it('should render with history messages', () => {
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check that the header is rendered
    expect(screen.getByTestId('message-history-header')).toBeInTheDocument();
    
    // Check that the message list is rendered with messages
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg1')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg2')).toBeInTheDocument();
    
    // Check that history flag is passed correctly
    expect(screen.getByTestId('is-history-flag')).toBeInTheDocument();
  });
  
  it('should handle loading state', () => {
    useMessageHistory.mockReturnValue({
      ...mockUseMessageHistory,
      loading: true
    });
    
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check loading indicator is shown
    expect(screen.getByText(/Loading message history/i)).toBeInTheDocument();
  });
  
  it('should handle error state', () => {
    useMessageHistory.mockReturnValue({
      ...mockUseMessageHistory,
      error: new Error('Failed to load messages')
    });
    
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check error message is shown
    expect(screen.getByText(/Error loading message history/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load messages/i)).toBeInTheDocument();
    
    // Check retry button is shown
    const retryButton = screen.getByText(/Retry/i);
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    
    // Check loadBeforeArrival was called
    expect(mockUseMessageHistory.loadBeforeArrival).toHaveBeenCalledTimes(1);
  });
  
  it('should call loadBeforeArrival on mount', () => {
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check loadBeforeArrival was called on mount
    expect(mockUseMessageHistory.loadBeforeArrival).toHaveBeenCalledTimes(1);
  });
  
  it('should call markAsRead on unmount', () => {
    const { unmount } = render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Unmount the component
    unmount();
    
    // Check markAsRead was called
    expect(mockUseMessageHistory.markAsRead).toHaveBeenCalledTimes(1);
  });
  
  it('should handle load more button click', () => {
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Click the load more button
    fireEvent.click(screen.getByTestId('load-more-button'));
    
    // Check loadOlderMessages was called with the timestamp of the first message
    expect(mockUseMessageHistory.loadOlderMessages).toHaveBeenCalledWith(
      new Date('2023-06-12T12:00:00Z').getTime()
    );
  });
  
  it('should not render header or message list when there are no messages', () => {
    useMessageHistory.mockReturnValue({
      ...mockUseMessageHistory,
      historyMessages: []
    });
    
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check empty state message is shown
    expect(screen.getByText(/No previous messages/i)).toBeInTheDocument();
    
    // Message list and header should not be rendered
    expect(screen.queryByTestId('message-history-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
  });
  
  it('should not render when regionTimeInfo is missing', () => {
    const { container } = render(
      <ChatMessageHistory 
        regionName="Test Region"
      />
    );
    
    // Component should render nothing
    expect(container.firstChild).toBeNull();
  });
  
  it('should reuse region name from time info if not provided directly', () => {
    const timeInfoWithRegionName = {
      ...mockTimeInfo,
      regionName: 'Region From TimeInfo'
    };
    
    render(
      <ChatMessageHistory 
        regionTimeInfo={timeInfoWithRegionName}
      />
    );
    
    // Check the header includes the region name from time info
    expect(screen.getByTestId('message-history-header')).toHaveTextContent('Region From TimeInfo');
  });
  
  it('should pass message count to the header', () => {
    render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Check that the header includes the message count (from historyMessages.length)
    expect(screen.getByTestId('message-history-header')).toHaveTextContent('(2 messages)');
  });
  
  it('should handle regionTimeInfo changes', () => {
    const { rerender } = render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
      />
    );
    
    // Clear previous calls
    mockUseMessageHistory.loadBeforeArrival.mockClear();
    
    // Update regionTimeInfo
    const newTimeInfo = {
      ...mockTimeInfo,
      enteredAt: new Date('2023-06-12T13:00:00Z')
    };
    
    rerender(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={newTimeInfo}
      />
    );
    
    // Check loadBeforeArrival was called with new time info
    expect(mockUseMessageHistory.loadBeforeArrival).toHaveBeenCalledWith(newTimeInfo.enteredAt);
  });
  
  it('should apply custom className and style', () => {
    const { container } = render(
      <ChatMessageHistory 
        regionName="Test Region"
        regionTimeInfo={mockTimeInfo}
        className="custom-history"
        style={{ backgroundColor: 'red' }}
      />
    );
    
    const historyElement = container.firstChild;
    expect(historyElement).toHaveClass('chat-message-history');
    expect(historyElement).toHaveClass('custom-history');
    expect(historyElement).toHaveStyle('background-color: red');
  });
}); 