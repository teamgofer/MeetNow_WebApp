import { renderHook, act } from '@testing-library/react';
import useMapMarkers from './useMapMarkers';

// Mock the Logger
jest.mock('../utils/Logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('useMapMarkers', () => {
  const mockMarker = {
    id: 'marker1',
    position: { lat: 40.7128, lng: -74.006 }, // New York
    options: { title: 'Test Marker' },
  };

  it('should initialize with empty markers map', () => {
    const { result } = renderHook(() => useMapMarkers());
    expect(result.current.markers.size).toBe(0);
    expect(result.current.getAll()).toEqual([]);
  });

  it('should add a marker', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      result.current.add(mockMarker);
    });

    expect(result.current.markers.size).toBe(1);
    expect(result.current.getById('marker1')).toEqual(mockMarker);
  });

  it('should remove a marker', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      result.current.add(mockMarker);
    });

    act(() => {
      result.current.remove('marker1');
    });

    expect(result.current.markers.size).toBe(0);
    expect(result.current.getById('marker1')).toBeUndefined();
  });

  it('should update a marker', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      result.current.add(mockMarker);
    });

    act(() => {
      result.current.update('marker1', {
        options: { title: 'Updated Title' },
      });
    });

    const updatedMarker = result.current.getById('marker1');
    expect(updatedMarker?.options?.title).toBe('Updated Title');
  });

  it('should update marker position', () => {
    const { result } = renderHook(() => useMapMarkers());
    const newPosition = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

    act(() => {
      result.current.add(mockMarker);
    });

    act(() => {
      result.current.updatePosition('marker1', newPosition);
    });

    const updatedMarker = result.current.getById('marker1');
    expect(updatedMarker?.position).toEqual(newPosition);
  });

  it('should update marker options', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      result.current.add(mockMarker);
    });

    act(() => {
      result.current.updateOptions('marker1', {
        icon: 'custom-icon.png',
        zIndex: 10,
        draggable: true,
      });
    });

    const updatedMarker = result.current.getById('marker1');
    expect(updatedMarker?.options).toEqual({
      title: 'Test Marker',
      icon: 'custom-icon.png',
      zIndex: 10,
      draggable: true,
    });
  });

  it('should clear all markers', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      result.current.add(mockMarker);
      result.current.add({
        id: 'marker2',
        position: { lat: 51.5074, lng: -0.1278 }, // London
      });
    });

    expect(result.current.markers.size).toBe(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.markers.size).toBe(0);
    expect(result.current.getAll()).toEqual([]);
  });

  it('should filter visible markers', () => {
    const { result } = renderHook(() => useMapMarkers());

    act(() => {
      // Add visible marker
      result.current.add(mockMarker);

      // Add hidden marker
      result.current.add({
        id: 'marker2',
        position: { lat: 51.5074, lng: -0.1278 },
        options: { visible: false },
      });
    });

    const visibleMarkers = result.current.getVisible();
    expect(result.current.getAll().length).toBe(2);
    expect(visibleMarkers.length).toBe(1);

    // Check that we have at least one marker before accessing its id
    if (visibleMarkers.length > 0) {
      // Use type assertion to tell TypeScript that we're sure visibleMarkers[0] exists
      expect(visibleMarkers[0]!.id).toBe('marker1');
    }
  });
});
