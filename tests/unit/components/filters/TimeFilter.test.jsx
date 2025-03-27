import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import TimeFilter from '../TimeFilter';
import { ComponentStateProvider } from '../../../contexts/ComponentStateContext';

// Mock the component state context
jest.mock('../../../contexts/ComponentStateContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ComponentStateContext');
  
  return {
    ...originalModule,
    useMeetupState: () => ({
      meetupState: {
        filters: {
          timeRange: 'today'
        }
      },
      meetupActions: {
        updateFilters: jest.fn()
      }
    })
  };
});

// Mock the useBreakpoint hook
jest.mock('../../../hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Mock feature flags
jest.mock('../../../config/featureFlags', () => ({
  isFeatureEnabled: () => true
}));

// Mock extraction monitor
jest.mock('../../../utils/extraction-monitor', () => ({
  withExtractionMonitor: (Component) => Component,
  registerExtractedComponent: jest.fn(),
  trackComponentRender: jest.fn(),
  trackComponentError: jest.fn()
}));

describe('TimeFilter Component', () => {
  const renderWithProvider = (ui, options) => {
    return render(
      <ComponentStateProvider>{ui}</ComponentStateProvider>,
      options
    );
  };
  
  test('renders with default props', () => {
    renderWithProvider(<TimeFilter />);
    
    // Should render filter header
    expect(screen.getByText('Time')).toBeInTheDocument();
    
    // Should render all time buttons
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    
    // Today should be active as defined in the mocked context
    const todayButton = screen.getByText('Today');
    expect(todayButton.closest('button')).toHaveClass('active');
  });
  
  test('renders with initialTimeRange prop', () => {
    renderWithProvider(<TimeFilter initialTimeRange="tomorrow" />);
    
    // Tomorrow should be active when provided as initial time range
    // (but context still takes precedence, so Today should be active)
    const todayButton = screen.getByText('Today');
    expect(todayButton.closest('button')).toHaveClass('active');
  });
  
  test('calls onChange when time range is selected', () => {
    const handleChange = jest.fn();
    renderWithProvider(<TimeFilter onChange={handleChange} />);
    
    // Click on This Week button
    const weekButton = screen.getByText('This Week');
    fireEvent.click(weekButton);
    
    // onChange should be called with 'week'
    expect(handleChange).toHaveBeenCalledWith('week');
  });
  
  test('renders with custom className', () => {
    renderWithProvider(<TimeFilter className="custom-class" />);
    
    // Component should have the custom class
    const component = screen.getByText('Time').closest('.filter-group');
    expect(component).toHaveClass('custom-class');
  });
  
  test('renders with correct accessibility attributes', () => {
    renderWithProvider(<TimeFilter />);
    
    // Today should be marked as pressed
    const todayButton = screen.getByText('Today').closest('button');
    expect(todayButton).toHaveAttribute('aria-pressed', 'true');
    
    // Other buttons should not be marked as pressed
    const upcomingButton = screen.getByText('Upcoming').closest('button');
    expect(upcomingButton).toHaveAttribute('aria-pressed', 'false');
  });
  
  test('renders with mobile class when viewport is mobile', () => {
    // Override the mock to return mobile viewport
    jest.spyOn(require('../../../hooks/useBreakpoint'), 'useBreakpoint').mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    });
    
    renderWithProvider(<TimeFilter />);
    
    // Time buttons container should have mobile class
    const buttonsContainer = screen.getByText('Upcoming').closest('.time-buttons');
    expect(buttonsContainer).toHaveClass('mobile');
  });
}); 