/**
 * Unit tests for MapNavigationController
 * Tests navigation operations, error handling, and mode interactions
 */

import MapNavigationController from '../../utils/MapNavigationController';

// Silence logger during tests
jest.mock('../../utils/Logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('MapNavigationController', () => {
  // Mock Leaflet map instance
  const createMockMap = () => ({
    setView: jest.fn().mockImplementation(() => true),
    flyTo: jest.fn().mockImplementation(() => true),
    panTo: jest.fn().mockImplementation(() => true),
    fitBounds: jest.fn().mockImplementation(() => true),
    setZoom: jest.fn().mockImplementation(() => true),
    getZoom: jest.fn().mockReturnValue(15),
    _leaflet_id: 'mock-map-id',
    _overrideCenter: true,
    _birdEyeViewActive: false,
    _vicinityActive: false,
    _directSetMode: jest.fn(),
    fire: jest.fn(),
    distance: jest.fn().mockReturnValue(1000) // Mock distance between points
  });
  
  let mockMap;
  let mockMapRef;
  let navigator;
  
  beforeEach(() => {
    mockMap = createMockMap();
    mockMapRef = { current: mockMap };
    
    // Create controller with initial state
    navigator = new MapNavigationController({
      mapRef: mockMapRef,
      mode: 1,
      zoom: 15
    });
    
    // Clear mock function calls
    jest.clearAllMocks();
  });
  
  test('should initialize with the provided initial state', () => {
    // Test initializing with custom values
    const customNavigator = new MapNavigationController({
      mapRef: mockMapRef,
      mode: 2,
      zoom: 12,
      userLocation: { lat: 34.052, lng: -118.243 },
      selectedLocation: { lat: 37.774, lng: -122.419 }
    });
    
    expect(customNavigator.mapRef).toBe(mockMapRef);
    expect(customNavigator.currentMode).toBe(2);
    expect(customNavigator.currentZoom).toBe(12);
    expect(customNavigator.userLocation).toEqual({ lat: 34.052, lng: -118.243 });
    expect(customNavigator.selectedLocation).toEqual({ lat: 37.774, lng: -122.419 });
    expect(customNavigator.navigationQueue).toEqual([]);
    expect(customNavigator.isProcessing).toBe(false);
    expect(customNavigator.isReady).toBe(mockMapRef.current !== null);
  });
  
  test('getMapInstance should retrieve the map instance correctly', () => {
    // Normal case - direct reference with _leaflet_id
    expect(navigator.getMapInstance()).toBe(mockMap);
    
    // Case where map is in _map property
    const nestedMapRef = { current: { _map: mockMap } };
    const nestedNavigator = new MapNavigationController({ mapRef: nestedMapRef });
    expect(nestedNavigator.getMapInstance()).toBe(mockMap);
    
    // Case with getInstance method
    const instanceMethodMapRef = { current: { getInstance: jest.fn().mockReturnValue(mockMap) } };
    const instanceMethodNavigator = new MapNavigationController({ mapRef: instanceMethodMapRef });
    expect(instanceMethodNavigator.getMapInstance()).toBe(mockMap);
    
    // Case with null reference
    const nullMapRef = { current: null };
    const nullNavigator = new MapNavigationController({ mapRef: nullMapRef });
    expect(nullNavigator.getMapInstance()).toBeNull();
  });
  
  test('resetModeOverrides should clear mode-specific constraints', () => {
    // Set up initial state
    mockMap._overrideCenter = true;
    mockMap._birdEyeViewActive = true;
    mockMap._vicinityActive = true;
    
    // Reset to free navigation (mode 1)
    navigator.resetModeOverrides(1);
    
    expect(mockMap._overrideCenter).toBe(false);
    expect(mockMap._birdEyeViewActive).toBe(false);
    expect(mockMap._vicinityActive).toBe(false);
    expect(mockMap._directSetMode).toHaveBeenCalledWith(1);
    
    // Reset to Bird's Eye View (mode 2)
    mockMap._birdEyeViewActive = false;
    navigator.resetModeOverrides(2);
    
    expect(mockMap._overrideCenter).toBe(false);
    // Bird's Eye mode should not be reset if we're switching to that mode
    expect(mockMap._vicinityActive).toBe(false);
    expect(mockMap._directSetMode).toHaveBeenCalledWith(2);
    
    // Reset to Vicinity (mode 3)
    mockMap._vicinityActive = false;
    navigator.resetModeOverrides(3);
    
    expect(mockMap._overrideCenter).toBe(false);
    expect(mockMap._directSetMode).toHaveBeenCalledWith(3);
  });
  
  test('navigateTo should call setView with correct parameters', async () => {
    const location = { lat: 34.052, lng: -118.243 };
    
    await navigator.navigateTo(location);
    
    // Allow time for the setTimeout in navigateTo
    await new Promise(resolve => setTimeout(resolve, 30));
    
    expect(mockMap.setView).toHaveBeenCalledWith(
      [location.lat, location.lng],
      15,
      expect.objectContaining({ animate: true })
    );
  });
  
  test('navigateTo should respect custom zoom levels', async () => {
    const location = { lat: 34.052, lng: -118.243 };
    const customZoom = 10;
    
    await navigator.navigateTo(location, { zoom: customZoom });
    
    // Allow time for the setTimeout in navigateTo
    await new Promise(resolve => setTimeout(resolve, 30));
    
    expect(mockMap.setView).toHaveBeenCalledWith(
      [location.lat, location.lng],
      customZoom,
      expect.anything()
    );
  });
  
  test('navigateTo should handle different mode strings', async () => {
    const location = { lat: 34.052, lng: -118.243 };
    
    // Test 'smooth' mode
    await navigator.navigateTo(location, { mode: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(mockMap.flyTo).toHaveBeenCalled();
    jest.clearAllMocks();
    
    // Test 'instant' mode
    await navigator.navigateTo(location, { mode: 'instant' });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(mockMap.setView).toHaveBeenCalled();
    jest.clearAllMocks();
    
    // Test 'pan' mode
    await navigator.navigateTo(location, { mode: 'pan' });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(mockMap.panTo).toHaveBeenCalled();
  });
  
  test('navigateTo should handle errors gracefully', async () => {
    // Create a map that throws an error
    const errorMap = {
      ...mockMap,
      setView: jest.fn().mockImplementation(() => {
        throw new Error('Navigation error');
      })
    };
    
    mockMapRef.current = errorMap;
    
    const location = { lat: 34.052, lng: -118.243 };
    
    // Should not throw but return a rejected promise
    await expect(navigator.navigateTo(location)).rejects.toThrow('Navigation error');
    
    // Allow time for the setTimeout in navigateTo
    await new Promise(resolve => setTimeout(resolve, 30));
    
    expect(errorMap.setView).toHaveBeenCalled();
  });
  
  test('navigateTo should reject invalid locations', async () => {
    // Missing lat property
    await expect(navigator.navigateTo({ lng: -118.243 })).rejects.toThrow('Invalid location');
    
    // Wrong type for lat
    await expect(navigator.navigateTo({ lat: 'test', lng: -118.243 })).rejects.toThrow('Invalid location');
    
    // Null location
    await expect(navigator.navigateTo(null)).rejects.toThrow('Invalid location');
  });
  
  test('navigateTo should queue operations and process them in sequence', async () => {
    const location1 = { lat: 34.052, lng: -118.243 };
    const location2 = { lat: 37.774, lng: -122.419 };
    
    // Setup a flag to track processing order
    let processedFirst = false;
    
    // Replace processQueue with a version that tracks order
    const originalProcessQueue = navigator.processQueue;
    navigator.processQueue = jest.fn().mockImplementation(async function() {
      if (this.isProcessing || this.navigationQueue.length === 0) return;
      
      this.isProcessing = true;
      const operation = this.navigationQueue.shift();
      
      try {
        await operation();
        if (this.navigationQueue.length === 1) {
          processedFirst = true;
        }
      } catch (error) {
        console.error('Operation failed', error);
      }
      
      this.isProcessing = false;
      this.processQueue();
    });
    
    // Start two navigation operations
    navigator.navigateTo(location1);
    navigator.navigateTo(location2);
    
    // Allow time for the timeouts in navigateTo
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Both locations should be processed, with location1,first
    expect(mockMap.setView).toHaveBeenCalledTimes(2);
    expect(processedFirst).toBe(true);
    
    // Restore original method
    navigator.processQueue = originalProcessQueue;
  });
  
  test('clearQueue should reset the queue and processing state', async () => {
    // Set up a navigation that will never resolve
    mockMap.setView = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    const location = { lat: 34.052, lng: -118.243 };
    
    // Start navigation
    navigator.navigateTo(location);
    
    // Queue should have one operation
    expect(navigator.navigationQueue.length).toBe(1);
    
    // Clear the queue
    navigator.clearQueue();
    
    // Queue should be empty and not processing
    expect(navigator.navigationQueue).toEqual([]);
    expect(navigator.isProcessing).toBe(false);
  });
  
  // New tests for enhanced functionality
  
  test('setNavigationMode should update mode and notify listeners', () => {
    // Add a mock listener
    const mockListener = jest.fn();
    const unsubscribe = navigator.onModeChange(mockListener);
    
    // First call to onModeChange immediately calls the listener with current mode
    expect(mockListener).toHaveBeenCalledWith(1);
    mockListener.mockClear();
    
    // Set mode to Bird's Eye View
    navigator.setNavigationMode(2);
    
    // The listener should be called again with the new mode
    expect(mockListener).toHaveBeenCalledWith(2);
    expect(navigator.currentMode).toBe(2);
    
    // Test unsubscribing
    unsubscribe();
    navigator.setNavigationMode(3);
    
    // After unsubscribing, the listener should not be called again
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(navigator.currentMode).toBe(3);
  });
  
  test('setUserLocation should store and notify listeners', () => {
    const mockListener = jest.fn();
    const unsubscribe = navigator.onLocationChange(mockListener);
    
    // Set location and verify it updates internal state
    const location = { lat: 34.052, lng: -118.243 };
    navigator.setUserLocation(location);
    
    expect(navigator.userLocation).toBe(location);
    expect(mockListener).toHaveBeenCalledWith(location);
    expect(mockMap._userLocation).toBe(location);
    
    // Test validation
    mockListener.mockClear();
    navigator.setUserLocation(null);
    
    // Should not update with invalid location
    expect(navigator.userLocation).toBe(location); // Still the old one
    expect(mockListener).not.toHaveBeenCalled();
  });
  
  test('setSelectedLocation should store and notify listeners', () => {
    const mockListener = jest.fn();
    const unsubscribe = navigator.onSelectedLocationChange(mockListener);
    
    // Set location and verify it updates internal state
    const location = { lat: 34.052, lng: -118.243 };
    navigator.setSelectedLocation(location);
    
    expect(navigator.selectedLocation).toBe(location);
    expect(mockListener).toHaveBeenCalledWith(location);
    expect(mockMap._selectedLocation).toBe(location);
  });
  
  test('showBirdsEyeView should handle navigation between two points', async () => {
    const locationA = { lat: 34.052, lng: -118.243 };
    const locationB = { lat: 37.774, lng: -122.419 };
    
    // Mock the distance to be far enough to use bounds
    mockMap.distance.mockReturnValue(1000);
    
    await navigator.showBirdsEyeView(locationA, locationB);
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Should update the mode
    expect(navigator.currentMode).toBe(2);
    
    // Should set the Bird's Eye flag
    expect(mockMap._birdEyeViewActive).toBe(true);
    
    // Should fire an event
    expect(mockMap.fire).toHaveBeenCalledWith('birdseyeview', expect.anything());
    
    // Should use flyToBounds for distant points
    expect(mockMap.flyToBounds).toHaveBeenCalled();
    
    // Test for close points
    mockMap.distance.mockReturnValue(50);
    await navigator.showBirdsEyeView(locationA, locationB);
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Should use flyTo for close points
    expect(mockMap.flyTo).toHaveBeenCalled();
  });
  
  test('showVicinityView should focus on user location', async () => {
    const location = { lat: 34.052, lng: -118.243 };
    
    await navigator.showVicinityView(location);
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Should update the mode
    expect(navigator.currentMode).toBe(3);
    
    // Should set the vicinity flag
    expect(mockMap._vicinityActive).toBe(true);
    
    // Should fire an event
    expect(mockMap.fire).toHaveBeenCalledWith('vicinitymode', expect.anything());
    
    // Should set view to the location with high zoom
    expect(mockMap.setView).toHaveBeenCalledWith(
      [location.lat, location.lng],
      expect.any(Number), // Vicinity zoom level
      expect.anything()
    );
  });
  
  test('updateMapReference should update isReady state', () => {
    // Create a controller with no initial map
    const controller = new MapNavigationController();
    
    // Initially not ready
    expect(controller.isReady).toBe(false);
    
    // Add a mock ready listener
    const mockListener = jest.fn();
    controller.onReady(mockListener);
    
    // Update with a valid map reference
    controller.updateMapReference(mockMapRef);
    
    // Should now be ready
    expect(controller.isReady).toBe(true);
    
    // Listener should have been called
    expect(mockListener).toHaveBeenCalled();
  });
  
  test('waitUntilReady should resolve when ready', async () => {
    // Create a controller with no initial map
    const controller = new MapNavigationController();
    
    // Start waiting
    const promise = controller.waitUntilReady();
    
    // Update with a valid map reference to make it ready
    controller.updateMapReference(mockMapRef);
    
    // Promise should resolve
    await expect(promise).resolves.not.toThrow();
  });
  
  test('convenience methods should call navigateTo with correct parameters', async () => {
    // Create a spy on navigateTo
    const navigateToSpy = jest.spyOn(navigator, 'navigateTo');
    
    const location = { lat: 34.052, lng: -118.243 };
    const zoom = 12;
    
    // Test setView convenience method
    await navigator.setView(location, zoom);
    expect(navigateToSpy).toHaveBeenCalledWith(
      location, 
      expect.objectContaining({ mode: 'instant', zoom })
    );
    navigateToSpy.mockClear();
    
    // Test flyTo convenience method
    await navigator.flyTo(location, zoom);
    expect(navigateToSpy).toHaveBeenCalledWith(
      location, 
      expect.objectContaining({ mode: 'smooth', zoom })
    );
    navigateToSpy.mockClear();
    
    // Test panTo convenience method
    await navigator.panTo(location);
    expect(navigateToSpy).toHaveBeenCalledWith(
      location, 
      expect.objectContaining({ mode: 'pan' })
    );
    
    // Test array format for location
    navigateToSpy.mockClear();
    await navigator.setView([location.lat, location.lng], zoom);
    expect(navigateToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ lat: location.lat, lng: location.lng }),
      expect.anything()
    );
  });
}); 