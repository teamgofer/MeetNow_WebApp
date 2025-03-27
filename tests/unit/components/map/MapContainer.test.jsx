import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MapContainer from '../MapContainer';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 0, longitude: 0 },
    isLoading: false,
    error: null
  })
}));

jest.mock('../../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true
}));

// Mock the wrapper components
jest.mock('../../wrappers', () => ({
  MapWrapper: ({ children, onMapClick, onMapMove, onMapReady }) => (
    <div 
      data-testid="map-wrapper"
      onClick={() => onMapClick?.({ latlng: { lat: 1, lng: 1 } })}
      onMouseMove={() => onMapMove?.({ latlng: { lat: 2, lng: 2 } })}
    >
      {children}
      {onMapReady && onMapReady()}
    </div>
  ),
  FloatingWindowWrapper: ({ children, isVisible }) => (
    isVisible ? <div data-testid="floating-window">{children}</div> : null
  ),
  PinMarkerWrapper: ({ id, position }) => (
    <div data-testid={`pin-marker-${id}`} data-position={JSON.stringify(position)} />
  )
}));

describe('MapContainer', () => {
  const defaultProps = {
    onLocationSelect: jest.fn(),
    onMapReady: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MapContainer {...defaultProps} />);
    expect(screen.getByTestId('map-wrapper')).toBeInTheDocument();
  });

  it('renders user location marker', () => {
    render(<MapContainer {...defaultProps} />);
    expect(screen.getByTestId('pin-marker-user-location')).toBeInTheDocument();
  });

  it('handles map click correctly', () => {
    render(<MapContainer {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('map-wrapper'));
    
    expect(defaultProps.onLocationSelect).toHaveBeenCalledWith({
      latitude: 1,
      longitude: 1,
      address: 'Selected location'
    });
  });

  it('handles map move correctly', () => {
    render(<MapContainer {...defaultProps} />);
    
    fireEvent.mouseMove(screen.getByTestId('map-wrapper'));
    
    expect(screen.getByTestId('pin-marker-user-location')).toBeInTheDocument();
  });

  it('calls onMapReady when map is initialized', () => {
    render(<MapContainer {...defaultProps} />);
    expect(defaultProps.onMapReady).toHaveBeenCalled();
  });

  it('shows location info window when location is selected', () => {
    render(<MapContainer {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('map-wrapper'));
    
    expect(screen.getByTestId('floating-window')).toBeInTheDocument();
    expect(screen.getByText('Selected Location')).toBeInTheDocument();
  });

  it('handles offline state correctly', () => {
    jest.spyOn(require('../../../hooks/useOnlineStatus'), 'useOnlineStatus')
      .mockReturnValue(false);
    
    render(<MapContainer {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('map-wrapper'));
    
    expect(screen.getByText(/You are currently offline/)).toBeInTheDocument();
  });

  it('handles geolocation error correctly', () => {
    jest.spyOn(require('../../../hooks/useGeolocation'), 'useGeolocation')
      .mockReturnValue({
        location: null,
        isLoading: false,
        error: 'Geolocation error'
      });
    
    render(<MapContainer {...defaultProps} />);
    
    expect(screen.getByText('Geolocation error')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testChild = <div data-testid="test-child">Test Child</div>;
    render(<MapContainer {...defaultProps}>{testChild}</MapContainer>);
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-map-container';
    render(<MapContainer {...defaultProps} className={customClass} />);
    
    expect(screen.getByTestId('map-wrapper').parentElement).toHaveClass(customClass);
  });
}); 
 
 
 
 
 