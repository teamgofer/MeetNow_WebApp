import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatMessageInput from '../../components/ChatMessageInput';
import { useProximityChatContext } from '../../context/ProximityChatContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the context
vi.mock('../../context/ProximityChatContext', () => ({
  useProximityChatContext: vi.fn()
}));

// Mock emoji-picker-react
vi.mock('emoji-picker-react', () => {
  return {
    __esModule: true,
    default: ({ onEmojiClick }) => (
      <div data-testid="emoji-picker">
        <button 
          data-testid="mock-emoji" 
          onClick={() => onEmojiClick({ emoji: '😊' })}
        >
          Select Emoji
        </button>
      </div>
    )
  };
});

describe('ChatMessageInput', () => {
  // Sample context data for testing
  const mockSendMessageFn = vi.fn();
  const mockSetTypingFn = vi.fn();
  
  const mockContextValue = {
    sendMessage: mockSendMessageFn,
    setTypingStatus: mockSetTypingFn,
    isConnected: true,
    typingUsers: {},
    currentUserId: 'user123',
    currentRegion: { id: 'region-1', name: 'Downtown' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useProximityChatContext.mockReturnValue(mockContextValue);
  });
  
  it('should render the input field', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    expect(inputField).toBeInTheDocument();
  });
  
  it('should send message on Enter key', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'Hello, world!' } });
    fireEvent.keyDown(inputField, { key: 'Enter', code: 13 });
    
    expect(mockSendMessageFn).toHaveBeenCalledWith({
      content: 'Hello, world!',
      regionId: 'region-1'
    });
    
    // Input should be cleared after sending
    expect(inputField.value).toBe('');
  });
  
  it('should not send empty messages', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: '' } });
    fireEvent.keyDown(inputField, { key: 'Enter', code: 13 });
    
    expect(mockSendMessageFn).not.toHaveBeenCalled();
  });
  
  it('should not send message on Enter key when shift is pressed', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'Hello, world!' } });
    fireEvent.keyDown(inputField, { key: 'Enter', code: 13, shiftKey: true });
    
    expect(mockSendMessageFn).not.toHaveBeenCalled();
    expect(inputField.value).toBe('Hello, world!');
  });
  
  it('should send message when send button is clicked', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'Hello, world!' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockSendMessageFn).toHaveBeenCalledWith({
      content: 'Hello, world!',
      regionId: 'region-1'
    });
    
    // Input should be cleared after sending
    expect(inputField.value).toBe('');
  });
  
  it('should indicate typing status when user types', async () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'H' } });
    
    // Wait for the debounce delay
    await waitFor(() => {
      expect(mockSetTypingFn).toHaveBeenCalledWith(true);
    });
    
    // Clear the input
    fireEvent.change(inputField, { target: { value: '' } });
    
    // Wait for the typing to stop
    await waitFor(() => {
      expect(mockSetTypingFn).toHaveBeenCalledWith(false);
    });
  });
  
  it('should show emoji picker when emoji button is clicked', () => {
    render(<ChatMessageInput />);
    
    // Initially, emoji picker should not be visible
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    
    // Click the emoji button
    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);
    
    // Emoji picker should now be visible
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
  });
  
  it('should add emoji to input when emoji is selected', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'Hello ' } });
    
    // Open emoji picker
    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);
    
    // Click an emoji from the picker
    const mockEmoji = screen.getByTestId('mock-emoji');
    fireEvent.click(mockEmoji);
    
    // Input should now contain the text with the emoji
    expect(inputField.value).toBe('Hello 😊');
    
    // Emoji picker should be closed
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
  });
  
  it('should close emoji picker when clicking outside', () => {
    render(<ChatMessageInput />);
    
    // Open emoji picker
    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);
    
    // Emoji picker should be visible
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    
    // Click outside (trigger a global click event)
    fireEvent.mouseDown(document);
    
    // Emoji picker should now be closed
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
  });
  
  it('should disable input when not connected', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextValue,
      isConnected: false
    });
    
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    expect(inputField).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
  
  it('should show reconnecting message when not connected', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextValue,
      isConnected: false
    });
    
    render(<ChatMessageInput />);
    
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
  });
  
  it('should trim whitespace when sending messages', () => {
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: '  Hello, world!  ' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockSendMessageFn).toHaveBeenCalledWith({
      content: 'Hello, world!', // Trimmed
      regionId: 'region-1'
    });
  });
  
  it('should not send message if no current region', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextValue,
      currentRegion: null
    });
    
    render(<ChatMessageInput />);
    
    const inputField = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(inputField, { target: { value: 'Hello, world!' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockSendMessageFn).not.toHaveBeenCalled();
  });
  
  it('should show active typing users', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextValue,
      typingUsers: {
        user1: { name: 'John', timestamp: Date.now() },
        user2: { name: 'Jane', timestamp: Date.now() }
      }
    });
    
    render(<ChatMessageInput />);
    
    expect(screen.getByText(/John, Jane are typing/i)).toBeInTheDocument();
  });
  
  it('should show singular message for one typing user', () => {
    useProximityChatContext.mockReturnValue({
      ...mockContextValue,
      typingUsers: {
        user1: { name: 'John', timestamp: Date.now() }
      }
    });
    
    render(<ChatMessageInput />);
    
    expect(screen.getByText(/John is typing/i)).toBeInTheDocument();
  });
  
  it('should allow custom placeholder text', () => {
    const customPlaceholder = 'Say something...';
    
    render(<ChatMessageInput placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });
}); 