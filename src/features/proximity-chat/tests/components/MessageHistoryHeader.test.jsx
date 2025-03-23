import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageHistoryHeader from '../../components/MessageHistoryHeader';

// Mock the timeUtils module
jest.mock('../../utils/timeUtils', () => ({
  formatRelativeTime: jest.fn().mockReturnValue('5 minutes ago')
}));

describe('MessageHistoryHeader', () => {
  const defaultProps = {
    enteredAreaTime: new Date(),
    messageCount: 10,
    areaName: 'Test Area'
  };

  it('should render with default props', () => {
    render(<MessageHistoryHeader {...defaultProps} />);
    
    // Check if message count is displayed
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Check if area name is displayed
    expect(screen.getByText(/Test Area/)).toBeInTheDocument();
    
    // Check if time is displayed
    expect(screen.getByText(/before you arrived 5 minutes ago/)).toBeInTheDocument();
  });

  it('should render singular "message" for count of 1', () => {
    render(<MessageHistoryHeader {...defaultProps} messageCount={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/message sent/)).toBeInTheDocument(); // singular
  });

  it('should render plural "messages" for count > 1', () => {
    render(<MessageHistoryHeader {...defaultProps} messageCount={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/messages sent/)).toBeInTheDocument(); // plural
  });

  it('should not render time when showEnteredTime is false', () => {
    render(<MessageHistoryHeader {...defaultProps} showEnteredTime={false} />);
    expect(screen.queryByText(/before you arrived/)).not.toBeInTheDocument();
  });

  it('should use default "this area" when no areaName is provided', () => {
    const { areaName, ...propsWithoutAreaName } = defaultProps;
    render(<MessageHistoryHeader {...propsWithoutAreaName} />);
    expect(screen.getByText(/this area/)).toBeInTheDocument();
  });

  it('should apply custom class names and styles', () => {
    const customClassName = 'custom-header';
    const customStyle = { color: 'red' };
    
    const { container } = render(
      <MessageHistoryHeader 
        {...defaultProps} 
        className={customClassName} 
        style={customStyle} 
      />
    );
    
    const headerElement = container.firstChild;
    expect(headerElement).toHaveClass('message-history-header');
    expect(headerElement).toHaveClass(customClassName);
    expect(headerElement).toHaveStyle('color: red');
  });

  it('should not render when messageCount is 0', () => {
    const { container } = render(
      <MessageHistoryHeader {...defaultProps} messageCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should not render when enteredAreaTime is not provided', () => {
    const { enteredAreaTime, ...propsWithoutTime } = defaultProps;
    const { container } = render(<MessageHistoryHeader {...propsWithoutTime} />);
    expect(container.firstChild).toBeNull();
  });
}); 