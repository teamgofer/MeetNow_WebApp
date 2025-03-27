import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PinMarkerWrapper } from '../index';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import L from '../../../test/mocks/leaflet';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: L,
  divIcon: vi.fn().mockReturnValue({
    className: 'custom-marker',
    html: '<div class="marker-pin"></div><div class="marker-pulse"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  Marker: ({ children, ...props }) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>
}));

describe('PinMarkerWrapper', () => {
  let mockMarker;
  
  beforeEach(() => {
    mockMarker = L.marker();
    vi.spyOn(L, 'marker').mockReturnValue(mockMarker);
    vi.spyOn(mockMarker, 'setLatLng');
    vi.spyOn(mockMarker, 'addTo');
    vi.spyOn(mockMarker, 'remove');
    vi.spyOn(mockMarker, 'bindPopup');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PinMarkerWrapper position={[0, 0]} />);
    expect(L.marker).toHaveBeenCalled();
  });

  it('renders popup content when provided', () => {
    const popupContent = 'Test Popup';
    render(<PinMarkerWrapper position={[0, 0]} popupContent={popupContent} />);
    expect(mockMarker.bindPopup).toHaveBeenCalledWith(popupContent);
  });

  it('does not render popup when popupContent is not provided', () => {
    render(<PinMarkerWrapper position={[0, 0]} />);
    expect(mockMarker.bindPopup).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const className = 'custom-marker';
    render(<PinMarkerWrapper position={[0, 0]} className={className} />);
    expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
      className: expect.stringContaining(className)
    }));
  });

  it('handles visibility correctly', () => {
    const { rerender } = render(<PinMarkerWrapper position={[0, 0]} visible={false} />);
    expect(mockMarker.remove).toHaveBeenCalled();

    rerender(<PinMarkerWrapper position={[0, 0]} visible={true} />);
    expect(mockMarker.addTo).toHaveBeenCalled();
  });

  it('uses default icon when no custom icon is provided', () => {
    render(<PinMarkerWrapper position={[0, 0]} />);
    expect(L.divIcon).toHaveBeenCalled();
  });

  it('uses custom icon when provided', () => {
    const customIcon = L.divIcon({ className: 'custom-icon' });
    render(<PinMarkerWrapper position={[0, 0]} icon={customIcon} />);
    expect(mockMarker.setIcon).toHaveBeenCalledWith(customIcon);
  });

  it('does not render when position is invalid', () => {
    render(<PinMarkerWrapper position={null} />);
    expect(L.marker).not.toHaveBeenCalled();
  });

  it('handles position updates smoothly', () => {
    const { rerender } = render(<PinMarkerWrapper position={[0, 0]} />);
    rerender(<PinMarkerWrapper position={[1, 1]} />);
    expect(mockMarker.setLatLng).toHaveBeenCalled();
  });

  it('maintains popup state during position updates', () => {
    const popupContent = 'Test Popup';
    const { rerender } = render(
      <PinMarkerWrapper position={[0, 0]} popupContent={popupContent} />
    );
    rerender(<PinMarkerWrapper position={[1, 1]} popupContent={popupContent} />);
    expect(mockMarker.bindPopup).toHaveBeenCalledTimes(1);
  });

  it('handles event handlers', () => {
    const eventHandlers = {
      click: vi.fn(),
      mouseover: vi.fn()
    };
    
    render(<PinMarkerWrapper {...defaultProps} eventHandlers={eventHandlers} />);
    
    const marker = screen.getByTestId('marker');
    fireEvent.click(marker);
    fireEvent.mouseOver(marker);
    
    expect(eventHandlers.click).toHaveBeenCalled();
    expect(eventHandlers.mouseover).toHaveBeenCalled();
  });

  it('uses default icon when no custom icon is provided', () => {
    render(<PinMarkerWrapper {...defaultProps} />);
    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('icon');
  });

  it('uses custom icon when provided', () => {
    const customIcon = { className: 'custom-icon' };
    render(<PinMarkerWrapper {...defaultProps} icon={customIcon} />);
    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('icon', JSON.stringify(customIcon));
  });

  it('does not render when position is invalid', () => {
    render(<PinMarkerWrapper {...defaultProps} position={null} />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('handles position updates smoothly', () => {
    const { rerender } = render(<PinMarkerWrapper {...defaultProps} />);
    const newPosition = [1, 1];
    
    rerender(<PinMarkerWrapper {...defaultProps} position={newPosition} />);
    expect(screen.getByTestId('marker')).toHaveAttribute('position', JSON.stringify(newPosition));
  });

  it('handles rapid position updates', () => {
    const { rerender } = render(<PinMarkerWrapper {...defaultProps} />);
    
    // Simulate rapid position updates
    for (let i = 0; i < 10; i++) {
      rerender(<PinMarkerWrapper {...defaultProps} position={[i, i]} />);
    }
    
    expect(screen.getByTestId('marker')).toHaveAttribute('position', JSON.stringify([9, 9]));
  });

  it('maintains popup state during position updates', () => {
    const { rerender } = render(<PinMarkerWrapper {...defaultProps} />);
    expect(screen.getByTestId('popup-content')).toBeInTheDocument();
    
    rerender(<PinMarkerWrapper {...defaultProps} position={[1, 1]} />);
    expect(screen.getByTestId('popup-content')).toBeInTheDocument();
  });

  it('handles custom icon updates', () => {
    const { rerender } = render(<PinMarkerWrapper {...defaultProps} />);
    const newIcon = { className: 'new-icon' };
    
    rerender(<PinMarkerWrapper {...defaultProps} icon={newIcon} />);
    expect(screen.getByTestId('marker')).toHaveAttribute('icon', JSON.stringify(newIcon));
  });

  it('handles marker animation states', () => {
    const { rerender } = render(<PinMarkerWrapper {...defaultProps} />);
    const marker = screen.getByTestId('marker');
    
    // Simulate hover state
    fireEvent.mouseEnter(marker);
    expect(marker).toHaveClass('marker-hover');
    
    // Simulate leave state
    fireEvent.mouseLeave(marker);
    expect(marker).not.toHaveClass('marker-hover');
  });

  it('handles marker drag events', () => {
    const onDragEnd = vi.fn();
    render(<PinMarkerWrapper {...defaultProps} eventHandlers={{ dragend: onDragEnd }} />);
    
    const marker = screen.getByTestId('marker');
    fireEvent.dragEnd(marker);
    
    expect(onDragEnd).toHaveBeenCalled();
  });

  it('handles marker click events with popup', () => {
    render(<PinMarkerWrapper {...defaultProps} />);
    
    const marker = screen.getByTestId('marker');
    fireEvent.click(marker);
    
    expect(screen.getByTestId('popup')).toBeInTheDocument();
  });

  it('handles multiple markers in the same area', () => {
    const markers = [
      { id: 'marker-1', position: [0, 0] },
      { id: 'marker-2', position: [0.0001, 0.0001] }
    ];
    
    const { container } = render(
      <div>
        {markers.map(marker => (
          <PinMarkerWrapper
            key={marker.id}
            {...defaultProps}
            id={marker.id}
            position={marker.position}
          />
        ))}
      </div>
    );
    
    expect(container.querySelectorAll('[data-testid="marker"]')).toHaveLength(2);
  });

  it('handles marker clustering', () => {
    const markers = Array(10).fill(null).map((_, i) => ({
      id: `marker-${i}`,
      position: [0 + (i * 0.0001), 0 + (i * 0.0001)]
    }));
    
    const { container } = render(
      <div>
        {markers.map(marker => (
          <PinMarkerWrapper
            key={marker.id}
            {...defaultProps}
            id={marker.id}
            position={marker.position}
          />
        ))}
      </div>
    );
    
    expect(container.querySelectorAll('[data-testid="marker"]')).toHaveLength(10);
  });
}); 
 
 
 
 
 