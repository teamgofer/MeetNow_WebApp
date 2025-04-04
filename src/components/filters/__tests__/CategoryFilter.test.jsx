import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { ComponentStateProvider } from '../../../contexts/ComponentStateContext';
import CategoryFilter from '../CategoryFilter';

// Mock the component state context
jest.mock('../../../contexts/ComponentStateContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ComponentStateContext');

  return {
    ...originalModule,
    useMeetupState: () => ({
      meetupState: {
        filters: {
          category: 'social',
        },
      },
      meetupActions: {
        updateFilters: jest.fn(),
      },
    }),
  };
});

// Mock the useBreakpoint hook
jest.mock('../../../hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Mock feature flags
jest.mock('../../../config/featureFlags', () => ({
  isFeatureEnabled: () => true,
}));

// Mock extraction monitor
jest.mock('../../../utils/extraction-monitor', () => ({
  withExtractionMonitor: Component => Component,
  registerExtractedComponent: jest.fn(),
  trackComponentRender: jest.fn(),
  trackComponentError: jest.fn(),
}));

describe('CategoryFilter Component', () => {
  const renderWithProvider = (ui, options) => {
    return render(<ComponentStateProvider>{ui}</ComponentStateProvider>, options);
  };

  test('renders with default props', () => {
    renderWithProvider(<CategoryFilter />);

    // Should render filter header
    expect(screen.getByText('Category')).toBeInTheDocument();

    // Should render all category buttons
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Recreation')).toBeInTheDocument();

    // Social should be active as defined in the mocked context
    const socialButton = screen.getByText('Social');
    expect(socialButton.closest('button')).toHaveClass('active');
  });

  test('renders with initialCategory prop', () => {
    renderWithProvider(<CategoryFilter initialCategory="business" />);

    // Business should be active when provided as initial category
    // (but context still takes precedence, so Social should be active)
    const socialButton = screen.getByText('Social');
    expect(socialButton.closest('button')).toHaveClass('active');
  });

  test('calls onChange when category is selected', () => {
    const handleChange = jest.fn();
    renderWithProvider(<CategoryFilter onChange={handleChange} />);

    // Click on Education button
    const educationButton = screen.getByText('Education');
    fireEvent.click(educationButton);

    // onChange should be called with 'education'
    expect(handleChange).toHaveBeenCalledWith('education');
  });

  test('renders with custom className', () => {
    renderWithProvider(<CategoryFilter className="custom-class" />);

    // Component should have the custom class
    const component = screen.getByText('Category').closest('.filter-group');
    expect(component).toHaveClass('custom-class');
  });

  test('renders with correct accessibility attributes', () => {
    renderWithProvider(<CategoryFilter />);

    // Social should be marked as pressed
    const socialButton = screen.getByText('Social').closest('button');
    expect(socialButton).toHaveAttribute('aria-pressed', 'true');

    // Other buttons should not be marked as pressed
    const allButton = screen.getByText('All').closest('button');
    expect(allButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('renders with mobile class when viewport is mobile', () => {
    // Override the mock to return mobile viewport
    jest.spyOn(require('../../../hooks/useBreakpoint'), 'useBreakpoint').mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    renderWithProvider(<CategoryFilter />);

    // Category buttons container should have mobile class
    const buttonsContainer = screen.getByText('All').closest('.category-buttons');
    expect(buttonsContainer).toHaveClass('mobile');
  });
});
