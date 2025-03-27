import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationSearch from '../LocationSearch';

// Mock fetch
global.fetch = jest.fn();

describe('LocationSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<LocationSearch onLocationSelect={() => {}} />);
    
    expect(screen.getByTestId('location-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('location-search-input')).toHaveAttribute('placeholder', 'Search for a location');
  });

  test('renders with custom placeholder', () => {
    render(
      <LocationSearch 
        onLocationSelect={() => {}} 
        placeholder="Enter an address" 
      />
    );
    
    expect(screen.getByTestId('location-search-input')).toHaveAttribute('placeholder', 'Enter an address');
  });

  test('shows initial query when provided', () => {
    render(
      <LocationSearch 
        onLocationSelect={() => {}} 
        initialQuery="New York" 
      />
    );
    
    expect(screen.getByTestId('location-search-input')).toHaveValue('New York');
  });

  test('handles input change', () => {
    render(<LocationSearch onLocationSelect={() => {}} />);
    
    const input = screen.getByTestId('location-search-input');
    fireEvent.change(input, { target: { value: 'San Francisco' } });
    
    expect(input).toHaveValue('San Francisco');
  });

  test('triggers search when query is at least 3 characters', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        results: [
          { 
            place_id: '1', 
            display_name: 'San Francisco, CA, USA',
            name: 'San Francisco',
            address: {
              city: 'San Francisco',
              state: 'California',
              country: 'USA'
            }
          }
        ] 
      })
    });

    render(<LocationSearch onLocationSelect={() => {}} />);
    
    const input = screen.getByTestId('location-search-input');
    fireEvent.change(input, { target: { value: 'San' } });
    
    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/geocode?query=San'), expect.anything());
    });
  });

  test('displays search results', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        results: [
          { 
            place_id: '1', 
            display_name: 'San Francisco, CA, USA',
            name: 'San Francisco',
            address: {
              city: 'San Francisco',
              state: 'California',
              country: 'USA'
            }
          }
        ] 
      })
    });

    render(<LocationSearch onLocationSelect={() => {}} />);
    
    const input = screen.getByTestId('location-search-input');
    fireEvent.change(input, { target: { value: 'San Francisco' } });
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByTestId('location-search-results')).toBeInTheDocument();
      expect(screen.getByTestId('location-result-0')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });
  });

  test('selects a location when clicked', async () => {
    const mockLocation = { 
      place_id: '1', 
      display_name: 'San Francisco, CA, USA',
      name: 'San Francisco',
      address: {
        city: 'San Francisco',
        state: 'California',
        country: 'USA'
      }
    };
    
    const onLocationSelect = jest.fn();
    
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [mockLocation] })
    });

    render(<LocationSearch onLocationSelect={onLocationSelect} />);
    
    const input = screen.getByTestId('location-search-input');
    fireEvent.change(input, { target: { value: 'San Francisco' } });
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByTestId('location-result-0')).toBeInTheDocument();
    });
    
    // Click on the result
    fireEvent.click(screen.getByTestId('location-result-0'));
    
    // Check if the callback was called with the result
    expect(onLocationSelect).toHaveBeenCalledWith(mockLocation);
    
    // Check if the input value was updated
    expect(input).toHaveValue('San Francisco, CA, USA');
    
    // Check if results are hidden
    await waitFor(() => {
      expect(screen.queryByTestId('location-search-results')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      text: async () => 'Server error'
    });

    render(<LocationSearch onLocationSelect={() => {}} />);
    
    const input = screen.getByTestId('location-search-input');
    fireEvent.change(input, { target: { value: 'Error Test' } });
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error searching for locations/i)).toBeInTheDocument();
    });
  });

  test('clears input when clear button is clicked', async () => {
    const onLocationSelect = jest.fn();
    render(<LocationSearch onLocationSelect={onLocationSelect} initialQuery="Test Query" />);
    
    const input = screen.getByTestId('location-search-input');
    expect(input).toHaveValue('Test Query');
    
    // Click clear button
    fireEvent.click(screen.getByLabelText('Clear search'));
    
    // Check if input was cleared
    expect(input).toHaveValue('');
    
    // Check if onLocationSelect was called with null
    expect(onLocationSelect).toHaveBeenCalledWith(null);
  });
}); 