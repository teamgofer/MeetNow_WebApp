import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import * as featureFlags from '../../../config/featureFlags';
import { ComponentStateProvider } from '../../../contexts/ComponentStateContext';
import SearchFilter from '../SearchFilter';

// Mock the component state context with tracking for updates
const mockUpdateFilters = jest.fn();
jest.mock('../../../contexts/ComponentStateContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ComponentStateContext');

  return {
    ...originalModule,
    useMeetupState: () => ({
      meetupState: {
        filters: {
          distance: 10,
          category: 'social',
          timeRange: 'today',
        },
      },
      meetupActions: {
        updateFilters: mockUpdateFilters,
      },
    }),
  };
});

// Mock feature flags
jest.mock('../../../config/featureFlags', () => {
  const originalModule = jest.requireActual('../../../config/featureFlags');
  return {
    ...originalModule,
    isFeatureEnabled: jest.fn(),
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

// Mock extracted components to simplify testing
jest.mock('../DistanceSlider', () =>
  jest.fn(props => (
    <div data-testid="distance-slider">
      <div data-testid="distance-value">{props.initialValue} miles</div>
      <input
        type="range"
        min="1"
        max="50"
        value={props.initialValue}
        onChange={e => props.onChange(parseInt(e.target.value, 10))}
        data-testid="distance-slider-input"
      />
    </div>
  ))
);

jest.mock('../CategoryFilter', () =>
  jest.fn(props => (
    <div data-testid="category-filter">
      <div>Current: {props.initialCategory}</div>
      <button onClick={() => props.onChange('all')} data-testid="category-all">
        All
      </button>
      <button onClick={() => props.onChange('social')} data-testid="category-social">
        Social
      </button>
      <button onClick={() => props.onChange('business')} data-testid="category-business">
        Business
      </button>
    </div>
  ))
);

jest.mock('../TimeFilter', () =>
  jest.fn(props => (
    <div data-testid="time-filter">
      <div>Current: {props.initialTimeRange}</div>
      <button onClick={() => props.onChange('upcoming')} data-testid="time-upcoming">
        Upcoming
      </button>
      <button onClick={() => props.onChange('today')} data-testid="time-today">
        Today
      </button>
      <button onClick={() => props.onChange('week')} data-testid="time-week">
        This Week
      </button>
    </div>
  ))
);

// Mock extraction monitor
jest.mock('../../../utils/extraction-monitor', () => ({
  withExtractionMonitor: Component => Component,
  registerExtractedComponent: jest.fn(),
  trackComponentRender: jest.fn(),
  trackComponentError: jest.fn(),
}));

describe('Filters Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Enable all extracted components by default
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag.startsWith('USE_EXTRACTED_')) return true;
      return false;
    });
  });

  const renderWithProvider = () => {
    return render(
      <ComponentStateProvider>
        <SearchFilter />
      </ComponentStateProvider>
    );
  };

  test('renders all extracted filter components when feature flags are enabled', () => {
    renderWithProvider();

    // All extracted components should be rendered
    expect(screen.getByTestId('distance-slider')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    expect(screen.getByTestId('time-filter')).toBeInTheDocument();
  });

  test('changes distance filter and updates state', () => {
    renderWithProvider();

    // Get the distance slider input and change its value
    const slider = screen.getByTestId('distance-slider-input');
    fireEvent.change(slider, { target: { value: '20' } });

    // Check if updateFilters was called with correct params
    expect(mockUpdateFilters).toHaveBeenCalledWith({ distance: 20 });
  });

  test('changes category filter and updates state', () => {
    renderWithProvider();

    // Get the business category button and click it
    const businessButton = screen.getByTestId('category-business');
    fireEvent.click(businessButton);

    // Check if updateFilters was called with correct params
    expect(mockUpdateFilters).toHaveBeenCalledWith({ category: 'business' });
  });

  test('changes time filter and updates state', () => {
    renderWithProvider();

    // Get the upcoming time button and click it
    const upcomingButton = screen.getByTestId('time-upcoming');
    fireEvent.click(upcomingButton);

    // Check if updateFilters was called with correct params
    expect(mockUpdateFilters).toHaveBeenCalledWith({ timeRange: 'upcoming' });
  });

  test('renders original distance slider when feature flag is disabled', () => {
    // Mock feature flag to disable extracted distance slider
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag === 'USE_EXTRACTED_DISTANCE_SLIDER') return false;
      return true;
    });

    renderWithProvider();

    // Original distance slider should be rendered (contains "Distance" label)
    expect(screen.getByText('Distance')).toBeInTheDocument();

    // Extracted distance slider should NOT be rendered
    expect(screen.queryByTestId('distance-slider')).not.toBeInTheDocument();

    // Other extracted components should still be rendered
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    expect(screen.getByTestId('time-filter')).toBeInTheDocument();
  });

  test('renders all original components when all feature flags are disabled', () => {
    // Mock all feature flags as disabled
    featureFlags.isFeatureEnabled.mockImplementation(() => false);

    renderWithProvider();

    // All original components should be rendered
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();

    // No extracted components should be rendered
    expect(screen.queryByTestId('distance-slider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('time-filter')).not.toBeInTheDocument();
  });

  test('works with mixed original and extracted components', () => {
    // Mock some feature flags as enabled, some as disabled
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag === 'USE_EXTRACTED_DISTANCE_SLIDER') return true;
      if (flag === 'USE_EXTRACTED_CATEGORY_FILTER') return false;
      if (flag === 'USE_EXTRACTED_TIME_FILTER') return true;
      return false;
    });

    renderWithProvider();

    // Check which components are rendered
    expect(screen.getByTestId('distance-slider')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByTestId('time-filter')).toBeInTheDocument();

    expect(screen.queryByTestId('category-filter')).not.toBeInTheDocument();
  });
});
