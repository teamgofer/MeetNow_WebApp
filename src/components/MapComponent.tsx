/**
 * MeetNow - Real-time Local Meetup Platform
 * Copyright (c) 2025 Arthur Maslo and Team Gofer. All Rights Reserved.
 *
 * This file is part of the MeetNow Software.
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 */

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  ForwardedRef,
} from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import type { Map as LeafletMap, DivIcon, LeafletMouseEvent } from 'leaflet';
import L, { LatLngExpression, Icon, LeafletEvent } from 'leaflet';

import useBreakpoint from '../hooks/useBreakpoint';
import { TILE_SERVERS, MAP_CONSTANTS, MAP_STYLES } from '../lib/map/config';
import { useMapZoom, useMeetupBounds, useMapResize } from '../lib/map/hooks';
import { initializeLeaflet, isValidLocation } from '../lib/map/utils';
import Logger from '../utils/Logger';
import { createMapIcons } from '../utils/map-icons';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { getSystemInfo, getAdaptiveConfig } from '../utils/system-detection';

import BottomSheet from './BottomSheet';
import ErrorBoundary from './ErrorBoundary';
import LeafletGeolocation from './LeafletGeolocation';
import LocationMarker from './map/LocationMarker';
import MapMarkers from './map/MapMarkers';
import MapUpdater from './map/MapUpdater';
import styles from './MapComponent.module.css';

// Import our new modular map utilities

// Initialize Leaflet
initializeLeaflet();

// MapNavigationController type (partial definition based on usage)
interface IMapNavigationController {
  updateMapReference: (mapRef: React.RefObject<LeafletMap>) => boolean;
  onLocationChange?: (location: Location) => void;
  navigateTo: (location: Location, options: NavigationOptions) => void;
  setZoom: (zoom: number) => void;
  setNavigationMode: (mode: string | number) => void;
}

// Location type
export interface ILocation {
  lat: number;
  lng: number;
  lon?: number;
  display_name?: string;
  accuracy?: number;
  name?: string;
  tags?: Record<string, any>;
  address?: Record<string, any>;
  _source?: string;
  [key: string]: any;
}

// Meetup type
export interface IMeetup {
  id: string;
  title?: string;
  description?: string;
  location: Location;
  [key: string]: any;
}

// Navigation options
export interface INavigationOptions {
  zoom?: number;
  animate?: boolean;
  method?: string;
  duration?: number;
  forceCenter?: boolean;
  [key: string]: any;
}

// MapIcons type
interface IMapIcons {
  userIcon: DivIcon;
  meetupIcon: DivIcon;
}

// Tile Server type
interface ITileServer {
  url: string;
  attribution: string;
  crossOrigin: string;
}

// MapComponent props
interface IMapComponentProps {
  location?: Location;
  matchedMeetups?: Meetup[];
  onLocationSelect?: (location: Location) => void;
  children?: React.ReactNode;
  onZoomChange?: (zoom: number) => void;
  initialZoom?: number;
  onMapClick?: (event: LeafletMouseEvent) => void;
  onSearchRadiusChange?: (radius: number) => void;
  selectedLocation?: Location | null;
  navigationController?: MapNavigationController | null;
}

// Create map icons
const createIcons = (): MapIcons => {
  const icons = createMapIcons();
  return {
    userIcon: icons.userIcon,
    meetupIcon: icons.meetupIcon,
  };
};

// Ensure Leaflet is properly initialized
if (!L.Icon.Default.imagePath) {
  L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/';
}

// Add CORS-enabled tile servers with HTTPS
const TILE_SERVERS_LIST: TileServer[] = [
  {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous',
  },
  {
    url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous',
  },
  {
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors',
    crossOrigin: 'anonymous',
  },
];

