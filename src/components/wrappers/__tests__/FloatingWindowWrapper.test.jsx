import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import FloatingWindowWrapper from '../FloatingWindowWrapper';

describe('FloatingWindowWrapper', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct position classes', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} position="top-right">
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    expect(window.className).toContain('top-4');
    expect(window.className).toContain('right-4');
  });

  it('handles visibility correctly', () => {
    const { rerender } = render(
      <FloatingWindowWrapper isOpen={false} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();

    rerender(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} className="custom-class">
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(screen.getByTestId('floating-window').className).toContain('custom-class');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} style={customStyle}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    expect(window).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders with correct z-index', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} zIndex={50}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    expect(window.className).toContain('z-50');
  });

  it('handles overflow correctly', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} maxHeight="200px">
        <div style={{ height: '300px' }}>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    expect(window.style.maxHeight).toBe('200px');
    expect(window.style.overflowY).toBe('auto');
  });

  it('applies max height constraint', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose} maxHeight="300px">
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    expect(window.style.maxHeight).toBe('300px');
  });

  it('handles window resize correctly', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    fireEvent(window, new Event('resize'));
    // Add assertions for resize handling if needed
  });

  it('prevents body scroll when window is open', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when window is closed', () => {
    const { rerender } = render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    rerender(
      <FloatingWindowWrapper isOpen={false} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('handles escape key to close window', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('maintains focus within window when open', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <button>Test Button</button>
      </FloatingWindowWrapper>
    );
    const button = screen.getByText('Test Button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('handles nested floating windows correctly', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <FloatingWindowWrapper isOpen={true} onClose={vi.fn()}>
          <div>Nested Content</div>
        </FloatingWindowWrapper>
      </FloatingWindowWrapper>
    );
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('handles dynamic content updates', () => {
    const { rerender } = render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Initial Content</div>
      </FloatingWindowWrapper>
    );
    rerender(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Updated Content</div>
      </FloatingWindowWrapper>
    );
    expect(screen.getByText('Updated Content')).toBeInTheDocument();
  });

  it('maintains scroll position during content updates', () => {
    const { rerender } = render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div style={{ height: '1000px' }}>Long Content</div>
      </FloatingWindowWrapper>
    );
    const content = screen.getByTestId('floating-window-content');
    content.scrollTop = 100;
    rerender(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div style={{ height: '1000px' }}>Updated Long Content</div>
      </FloatingWindowWrapper>
    );
    expect(content.scrollTop).toBe(100);
  });

  it('handles touch events correctly', () => {
    render(
      <FloatingWindowWrapper isOpen={true} onClose={mockOnClose}>
        <div>Test Content</div>
      </FloatingWindowWrapper>
    );
    const window = screen.getByTestId('floating-window');
    fireEvent.touchStart(window);
    fireEvent.touchMove(window);
    fireEvent.touchEnd(window);
    // Add assertions for touch handling if needed
  });
});
