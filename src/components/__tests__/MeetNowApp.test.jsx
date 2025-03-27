import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MeetNowApp from '../MeetNowApp';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 0, longitude: 0 },
    isLoading: false,
    error: null
  })
}));

jest.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true
}));

jest.mock('../../hooks/useMeetups', () => ({
  useMeetups: () => ({
    meetups: [
      {
        id: 1,
        title: 'Test Meetup',
        description: 'Test Description',
        latitude: 0,
        longitude: 0,
        time: new Date().toISOString()
      }
    ],
    isLoading: false,
    error: null
  })
}));

jest.mock('../../hooks/useLogger', () => ({
  useLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}));

// Mock the MapContainer component
jest.mock('../map/MapContainer', () => ({
  __esModule: true,
  default: ({ children, onLocationSelect, onMapReady }) => (
    <div 
      data-testid="map-container"
      onClick={() => onLocationSelect({ latitude: 1, longitude: 1, address: 'Test Location' })}
    >
      {children}
      {onMapReady && onMapReady()}
    </div>
  )
}));

// Mock the wrapper components
jest.mock('../wrappers', () => ({
  FloatingWindowWrapper: ({ children, isVisible }) => (
    isVisible ? <div data-testid="floating-window">{children}</div> : null
  ),
  PinMarkerWrapper: ({ id, popupContent }) => (
    <div data-testid={`pin-marker-${id}`}>{popupContent}</div>
  )
}));

describe('MeetNowApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MeetNowApp />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders meetup markers', () => {
    render(<MeetNowApp />);
    expect(screen.getByTestId('pin-marker-meetup-1')).toBeInTheDocument();
    expect(screen.getByText('Test Meetup')).toBeInTheDocument();
  });

  it('handles location selection', () => {
    render(<MeetNowApp />);
    
    fireEvent.click(screen.getByTestId('map-container'));
    
    expect(screen.getByTestId('floating-window')).toBeInTheDocument();
    expect(screen.getByText('Selected Location')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('handles geolocation error', () => {
    jest.spyOn(require('../../hooks/useGeolocation'), 'useGeolocation')
      .mockReturnValue({
        location: null,
        isLoading: false,
        error: 'Geolocation error'
      });
    
    render(<MeetNowApp />);
    
    expect(screen.getByText('Geolocation error')).toBeInTheDocument();
  });

  it('handles meetups error', () => {
    jest.spyOn(require('../../hooks/useMeetups'), 'useMeetups')
      .mockReturnValue({
        meetups: null,
        isLoading: false,
        error: 'Meetups error'
      });
    
    render(<MeetNowApp />);
    
    expect(screen.getByText('Meetups error')).toBeInTheDocument();
  });

  it('shows loading spinner when geolocation is loading', () => {
    jest.spyOn(require('../../hooks/useGeolocation'), 'useGeolocation')
      .mockReturnValue({
        location: null,
        isLoading: true,
        error: null
      });
    
    render(<MeetNowApp />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('logs location selection', () => {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    
    jest.spyOn(require('../../hooks/useLogger'), 'useLogger')
      .mockReturnValue(mockLogger);
    
    render(<MeetNowApp />);
    
    fireEvent.click(screen.getByTestId('map-container'));
    
    expect(mockLogger.info).toHaveBeenCalledWith('Location selected', {
      location: { latitude: 1, longitude: 1, address: 'Test Location' }
    });
  });

  it('logs map ready state', () => {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    
    jest.spyOn(require('../../hooks/useLogger'), 'useLogger')
      .mockReturnValue(mockLogger);
    
    render(<MeetNowApp />);
    
    expect(mockLogger.info).toHaveBeenCalledWith('Map ready');
  });
}); 
 
 
 
 
 