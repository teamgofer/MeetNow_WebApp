import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NearbyMeetups from '../../components/NearbyMeetups';
import { MapNavigationController } from '../../utils/MapNavigationController';

// Mock the MapNavigationController
jest.mock('../../utils/MapNavigationController');

// Mock the Logger dependency
jest.mock('../../utils/Logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  }
}));

describe('NearbyMeetups Component', () => {
  let mockNavigationController;
  const mockMeetups = [
    { id: 1, title: 'Coffee Meetup', distance: 0.5, location: [51.505, -0.09] },
    { id: 2, title: 'Tech Conference', distance: 1.2, location: [51.51, -0.1] },
    { id: 3, title: 'Book Club', distance: 2.0, location: [51.52, -0.11] }
  ];
  
  beforeEach(() => {
    mockNavigationController = {
      navigateTo: jest.fn(),
      invalidateSize: jest.fn()
    };
    
    // Reset any previous mock implementations
    MapNavigationController.mockImplementation(() => mockNavigationController);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the component with meetup list', () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups}
        userLocation={[51.5, -0.08]}
        onMeetupClick={jest.fn()}
        navigationController={mockNavigationController}
      />
    );
    
    // Check for panel title
    expect(screen.getByText('Nearby Meetups')).toBeInTheDocument();
    
    // Check if all meetups are rendered
    expect(screen.getByText('Coffee Meetup')).toBeInTheDocument();
    expect(screen.getByText('Tech Conference')).toBeInTheDocument();
    expect(screen.getByText('Book Club')).toBeInTheDocument();
    
    // Check if distances are formatted correctly
    expect(screen.getByText('0.5 km')).toBeInTheDocument();
    expect(screen.getByText('1.2 km')).toBeInTheDocument();
    expect(screen.getByText('2.0 km')).toBeInTheDocument();
  });
  
  test('shows "No meetups available" when empty list is provided', () => {
    render(
      <NearbyMeetups 
        meetups={[]}
        userLocation={[51.5, -0.08]}
        onMeetupClick={jest.fn()}
        navigationController={mockNavigationController}
      />
    );
    
    expect(screen.getByText('No meetups available')).toBeInTheDocument();
  });
  
  test('calls onMeetupClick when a meetup is clicked', () => {
    const mockOnMeetupClick = jest.fn();
    
    render(
      <NearbyMeetups 
        meetups={mockMeetups}
        userLocation={[51.5, -0.08]}
        onMeetupClick={mockOnMeetupClick}
        navigationController={mockNavigationController}
      />
    );
    
    // Click on the first meetup
    fireEvent.click(screen.getByText('Coffee Meetup'));
    
    // Check if the click handler was called with the correct meetup
    expect(mockOnMeetupClick).toHaveBeenCalledWith(mockMeetups[0]);
  });
  
  test('navigates to meetup location when clicked', () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups}
        userLocation={[51.5, -0.08]}
        onMeetupClick={jest.fn()}
        navigationController={mockNavigationController}
      />
    );
    
    // Click on the first meetup
    fireEvent.click(screen.getByText('Coffee Meetup'));
    
    // Check if the navigation controller was used to navigate
    expect(mockNavigationController.navigateTo).toHaveBeenCalledWith(
      [51.505, -0.09],
      expect.objectContaining({ mode: 'smooth' })
    );
  });
  
  test('sorts meetups by distance', () => {
    const unsortedMeetups = [
      { id: 1, title: 'Far Meetup', distance: 5.0, location: [51.55, -0.15] },
      { id: 2, title: 'Closest Meetup', distance: 0.2, location: [51.501, -0.081] },
      { id: 3, title: 'Medium Meetup', distance: 2.0, location: [51.52, -0.11] }
    ];
    
    render(
      <NearbyMeetups 
        meetups={unsortedMeetups}
        userLocation={[51.5, -0.08]}
        onMeetupClick={jest.fn()}
        navigationController={mockNavigationController}
      />
    );
    
    // Get all meetup titles
    const meetupTitles = screen.getAllByTestId('meetup-card')
      .map(card => card.textContent);
    
    // The first meetup should be the closest one
    expect(meetupTitles[0]).toContain('Closest Meetup');
    // The last meetup should be the farthest one
    expect(meetupTitles[meetupTitles.length - 1]).toContain('Far Meetup');
  });
  
  test('can toggle panel visibility', () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups}
        userLocation={[51.5, -0.08]}
        onMeetupClick={jest.fn()}
        navigationController={mockNavigationController}
      />
    );
    
    // Panel should be visible by default
    expect(screen.getByText('Coffee Meetup')).toBeVisible();
    
    // Click the toggle button (assuming it has a specific data-testid)
    fireEvent.click(screen.getByTestId('toggle-panel'));
    
    // Panel content should be hidden
    waitFor(() => {
      expect(screen.queryByText('Coffee Meetup')).not.toBeVisible();
    });
    
    // Click again to show
    fireEvent.click(screen.getByTestId('toggle-panel'));
    
    // Panel content should be visible again
    waitFor(() => {
      expect(screen.getByText('Coffee Meetup')).toBeVisible();
    });
  });
}); 