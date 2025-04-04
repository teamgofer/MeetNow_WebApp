import { ErrorHandlingService } from '../ErrorHandlingService';
import Logger from '../Logger';
import { PerformanceMonitor } from '../PerformanceMonitor';
class NavigationController {
    constructor(options = {}) {
        this.TAG = 'NavigationController';
        this._state = {
            isNavigating: false,
            currentLocation: null,
            targetLocation: null,
            startTime: null,
            progress: 0,
            error: null,
        };
        this._options = {
            defaultDuration: 1000,
            animateTransitions: true,
            ...options,
        };
        this._errorHandler = ErrorHandlingService;
        this._isInitialized = false;
        Logger.info(this.TAG, 'Initialized with options:', this._options);
    }
    async navigateTo(targetLocation, options = {}) {
        const startTime = Date.now();
        Logger.debug(this.TAG, 'Starting navigation to:', targetLocation);
        try {
            if (!this._isValidLocation(targetLocation)) {
                throw new Error('Invalid target location');
            }
            this._updateState({
                isNavigating: true,
                targetLocation,
                startTime: Date.now(),
                progress: 0,
                error: null,
            });
            if (options.onStart && typeof options.onStart === 'function') {
                options.onStart();
            }
            const duration = options.duration ?? this._options.defaultDuration;
            await this._simulateNavigation(duration);
            this._updateState({
                isNavigating: false,
                currentLocation: targetLocation,
                progress: 1,
                error: null,
            });
            if (options.onEnd && typeof options.onEnd === 'function') {
                options.onEnd();
            }
            const duration = Date.now() - startTime;
            PerformanceMonitor.trackOperationTiming('navigation', 'navigateTo', duration, {
                success: true,
                targetLocation,
            });
            return true;
        }
        catch (error) {
            const errorObj = error;
            Logger.error(this.TAG, 'Navigation error:', errorObj);
            this._updateState({
                isNavigating: false,
                error: errorObj,
            });
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
    getState() {
        return { ...this._state };
    }
    stopNavigation() {
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
    dispose() {
        const startTime = Date.now();
        this.stopNavigation();
        this._state = {
            isNavigating: false,
            currentLocation: null,
            targetLocation: null,
            startTime: null,
            progress: 0,
            error: null,
        };
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
    _updateState(updates) {
        this._state = {
            ...this._state,
            ...updates,
        };
        if (this._options.onStateChange && typeof this._options.onStateChange === 'function') {
            this._options.onStateChange(this._state);
        }
    }
    async _simulateNavigation(duration) {
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
    _isValidLocation(location) {
        return (location &&
            typeof location.lat === 'number' &&
            typeof location.lng === 'number' &&
            !isNaN(location.lat) &&
            !isNaN(location.lng));
    }
}
export default NavigationController;
//# sourceMappingURL=NavigationController.js.map