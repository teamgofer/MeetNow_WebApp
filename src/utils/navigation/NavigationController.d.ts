import type { Location } from '../MapNavigationController';
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
declare class NavigationController {
    private readonly TAG;
    private _state;
    private _options;
    private _errorHandler;
    private _isInitialized;
    constructor(options?: NavigationControllerOptions);
    navigateTo(targetLocation: Location, options?: NavigationOptions): Promise<boolean>;
    getState(): NavigationState;
    stopNavigation(): boolean;
    dispose(): void;
    private _updateState;
    private _simulateNavigation;
    private _isValidLocation;
}
export default NavigationController;
