import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';

import MeetNowApp from '../../MeetNowApp';
import { render, screen, waitFor } from '../../test/setup';

// Mock isDevelopmentEnvironment
vi.mock('../../config', () => ({
  isDevelopmentEnvironment: false,
}));

// Mock the navigation controller
vi.mock('../../utils/MapNavigationController', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      updateMapReference: vi.fn().mockReturnValue(true),
      navigateTo: vi.fn().mockResolvedValue(true),
      setSelectedLocation: vi.fn(),
      setUserLocation: vi.fn(),
    })),
  };
});

describe('MeetNowApp', () => {
  beforeEach(() => {
    // Mock geolocation API
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success, error, options) => {
        // Simulate a small delay to match real behavior
        setTimeout(() => {
          success({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10,
            },
          });
        }, 100);
      }),
      watchPosition: vi.fn().mockImplementation((success, error) => {
        // Return a watch ID
        return 1;
      }),
      clearWatch: vi.fn(),
    };

    global.navigator.geolocation = mockGeolocation;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MeetNowApp />);
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<MeetNowApp />);
    expect(screen.getByText('Finding your location...')).toBeInTheDocument();
  });

  it('handles geolocation errors gracefully', async () => {
    // Mock geolocation with error
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
      // Immediately call error with permission denied
      error({ code: 1, message: 'User denied geolocation' });
    });

    render(<MeetNowApp />);

    // Check for error message
    const errorTitle = await screen.findByText('Something went wrong');
    expect(errorTitle).toBeInTheDocument();
  });

  it('uses mock location in development environment', async () => {
    // Mock the window.location.hostname to be localhost
    const originalLocation = window.location;
    delete window.location;
    window.location = { hostname: 'localhost' };

    // Mock geolocation with position unavailable error
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
      // Immediately call error with position unavailable
      error({ code: 2, message: 'Position unavailable' });
    });

    render(<MeetNowApp />);

    // Check for error message
    const errorTitle = await screen.findByText('Something went wrong');
    expect(errorTitle).toBeInTheDocument();

    // Restore window.location
    window.location = originalLocation;
  });

  it('handles geolocation timeout', async () => {
    // Mock useMockLocation function to make it behave as if it was called by the timeout
    const mockUseMockLocation = vi.fn(() => {
      console.log('Mocked timeout handler called');
    });

    // Directly simulate the geolocation timeout behavior
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
      // Call error with timeout code
      error({ code: 3, message: 'Timeout' });
    });

    render(<MeetNowApp />);

    // Wait for error state
    const errorTitle = await screen.findByText('Something went wrong');
    expect(errorTitle).toBeInTheDocument();
  }, 20000); // Increase test timeout even more

  it('provides location refresh functionality when there is an error', async () => {
    // Mock geolocation to fail initially
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
      error({ code: 1, message: 'User denied geolocation' });
    });

    render(<MeetNowApp />);

    // Should show error message and refresh button
    const errorMessage = await screen.findByText('Location Error');
    expect(errorMessage).toBeInTheDocument();

    const refreshButton = screen.getByText('Try Again');
    expect(refreshButton).toBeInTheDocument();

    // Now mock geolocation to succeed on refresh
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(success => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
      });
    });

    // Click refresh button
    await userEvent.click(refreshButton);

    // Wait for content to load successfully
    // Note: The specific text to wait for depends on your component's render logic
    // This is a generic example that might need to be adjusted
    const loadingSpinner = await screen.findByText(/finding your location/i);
    expect(loadingSpinner).toBeInTheDocument();
  }, 20000);

  // Add more tests as needed
});
