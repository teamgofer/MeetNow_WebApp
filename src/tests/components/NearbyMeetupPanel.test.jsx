/**
 * Tests for the NearbyMeetups component
 * Verifies meetup display, sorting, collapsing, and click handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NearbyMeetups from '../../components/ui/nearby-meetups';

// Mock formatTimeRemaining function used in the component
jest.mock('../../utils/timezone', () => ({
  formatMeetupTime: jest.fn(time => 'formatted time'),
  calculateExpiryTime: jest.fn(() => 'calculated expiry'),
  formatTimeRemaining: jest.fn(() => ({ text: '30m left', percentLeft: 50 }))
}));

describe('NearbyMeetups Panel', () => {
  const mockMeetups = [
    {
      id: '1',
      title: 'Coffee Meetup',
      description: 'Let\'s grab coffee',
      status: 'active',
      location: { lat: 34.052, lng: -118.243 },
      address: '123 Main St',
      distance_meters: 500,
      created_at: '2023-04-15T10:00:00Z',
      starts_at: '2023-04-15T10:00:00Z',
      expires_at: null,
      duration_minutes: 60
    },
    {
      id: '2',
      title: 'Tech Discussion',
      description: 'Discussing the latest in tech',
      status: 'active',
      location: { lat: 34.055, lng: -118.245 },
      address: '456 Tech Ave',
      distance_meters: 1200,
      created_at: '2023-04-15T09:30:00Z',
      starts_at: '2023-04-15T14:00:00Z',
      expires_at: null,
      duration_minutes: 120
    },
    {
      id: '3',
      title: 'Expired Meetup',
      description: 'This meetup has ended',
      status: 'expired',
      location: { lat: 34.056, lng: -118.246 },
      address: '789 End St',
      distance_meters: 800,
      created_at: '2023-04-14T10:00:00Z',
      starts_at: '2023-04-14T10:00:00Z',
      expires_at: '2023-04-14T11:00:00Z'
    }
  ];
  
  const mockOnMeetupClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders meetup cards for active meetups', async () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups} 
        currentLocation={{ lat: 34.05, lng: -118.24 }}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Should show the active meetups
    expect(screen.getByText('Coffee Meetup')).toBeInTheDocument();
    expect(screen.getByText('Tech Discussion')).toBeInTheDocument();
    
    // Should not show expired meetups
    expect(screen.queryByText('Expired Meetup')).not.toBeInTheDocument();
    
    // Should show the correct count
    expect(screen.getByText('2 meetups')).toBeInTheDocument();
  });
  
  test('sorts meetups by distance', async () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups} 
        currentLocation={{ lat: 34.05, lng: -118.24 }}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Get all the meetup cards
    const meetupCards = screen.getAllByRole('article');
    
    // First card should be Coffee Meetup (closest)
    expect(meetupCards[0]).toHaveTextContent('Coffee Meetup');
    
    // Second card should be Tech Discussion (further away)
    expect(meetupCards[1]).toHaveTextContent('Tech Discussion');
  });
  
  test('clicking meetup card triggers onMeetupClick with location data', async () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups} 
        currentLocation={{ lat: 34.05, lng: -118.24 }}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Get the first meetup card
    const meetupCard = screen.getByText('Coffee Meetup').closest('article');
    
    // Click on the card
    fireEvent.click(meetupCard);
    
    // Check that onMeetupClick was called with the correct location data
    expect(mockOnMeetupClick).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 34.052,
        lng: -118.243,
        display_name: 'Coffee Meetup',
        address: '123 Main St',
        isMeetupLocation: true,
        meetupId: '1'
      })
    );
  });
  
  test('show/hide button toggles visibility of meetup list', async () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups} 
        currentLocation={{ lat: 34.05, lng: -118.24 }}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Meetup list should be visible initially
    expect(screen.getByText('Coffee Meetup')).toBeVisible();
    
    // Click the hide button
    fireEvent.click(screen.getByText('Hide'));
    
    // Meetup list should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Coffee Meetup')).not.toBeVisible();
    });
    
    // Click the show button
    fireEvent.click(screen.getByText('Show'));
    
    // Meetup list should be visible again
    await waitFor(() => {
      expect(screen.getByText('Coffee Meetup')).toBeVisible();
    });
  });
  
  test('handles empty meetups array', async () => {
    render(
      <NearbyMeetups 
        meetups={[]} 
        currentLocation={{ lat: 34.05, lng: -118.24 }}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Should show no meetups message
    expect(screen.getByText('No active meetups nearby')).toBeInTheDocument();
    
    // Should show 0 meetups count
    expect(screen.getByText('0 meetups')).toBeInTheDocument();
  });
  
  test('handles null current location', async () => {
    render(
      <NearbyMeetups 
        meetups={mockMeetups} 
        currentLocation={null}
        mapZoom={15}
        onMeetupClick={mockOnMeetupClick}
      />
    );
    
    // Component should render without errors
    expect(screen.getByText('Coffee Meetup')).toBeInTheDocument();
  });
}); 