const MapComponent = forwardRef<LeafletMap, MapComponentProps>(
  (
    {
      location,
      matchedMeetups = [],
      onLocationSelect,
      children,
      onZoomChange,
      initialZoom = MAP_CONSTANTS.DEFAULT_ZOOM,
      onMapClick,
      onSearchRadiusChange,
      selectedLocation = null,
      navigationController = null,
    },
    ref
  ) => {
    const mapRef = useRef<LeafletMap | null>(null);
    const renderStartTimeRef = useRef<number>(Date.now());
    const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const userSetZoomRef = useRef<number | null>(null);
    const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
    const [mapError, setMapError] = useState<string | null>(null);
    const [hasInitialCentered, setHasInitialCentered] = useState<boolean>(false);
    const [currentCenter, setCurrentCenter] = useState<Location | null>(() =>
      isValidLocation(location) && location
        ? {
            lat: location.lat,
            lng: location.lng,
          }
        : null
    );
    const [currentZoom, setCurrentZoom] = useState<number>(15);
    const [localSelectedLocation, setLocalSelectedLocation] = useState<Location | null>(
      selectedLocation
    );
    const [isWaitingForLocation, setIsWaitingForLocation] = useState<boolean>(!location);
    const { isMobile } = useBreakpoint();
    const [icons] = useState<MapIcons>(createIcons);
    const [systemInfo] = useState(getSystemInfo());
    const [adaptiveConfig] = useState(getAdaptiveConfig());
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);
    const [shouldUseAdaptiveLayout, setShouldUseAdaptiveLayout] = useState<boolean>(false);
    const [shouldUseCompactLayout, setShouldUseCompactLayout] = useState<boolean>(false);
    const [localMeetups, setLocalMeetups] = useState<Meetup[]>(matchedMeetups);
    const [currentTileServer, setCurrentTileServer] = useState<number>(0);
    const [tileLoadErrors, setTileLoadErrors] = useState<number>(0);
    const isInitialMount = useRef<boolean>(true);
    const [flightPathKey, setFlightPathKey] = useState<number>(Date.now());

    // Track component initialization
    useEffect(() => {
      const duration = Date.now() - renderStartTimeRef.current;
      PerformanceMonitor.trackOperationTiming('map_component_init', duration, {
        hasLocation: !!location,
        hasMeetups: matchedMeetups.length > 0,
        hasNavigationController: !!navigationController,
        systemInfo: systemInfo,
      });
    }, []);

    // Effect to register the map with the navigation controller
    useEffect(() => {
      if (mapRef.current && navigationController) {
        Logger.debug('MapComponent', 'Registering map with navigation controller');

        // Register the map reference and check if it was successful
        const registrationSuccess = navigationController.updateMapReference(mapRef);

        if (!registrationSuccess) {
          // If registration failed, try again after a short delay to allow the map to fully initialize
          const retryTimeout = setTimeout(() => {
            Logger.debug('MapComponent', 'Retrying map registration with navigation controller');
            navigationController.updateMapReference(mapRef);
          }, 500);

          return () => clearTimeout(retryTimeout);
        }
      }
    }, [mapRef.current, navigationController]);

    // Effect to handle location changes from the controller
    useEffect(() => {
      if (navigationController && locationUpdateIntervalRef.current === null) {
        // Create handler for location changes
        const handleLocationChange = (updatedLocation: Location) => {
          Logger.debug('MapComponent', 'Location change from controller', updatedLocation);

          // Update the map view if needed
          if (mapRef.current && updatedLocation) {
            // Only center automatically if user hasn't manually set their own zoom
            if (!userSetZoomRef.current) {
              Logger.debug('MapComponent', 'Updating map view with new location');

              // Get current zoom or use a default zoom
              const zoomToUse = mapRef.current.getZoom() || 17;

              mapRef.current.setView([updatedLocation.lat, updatedLocation.lng], zoomToUse, {
                animate: true,
              });
            }
          }
        };

        // Store the original callback if it exists
        const originalLocationCallback = navigationController.onLocationChange;

        // Set our callback as the new handler
        navigationController.onLocationChange = (updatedLocation: Location) => {
          // Call our local handler
          handleLocationChange(updatedLocation);

          // Call the original callback if it exists and is a function
          if (typeof originalLocationCallback === 'function') {
            originalLocationCallback(updatedLocation);
          }
        };

        return () => {
          // Restore original callback on cleanup if controller still exists
          if (navigationController) {
            navigationController.onLocationChange = originalLocationCallback;
          }

          // Clear any intervals
          if (locationUpdateIntervalRef.current) {
            clearInterval(locationUpdateIntervalRef.current);
            locationUpdateIntervalRef.current = null;
          }
        };
      }
    }, [navigationController]);

    // Handle location selection (from map clicks)
    const handleLocationSelect = useCallback(
      (newLocation: Location, preserveBirdsEyeView = false) => {
        Logger.debug('MapComponent', 'Location selected', newLocation);

        if (!newLocation ?? !isValidLocation(newLocation)) {
          Logger.warn('MapComponent', 'Invalid location selected', newLocation);
          return;
        }

        // Call the parent's onLocationSelect callback with the new location
        if (onLocationSelect) {
          onLocationSelect(newLocation);
        }

        // Set local selected location for UI updates
        setLocalSelectedLocation(newLocation);

        // If using navigation controller, let it handle view changes
        if (navigationController) {
          // Use the navigation controller to handle the view change
          navigationController.navigateTo(newLocation, {
            animate: true,
            method: 'flyTo',
          });
        }
      },
      [onLocationSelect, navigationController]
    );

    // Handle map clicks
    const handleMapClick = useCallback(
      (event: LeafletMouseEvent) => {
        // If we have a navigation controller, let it handle the click
        if (navigationController) {
          // The controller will call our onLocationSelect through its event system
          return;
        }

        // Otherwise handle it directly
        if (onMapClick) {
          onMapClick(event);
        }
      },
      [onMapClick, navigationController]
    );

    // When user location changes, update the map
    useEffect(() => {
      if (!location ?? (!isValidLocation(location) || !mapRef.current)) {
        return;
      }

      if (!hasInitialCentered) {
        Logger.debug(
          'MapComponent',
          `Setting initial center to user location, lat: ${location.lat}, lng: ${location.lng}`
        );
        setHasInitialCentered(true);

        // Initial centering should be animated for better UX
        mapRef.current.flyTo([location.lat, location.lng], initialZoom ?? 15, {
          animate: true,
          duration: 1,
        });
      }
    }, [location, hasInitialCentered]);

    // Update selected location when it changes from props
    useEffect(() => {
      if (selectedLocation !== localSelectedLocation) {
        setLocalSelectedLocation(selectedLocation);
      }
    }, [selectedLocation]);

    // Update center when location changes
    useEffect(() => {
      if (!location ?? !isValidLocation(location)) {
        return;
      }

      // If this location update came from a map click, don't update the map view at all
      // This is the most critical check to prevent the loop of map recentering
      if (location._source === 'map') {
        Logger.debug(
          'MapComponent',
          `Preventing ALL map updates for map click: ${location.display_name ?? 'unknown location'}`
        );
        return; // Early return prevents ANY map manipulation for map clicks
      }

      // Update current center for state management (even though we won't recenter)
      setCurrentCenter({
        lat: location.lat,
        lng: location.lng,
      });

      // If waiting for location, mark as received
      if (isWaitingForLocation) {
        setIsWaitingForLocation(false);
      }

      // Determine if we should center the map based on the location source
      const shouldCenterMap =
        // Initial centering (first location received)
        (!hasInitialCentered && mapRef.current) ||
        // Explicit centering request (e.g., from dropdown selection)
        location._source === 'dropdown' ||
        location._source === 'search';

      // Only center the map if it's the first location or from the dropdown/search
      if (shouldCenterMap && mapRef.current) {
        Logger.debug(
          'MapComponent',
          `Centering map on location (source: ${location._source ?? 'initial'}), lat: ${location.lat}, lng: ${location.lng}`
        );

        if (!hasInitialCentered) {
          setHasInitialCentered(true);
        }

        // Use flyTo for a smooth animation to the new location
        mapRef.current.flyTo(
          [location.lat, location.lng],
          userSetZoomRef.current !== null ? userSetZoomRef.current : (initialZoom ?? 15),
          { animate: true, duration: 1 }
        );
      } else {
        Logger.debug(
          'MapComponent',
          `Skipping map centering for location update (source: ${location._source ?? 'unknown'})`
        );
      }
    }, [location, hasInitialCentered, currentZoom, navigationController]);

    // Handle map loading state
    const handleMapLoad = useCallback(() => {
      setIsMapLoading(false);

      // Measure load time
      const loadTime = Date.now() - renderStartTimeRef.current;
      PerformanceMonitor.trackOperationTiming('map_load', loadTime, {
        success: true,
        hasLocation: !!location,
        hasMeetups: matchedMeetups.length > 0,
      });

      Logger.info('MapComponent', `Map loaded successfully in ${loadTime}ms`);
    }, [location, matchedMeetups]);

    // Handle map zoom changes
    const handleZoomEnd = useCallback(
      (newZoom?: number) => {
        if (!mapRef.current) return;

        const zoom = newZoom ?? mapRef.current.getZoom();
        Logger.debug('MapComponent', `Zoom changed to ${zoom}`);

        // Remember that user has set zoom
        userSetZoomRef.current = zoom;

        setCurrentZoom(zoom);
        if (onZoomChange) {
          onZoomChange(zoom);
        }

        // Update controller if available
        if (navigationController) {
          navigationController.setZoom(zoom);
        }

        // Dynamically adjust search radius based on zoom
        if (onSearchRadiusChange) {
          const radius = Math.max(1000, 20000 / Math.pow(1.2, zoom - 10));
          onSearchRadiusChange(radius);
        }
      },
      [onZoomChange, onSearchRadiusChange, navigationController]
    );

    // Separate map events handler component
    const MapEvents = () => {
      const map = useMapEvents({
        load: () => {
          handleMapLoad();
        },
        zoomend: () => {
          handleZoomEnd();
        },
        moveend: () => {
          const center = map.getCenter();
          setCurrentCenter({
            lat: center.lat,
            lng: center.lng,
            _userInteraction: true,
          });
        },
        click: e => {
          handleMapClick(e);
        },
        locationfound: e => {
          Logger.debug('MapComponent', 'Browser location found', e.latlng);
        },
        locationerror: e => {
          Logger.warn('MapComponent', 'Browser location error', e.message);
        },
        error: (e: any) => {
          Logger.error('MapComponent', 'Map error', e);
          setMapError(e.message ?? 'An error occurred with the map');
        },
      });

      // Store map reference
      useEffect(() => {
        mapRef.current = map;

        // Expose to parent via ref if provided
        if (ref) {
          if (typeof ref === 'function') {
            ref(map);
          } else {
            ref.current = map;
          }
        }

        return () => {
          if (ref && typeof ref === 'object') {
            ref.current = null;
          }
        };
      }, [map]);

      return null;
    };

    // For testing or external integration - registers navigation capabilities
    useEffect(() => {
      // This global function might be used by testing tools
      const registerNavControl = (window as any).__registerModeControl;
      if (registerNavControl && navigationController) {
        // Register the controller's setNavigationMode for external access
        registerNavControl((navRequest: any) => {
          // Pass navigation requests to the controller
          if (typeof navRequest === 'object') {
            navigationController.navigateTo(navRequest.location, navRequest.options);
          } else if (typeof navRequest === 'string' || typeof navRequest === 'number') {
            // Support legacy mode registration
            navigationController.setNavigationMode(navRequest);
          }
        });
      }
    }, [navigationController]);

    // Check for tile server errors and switch if needed
    useEffect(() => {
      if (tileLoadErrors > 3) {
        // Try the next tile server
        setCurrentTileServer(prev => (prev + 1) % TILE_SERVERS_LIST.length);
        setTileLoadErrors(0);
      }
    }, [tileLoadErrors]);

    // Selected tile server
    const tileServer = TILE_SERVERS_LIST[currentTileServer];

    // Handle tile error
    const handleTileError = useCallback(() => {
      setTileLoadErrors(prev => prev + 1);
    }, []);

    return (
      <ErrorBoundary
        fallback={
          <div className={styles.mapError}>Map could not be loaded. Please try refreshing.</div>
        }
      >
        <div className={styles.mapContainer}>
          {isMapLoading && (
            <div className={styles.mapLoading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading map...</p>
            </div>
          )}

          {mapError && (
            <div className={styles.mapError}>
              <p>Error: {mapError}</p>
              <button onClick={() => window.location.reload()}>Reload</button>
            </div>
          )}

          <MapContainer
            center={currentCenter ? [currentCenter.lat, currentCenter.lng] : [0, 0]}
            zoom={currentZoom}
            zoomControl={false}
            className={styles.map}
            style={{ height: '100%', width: '100%' }}
            attributionControl={true}
            maxBounds={[
              [-90, -180],
              [90, 180],
            ]}
            maxBoundsViscosity={0.5}
            minZoom={2}
            maxZoom={20}
            zoomSnap={0.5}
            wheelDebounceTime={50}
            wheelPxPerZoomLevel={100}
            wheelZoom={true}
            doubleClickZoom={true}
            bounceAtZoomLimits={true}
            worldCopyJump={true}
          >
            <MapEvents />

            <ZoomControl position="bottomright" />

            <TileLayer
              attribution={tileServer.attribution}
              url={tileServer.url}
              crossOrigin={tileServer.crossOrigin as any}
              eventHandlers={{
                tileerror: handleTileError,
              }}
              maxZoom={20}
              minZoom={2}
              tileSize={256}
              zoomOffset={0}
              updateWhenIdle={true}
              updateWhenZooming={false}
              updateInterval={150}
              zIndex={1}
              bounds={[
                [-90, -180],
                [90, 180],
              ]}
              noWrap={false}
              keepBuffer={2}
              maxNativeZoom={20}
              minNativeZoom={2}
              zoomSnap={0.5}
              zoomAnimation={true}
              fadeAnimation={true}
              markerZoomAnimation={true}
              detectRetina={true}
              renderer={L.canvas()}
              className="map-tiles"
            />

            {currentCenter && (
              <MapUpdater
                center={currentCenter}
                zoom={currentZoom}
                selectedLocation={localSelectedLocation}
                onUpdate={update => {
                  // Your code to handle map updates
                }}
              />
            )}

            {/* Only render markers when map is ready */}
            {!isMapLoading && (
              <>
                {location && (
                  <LocationMarker
                    onLocationSelect={handleLocationSelect}
                    position={{
                      lat: location.lat,
                      lng: location.lng,
                    }}
                    icon={icons.userIcon}
                  />
                )}

                {/* Render matched meetups */}
                <MapMarkers
                  currentCenter={currentCenter ?? undefined}
                  activeMeetups={localMeetups}
                  icons={icons}
                  getPopupConfig={() => ({})}
                  onMarkerClick={handleLocationSelect}
                />

                {/* Include any additional children passed to this component */}
                {children}
              </>
            )}

            {/* Include additional map components */}
            <LeafletGeolocation />
          </MapContainer>
        </div>
      </ErrorBoundary>
    );
  }
);

export default MapComponent;
