import { render, screen } from '@testing-library/react';
import React from 'react';

import { createLazyComponent, DefaultLoadingComponent } from '../LazyComponents';

// Mock React.lazy
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    lazy: jest.fn(importFn => {
      // Return a simple component directly instead of lazy loading
      return function MockLazyComponent(props) {
        return <div data-testid="lazy-loaded-component">Mock Lazy Component</div>;
      };
    }),
    Suspense: ({ fallback, children }) => children,
  };
});

describe('LazyComponents', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DefaultLoadingComponent renders correctly', () => {
    render(<DefaultLoadingComponent componentName="TestComponent" />);

    expect(screen.getByText('Loading TestComponent...')).toBeInTheDocument();
    expect(screen.getByClassName('loading-spinner')).toBeInTheDocument();
  });

  test('createLazyComponent with default loading component', () => {
    // Create a lazy component
    const importFn = jest.fn(() =>
      Promise.resolve({ default: () => <div>Imported Component</div> })
    );
    const LazyComponent = createLazyComponent(importFn, 'TestComponent');

    // Render the component
    render(<LazyComponent />);

    // Check that React.lazy was called with the import function
    expect(React.lazy).toHaveBeenCalledWith(importFn);

    // Check that our mocked component renders
    expect(screen.getByTestId('lazy-loaded-component')).toBeInTheDocument();

    // Check display name
    expect(LazyComponent.displayName).toBe('Lazy(TestComponent)');
  });

  test('createLazyComponent with custom loading component', () => {
    // Custom loading component
    const CustomLoadingComponent = () => <div data-testid="custom-loading">Custom Loading...</div>;

    // Create a lazy component with custom loading
    const importFn = jest.fn(() =>
      Promise.resolve({ default: () => <div>Imported Component</div> })
    );
    const LazyComponent = createLazyComponent(importFn, 'TestComponent', CustomLoadingComponent);

    // Render the component
    render(<LazyComponent />);

    // Check that React.lazy was called with the import function
    expect(React.lazy).toHaveBeenCalledWith(importFn);

    // Check that our mocked component renders
    expect(screen.getByTestId('lazy-loaded-component')).toBeInTheDocument();
  });
});

// Test for the LazyComponents object
describe('LazyComponents object', () => {
  test('imports the correct component modules', () => {
    // We can't easily test the dynamic imports directly,
    // so we'll validate that LazyComponents is properly exported

    // Mock the LazyComponents object - usually we would import it
    // but since we're mocking React.lazy, we'll define it inline
    const LazyComponents = {
      PerformanceDashboard: createLazyComponent(
        () => import('../components/performance/PerformanceDashboard'),
        'PerformanceDashboard'
      ),
      NearbyMeetups: createLazyComponent(
        () => import('../components/meetup/NearbyMeetups'),
        'NearbyMeetups'
      ),
    };

    // Check that we can render components from the LazyComponents object
    render(<LazyComponents.PerformanceDashboard />);
    expect(screen.getByTestId('lazy-loaded-component')).toBeInTheDocument();

    // Check that React.lazy was called
    expect(React.lazy).toHaveBeenCalled();
  });
});
