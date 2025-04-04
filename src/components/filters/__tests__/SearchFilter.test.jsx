import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import * as featureFlags from '../../../config/featureFlags';
import { ComponentStateProvider } from '../../../contexts/ComponentStateContext';
import SearchFilter from '../SearchFilter';

// Mock the component state context
jest.mock('../../../contexts/ComponentStateContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ComponentStateContext');

  return {
    ...originalModule,
    useMeetupState: () => ({
      meetupState: {
        filters: {
          distance: 5,
          category: 'all',
          timeRange: 'upcoming',
        },
      },
      meetupActions: {
        updateFilters: jest.fn(),
      },
    }),
  };
});

// Mock the DistanceSlider component
jest.mock('../DistanceSlider', () => {
  return jest.fn(props => (
    <div data-testid="mocked-distance-slider">
      <div data-testid="mocked-distance-value">{props.initialValue} miles</div>
      <input
        type="range"
        min={props.min || 1}
        max={props.max || 50}
        value={props.initialValue || 5}
        onChange={e => props.onChange?.(parseInt(e.target.value, 10))}
        data-testid="mocked-slider-input"
      />
    </div>
  ));
});

// Mock feature flags with spy
const originalIsFeatureEnabled = jest.requireActual(
  '../../../config/featureFlags'
).isFeatureEnabled;
jest.mock('../../../config/featureFlags', () => ({
  ...jest.requireActual('../../../config/featureFlags'),
  isFeatureEnabled: jest.fn(),
  FeatureFlag: jest.requireActual('../../../config/featureFlags').FeatureFlag,
}));

// Mock extraction monitor
jest.mock('../../../utils/extraction-monitor', () => ({
  withExtractionMonitor: Component => Component,
  registerExtractedComponent: jest.fn(),
  trackComponentRender: jest.fn(),
  trackComponentError: jest.fn(),
}));

describe('SearchFilter Component', () => {
  const renderWithProvider = (ui, options) => {
    return render(<ComponentStateProvider>{ui}</ComponentStateProvider>, options);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to feature flag enabled
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag === 'USE_EXTRACTED_DISTANCE_SLIDER') return true;
      return originalIsFeatureEnabled(flag);
    });
  });

  test('renders correctly with extracted DistanceSlider when feature flag is enabled', () => {
    renderWithProvider(<SearchFilter />);

    // Search Filter should render
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();

    // Extracted DistanceSlider should render
    expect(screen.getByTestId('mocked-distance-slider')).toBeInTheDocument();

    // Original DistanceSlider should NOT render
    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
  });

  test('renders with original DistanceSlider when feature flag is disabled', () => {
    // Mock feature flag as disabled
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag === 'USE_EXTRACTED_DISTANCE_SLIDER') return false;
      return originalIsFeatureEnabled(flag);
    });

    renderWithProvider(<SearchFilter />);

    // Search Filter should render
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();

    // Original DistanceSlider should render (contains "Distance" label)
    expect(screen.getByText('Distance')).toBeInTheDocument();

    // Extracted DistanceSlider should NOT render
    expect(screen.queryByTestId('mocked-distance-slider')).not.toBeInTheDocument();
  });

  test('updates filters when extracted DistanceSlider changes', () => {
    renderWithProvider(<SearchFilter />);

    // Get the mocked slider input
    const slider = screen.getByTestId('mocked-slider-input');

    // Simulate value change
    fireEvent.change(slider, { target: { value: '15' } });

    // Check if updateFilters was called
    const { updateFilters } = require('../../../contexts/ComponentStateContext').useMeetupState()
      .meetupActions;
    expect(updateFilters).toHaveBeenCalledWith({ distance: 15 });
  });

  test('updates filters when original DistanceSlider changes', () => {
    // Mock feature flag as disabled
    featureFlags.isFeatureEnabled.mockImplementation(flag => {
      if (flag === 'USE_EXTRACTED_DISTANCE_SLIDER') return false;
      return originalIsFeatureEnabled(flag);
    });

    renderWithProvider(<SearchFilter />);

    // Get the original slider input
    const slider = screen.getByRole('slider');

    // Simulate value change
    fireEvent.change(slider, { target: { value: '15' } });

    // Check if updateFilters was called
    const { updateFilters } = require('../../../contexts/ComponentStateContext').useMeetupState()
      .meetupActions;
    expect(updateFilters).toHaveBeenCalledWith({ distance: 15 });
  });

  test('renders other filter components (Category and Time)', () => {
    renderWithProvider(<SearchFilter />);

    // CategoryFilter should render
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();

    // TimeFilter should render
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
