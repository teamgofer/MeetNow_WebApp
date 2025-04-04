import type { Map, LeafletMouseEvent } from 'leaflet';
export interface ILocation {
    lat: number;
    lng: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
    display_name?: string;
    name?: string;
    type?: string;
    importance?: number;
    tags?: {
        name?: string;
        [key: string]: string | undefined;
    };
    address?: {
        attraction?: string;
        building?: string;
        amenity?: string;
        leisure?: string;
        tourism?: string;
        shop?: string;
        historic?: string;
        natural?: string;
        office?: string;
        healthcare?: string;
        place_of_worship?: string;
        [key: string]: string | undefined;
    };
    _source?: string;
}
export interface INavigationOptions {
    zoom?: number;
    animate?: boolean;
    method?: 'flyTo' | 'setView';
    duration?: number;
    forceCenter?: boolean;
    [key: string]: any;
}
export interface IMapNavigationOptions {
    defaultZoom?: number;
    animateTransitions?: boolean;
    defaultLocation?: ILocation;
    enableDebug?: boolean;
    onReady?: (success: boolean) => void;
    onLocationChange?: (location: ILocation) => void;
    onError?: (error: Error) => void;
    onMapClick?: (event: LeafletMouseEvent) => void;
    onLocationSelect?: (location: ILocation) => void;
    onReverseGeocodingStart?: () => void;
    onReverseGeocodingEnd?: () => void;
    onSearchAddressUpdate?: (address: string) => void;
}
declare class MapNavigationController {
    private readonly TAG;
    private _mapRef;
    private _mapInstance;
    private _isReady;
    private _userLocation;
    private _selectedLocation;
    private _isReverseGeocoding;
    private _isMobile;
    private _touchStartTime;
    private _touchStartLocation;
    private _lastTouchEnd;
    private readonly _touchDebounceTime;
    private readonly defaultZoom;
    private readonly animateTransitions;
    private readonly onReady?;
    private readonly onLocationChange?;
    private readonly onError?;
    private readonly onMapClick?;
    private readonly onLocationSelect?;
    private readonly onReverseGeocodingStart?;
    private readonly onReverseGeocodingEnd?;
    private readonly onSearchAddressUpdate?;
    private _cachedSetView;
    private _cachedFlyTo;
    private _cachedPanTo;
    private _cachedGetZoom;
    private _mapClickHandler;
    private _clickHandlerInitialized;
    private _operationQueue;
    private _isProcessingQueue;
    private _currentOperation;
    private _lastNavigationTime;
    private readonly _navigationDebounceTime;
    private readonly _errorHandler;
    private isAnimating;
    constructor(options?: IMapNavigationOptions);
    private _handleResize;
    private _updateMapSettingsForDevice;
    updateMapReference(mapReference: Map | {
        current: Map;
    }): boolean;
    private _setupMapClickHandler;
    private _clearQueue;
    private _processOperation;
    private _extractMapInstance;
    private _handleMapClick;
    private _setupTouchHandlers;
    private _handleTouchStart;
    private _handleTouchEnd;
    private _handleLocationSelect;
    setUserLocation(location: ILocation): boolean;
    setSelectedLocation(location: ILocation): boolean;
    private _handleReverseGeocoding;
    private _determineDisplayName;
    private _isValidLocation;
    private _normalizeLocation;
    private _queueOperation;
    private _processQueue;
    navigateTo(location: ILocation, options?: INavigationOptions): Promise<boolean>;
    centerOnUser(options?: INavigationOptions): Promise<boolean>;
    dispose(): void;
}
export default MapNavigationController;
