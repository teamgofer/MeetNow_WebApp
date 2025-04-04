import { Logger } from '../../utils/Logger';
import { MapNavigationController } from '../../utils/MapNavigationController';

// Mock the Logger dependency
jest.mock('../../utils/Logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

describe('MapNavigationController', () => {
  let controller;
  let mockMap;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock map with all the methods we need to test
    mockMap = {
      setView: jest.fn(),
      flyTo: jest.fn(),
      panTo: jest.fn(),
      getZoom: jest.fn().mockReturnValue(13),
      setZoom: jest.fn(),
      invalidateSize: jest.fn(),
    };

    // Initialize controller with mock map
    controller = new MapNavigationController(mockMap);
  });

  afterEach(() => {
    controller.dispose();
  });

  test('initializes with the provided map reference', () => {
    expect(controller.map).toBe(mockMap);
    expect(controller.isNavigating).toBe(false);
    expect(controller.queue).toEqual([]);
    expect(Logger.info).toHaveBeenCalledWith('MapNavigationController initialized');
  });

  test('navigateTo calls the appropriate map method based on mode', () => {
    // Test smooth navigation
    controller.navigateTo([51.505, -0.09], { mode: 'smooth' });
    expect(mockMap.flyTo).toHaveBeenCalledWith([51.505, -0.09], 13);

    // Test instant navigation
    controller.navigateTo([40.712, -74.006], { mode: 'instant' });
    expect(mockMap.setView).toHaveBeenCalledWith([40.712, -74.006], 13);

    // Test pan navigation
    controller.navigateTo([35.689, 139.692], { mode: 'pan' });
    expect(mockMap.panTo).toHaveBeenCalledWith([35.689, 139.692]);
  });

  test('navigateTo logs the navigation request', () => {
    controller.navigateTo([51.505, -0.09]);
    expect(Logger.debug).toHaveBeenCalledWith(
      'Navigating to',
      expect.objectContaining({
        location: [51.505, -0.09],
        mode: 'smooth',
      })
    );
  });

  test('handles invalid coordinates gracefully', () => {
    // Test with null coordinates
    controller.navigateTo(null);
    expect(Logger.error).toHaveBeenCalledWith('Invalid coordinates provided to navigateTo', null);
    expect(mockMap.flyTo).not.toHaveBeenCalled();

    // Test with undefined coordinates
    controller.navigateTo(undefined);
    expect(Logger.error).toHaveBeenCalledWith(
      'Invalid coordinates provided to navigateTo',
      undefined
    );

    // Test with invalid array format
    controller.navigateTo([51.505]);
    expect(Logger.error).toHaveBeenCalledWith('Invalid coordinates provided to navigateTo', [
      51.505,
    ]);
  });

  test('queues navigation requests when already navigating', () => {
    // Simulate an ongoing navigation
    controller.isNavigating = true;

    // Queue up some navigation requests
    controller.navigateTo([51.505, -0.09]);
    controller.navigateTo([40.712, -74.006]);

    // Check they're queued and haven't been executed
    expect(controller.queue.length).toBe(2);
    expect(mockMap.flyTo).not.toHaveBeenCalled();
    expect(mockMap.setView).not.toHaveBeenCalled();
    expect(mockMap.panTo).not.toHaveBeenCalled();

    // Now simulate navigation completion
    controller.processQueue();

    // Should process the first queued item
    expect(mockMap.flyTo).toHaveBeenCalledWith([51.505, -0.09], 13);
    expect(controller.queue.length).toBe(1);

    // Process next item
    controller.processQueue();
    expect(mockMap.flyTo).toHaveBeenCalledWith([40.712, -74.006], 13);
    expect(controller.queue.length).toBe(0);
  });

  test('cancel clears the navigation queue', () => {
    // Queue up navigation requests
    controller.isNavigating = true;
    controller.navigateTo([51.505, -0.09]);
    controller.navigateTo([40.712, -74.006]);

    // Cancel navigation
    controller.cancel();

    // Queue should be empty and controller ready for new navigation
    expect(controller.queue.length).toBe(0);
    expect(controller.isNavigating).toBe(false);
    expect(Logger.info).toHaveBeenCalledWith('Navigation cancelled, queue cleared');
  });

  test('dispose method cleans up resources', () => {
    controller.dispose();
    expect(controller.map).toBeNull();
    expect(controller.queue).toEqual([]);
    expect(Logger.info).toHaveBeenCalledWith('MapNavigationController disposed');
  });

  test('handles zoom level changes', () => {
    // Test with custom zoom level
    controller.navigateTo([51.505, -0.09], { zoom: 15 });
    expect(mockMap.flyTo).toHaveBeenCalledWith([51.505, -0.09], 15);

    // Test with default zoom when none specified
    controller.navigateTo([40.712, -74.006]);
    expect(mockMap.flyTo).toHaveBeenCalledWith([40.712, -74.006], 13);
  });

  test('invalidateSize calls the map method', () => {
    controller.invalidateSize();
    expect(mockMap.invalidateSize).toHaveBeenCalled();
    expect(Logger.debug).toHaveBeenCalledWith('Map size invalidated');
  });
});
