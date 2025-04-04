import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import * as featureFlags from '../../../config/featureFlags';
import { ComponentStateProvider } from '../../../contexts/ComponentStateContext';
import DistanceSlider from '../DistanceSlider';

// Mock the component state context
jest.mock('../../../contexts/ComponentStateContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ComponentStateContext');

  return {
    ...originalModule,
    useMeetupState: () => ({
      meetupState: {
        filters: {
          distance: 5,
        },
      },
      meetupActions: {
        updateFilters: jest.fn(),
      },
    }),
    useUIState: () => ({
      uiState: {
        isLoading: false,
      },
      uiActions: {
        setLoading: jest.fn(),
      },
    }),
  };
});

// Mock the useBreakpoint hook
jest.mock('../../../hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({
    getResponsiveValue: obj => obj.default || obj.md,
    isMobile: false,
  }),
}));

// Mock feature flags
jest.mock('../../../config/featureFlags', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
  FEATURE_FLAGS: {
    USE_EXTRACTED_DISTANCE_SLIDER: true,
    ENABLE_COMPONENT_REGISTRY: true,
  },
}));

// Mock extraction monitor
jest.mock('../../../utils/extraction-monitor', () => ({
  withExtractionMonitor: Component => Component,
  registerExtractedComponent: jest.fn(),
  trackComponentRender: jest.fn(),
  trackComponentError: jest.fn(),
}));

describe('DistanceSlider Component', () => {
  const renderWithProvider = (ui, options) => {
    return render(<ComponentStateProvider>{ui}</ComponentStateProvider>, options);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with default props', () => {
    renderWithProvider(<DistanceSlider />);

    // Check if component renders
    expect(screen.getByTestId('distance-slider')).toBeInTheDocument();
    expect(screen.getByTestId('distance-value')).toHaveTextContent('5 miles');

    // Check if slider has correct default values
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '50');
    expect(slider).toHaveAttribute('value', '5');
  });

  test('renders with custom initial value', () => {
    renderWithProvider(<DistanceSlider initialValue={10} />);

    expect(screen.getByTestId('distance-value')).toHaveTextContent('10 miles');
    expect(screen.getByRole('slider')).toHaveAttribute('value', '10');
  });

  test('handles slider value changes', () => {
    const handleChange = jest.fn();
    renderWithProvider(<DistanceSlider onChange={handleChange} />);

    // Get the slider element
    const slider = screen.getByRole('slider');

    // Simulate value change
    fireEvent.change(slider, { target: { value: '15' } });

    // Check if value is updated in the UI
    expect(screen.getByTestId('distance-value')).toHaveTextContent('15 miles');

    // Check if onChange callback was called
    expect(handleChange).toHaveBeenCalledWith(15);
  });

  test('handles feature flag disabled', () => {
    // Mock feature flag as disabled
    featureFlags.isFeatureEnabled.mockReturnValueOnce(false);

    renderWithProvider(<DistanceSlider />);

    // Component should still render (the HOC should handle the feature flag)
    expect(screen.getByTestId('distance-slider')).toBeInTheDocument();
  });

  test('has correct data attributes for component identification', () => {
    renderWithProvider(<DistanceSlider />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('data-component-id', 'DistanceSlider');
    expect(slider).toHaveAttribute('data-extracted', 'true');
  });

  // Test with custom min/max values
  test('renders with custom min/max range', () => {
    renderWithProvider(<DistanceSlider min={2} max={20} initialValue={5} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '2');
    expect(slider).toHaveAttribute('max', '20');
  });
});
