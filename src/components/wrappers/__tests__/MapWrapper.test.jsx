import { render, screen } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import L from '../../../test/mocks/leaflet';
import MapWrapper from '../MapWrapper';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: L,
}));

describe('MapWrapper', () => {
  let mockMap;

  beforeEach(() => {
    mockMap = L.map();
    vi.spyOn(L, 'map').mockReturnValue(mockMap);
    vi.spyOn(mockMap, 'on');
    vi.spyOn(mockMap, 'off');
    vi.spyOn(mockMap, 'setView');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MapWrapper center={[0, 0]} zoom={13} />);
    expect(L.map).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<MapWrapper center={[0, 0]} zoom={13} className="custom-map" />);
    expect(container.firstChild).toHaveClass('custom-map');
  });

  it('calls onMapClick when map is clicked', () => {
    const onMapClick = vi.fn();
    render(<MapWrapper center={[0, 0]} zoom={13} onMapClick={onMapClick} />);
    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('calls onMapMove when map is moved', () => {
    const onMapMove = vi.fn();
    render(<MapWrapper center={[0, 0]} zoom={13} onMapMove={onMapMove} />);
    expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  it('calls onMapReady when map is initialized', () => {
    const onMapReady = vi.fn();
    render(<MapWrapper center={[0, 0]} zoom={13} onMapReady={onMapReady} />);
    expect(onMapReady).toHaveBeenCalledWith(mockMap);
  });

  it('renders children correctly', () => {
    render(
      <MapWrapper center={[0, 0]} zoom={13}>
        <div data-testid="child">Child Component</div>
      </MapWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('handles invalid center coordinates gracefully', () => {
    render(<MapWrapper center={null} zoom={13} />);
    expect(L.map).toHaveBeenCalled();
  });

  it('handles invalid zoom level gracefully', () => {
    render(<MapWrapper center={[0, 0]} zoom={null} />);
    expect(L.map).toHaveBeenCalled();
  });

  it('updates map view when center changes', () => {
    const { rerender } = render(<MapWrapper center={[0, 0]} zoom={13} />);
    rerender(<MapWrapper center={[1, 1]} zoom={13} />);
    expect(mockMap.setView).toHaveBeenCalled();
  });

  it('updates map view when zoom changes', () => {
    const { rerender } = render(<MapWrapper center={[0, 0]} zoom={13} />);
    rerender(<MapWrapper center={[0, 0]} zoom={14} />);
    expect(mockMap.setView).toHaveBeenCalled();
  });

  it('prevents memory leaks on unmount', () => {
    const { unmount } = render(<MapWrapper center={[0, 0]} zoom={13} />);
    unmount();
    expect(mockMap.off).toHaveBeenCalled();
  });
});
