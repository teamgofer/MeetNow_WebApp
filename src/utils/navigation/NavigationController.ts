import { ErrorHandlingService } from '../ErrorHandlingService';
import Logger from '../Logger';
import type { Location } from '../MapNavigationController';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Types
export interface INavigationOptions {
  animate?: boolean;
  duration?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  [key: string]: any;
}

export interface INavigationState {
  isNavigating: boolean;
  currentLocation: Location | null;
  targetLocation: Location | null;
  startTime: number | null;
  progress: number;
  error: Error | null;
}

export interface INavigationControllerOptions {
  onStateChange?: (state: NavigationState) => void;
  onError?: (error: Error) => void;
  defaultDuration?: number;
  animateTransitions?: boolean;
}

/**
 * Navigation Controller
 * Handles navigation between locations with state management and error handling
 */
class NavigationController {
  private readonly TAG: string = 'NavigationController';
  private _state: NavigationState;
  private _options: NavigationControllerOptions;
  private _errorHandler: typeof ErrorHandlingService;
  private _isInitialized: boolean;

  /**
   * Create a new navigation controller
   * @param {NavigationControllerOptions} [options] - Configuration options
   */
  constructor(options: NavigationControllerOptions = {}) {
    // Initialize state
    this._state = {
      isNavigating: false,
      currentLocation: null,
      targetLocation: null,
      startTime: null,
      progress: 0,
      error: null,
    };

    // Store options
    this._options = {
      defaultDuration: 1000, // 1 second
      animateTransitions: true,
      ...options,
    };

    // Initialize error handling
    this._errorHandler = ErrorHandlingService;
    this._isInitialized = false;

    // Log initialization
    Logger.info(this.TAG, 'Initialized with options:', this._options);
  }

  /**
   * Start navigation to a target location
   * @param {Location} targetLocation - The target location to navigate to
   * @param {NavigationOptions} [options] - Navigation options
   * @returns {Promise<boolean>} Whether navigation was successful
   */
  public async navigateTo(
    targetLocation: Location,
    options: NavigationOptions = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    Logger.debug(this.TAG, 'Starting navigation to:', targetLocation);

    try {
      // Validate target location
      if (!this._isValidLocation(targetLocation)) {
        throw new Error('Invalid target location');
      }

      // Update state
      this._updateState({
        isNavigating: true,
        targetLocation,
        startTime: Date.now(),
        progress: 0,
        error: null,
      });

      // Call start callback if provided
      if (options.onStart && typeof options.onStart === 'function') {
        options.onStart();
      }

      // Simulate navigation progress
      const duration = options.duration ?? this._options.defaultDuration;
      await this._simulateNavigation(duration);

      // Update state for completion
      this._updateState({
        isNavigating: false,
        currentLocation: targetLocation,
        progress: 1,
        error: null,
      });

      // Call end callback if provided
      if (options.onEnd && typeof options.onEnd === 'function') {
        options.onEnd();
      }

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('navigation', 'navigateTo', duration, {
        success: true,
        targetLocation,
      });

      return true;
    } catch (error) {
      // Handle error
      const errorObj = error as Error;
      Logger.error(this.TAG, 'Navigation error:', errorObj);

      // Update state with error
      this._updateState({
        isNavigating: false,
        error: errorObj,
      });

      // Call error callback if provided
      if (options.onError && typeof options.onError === 'function') {
        options.onError(errorObj);
      }

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('navigation', 'navigateTo', duration, {
        success: false,
        error: errorObj.message,
      });

      return false;
    }
  }

  /**
   * Get the current navigation state
   * @returns {NavigationState} The current navigation state
   */
  public getState(): NavigationState {
    return { ...this._state };
  }

  /**
   * Stop current navigation
   * @returns {boolean} Whether navigation was stopped
   */
  public stopNavigation(): boolean {
    if (!this._state.isNavigating) {
      return false;
    }

    Logger.debug(this.TAG, 'Stopping navigation');
    this._updateState({
      isNavigating: false,
      progress: 0,
      error: new Error('Navigation stopped by user'),
    });

    return true;
  }

  /**
   * Dispose of the controller
   */
  public dispose(): void {
    const startTime = Date.now();

    // Stop any ongoing navigation
    this.stopNavigation();

    // Clear state
    this._state = {
      isNavigating: false,
      currentLocation: null,
      targetLocation: null,
      startTime: null,
      progress: 0,
      error: null,
    };

    // Clear options
    this._options = {
      defaultDuration: 1000,
      animateTransitions: true,
    };

    this._isInitialized = false;

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('navigation', 'dispose', duration, {
      success: true,
    });

    Logger.info(this.TAG, 'Controller disposed');
  }

  /**
   * Update the navigation state
   * @private
   * @param {Partial<NavigationState>} updates - State updates
   */
  private _updateState(updates: Partial<NavigationState>): void {
    this._state = {
      ...this._state,
      ...updates,
    };

    // Notify state change if callback provided
    if (this._options.onStateChange && typeof this._options.onStateChange === 'function') {
      this._options.onStateChange(this._state);
    }
  }

  /**
   * Simulate navigation progress
   * @private
   * @param {number} duration - Navigation duration in milliseconds
   * @returns {Promise<void>}
   */
  private async _simulateNavigation(duration: number): Promise<void> {
    const startTime = Date.now();
    const steps = 10;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      this._updateState({ progress });

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }

  /**
   * Validates that a location object has the correct format
   * @private
   * @param {Location} location - Location to validate
   * @returns {boolean} - Whether the location is valid
   */
  private _isValidLocation(location: Location): boolean {
    return (
      location &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      !isNaN(location.lat) &&
      !isNaN(location.lng)
    );
  }
}

export default NavigationController;
