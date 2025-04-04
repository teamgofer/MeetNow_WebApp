import React from 'react';
import type { LatLngExpression, DivIcon, Icon } from 'leaflet';
import MapMarker from './MapMarker';

// Match the same prop structure as MapMarker component
interface Marker {
  id: string | number;
  position: LatLngExpression;
  popupContent?: React.ReactNode;
  icon?: DivIcon | Icon;
  title?: string;
  zIndexOffset?: number;
  opacity?: number;
  showPopup?: boolean;
}

interface MapMarkersProps {
  markers: Marker[];
  onMarkerClick?: (markerId: string | number, e: L.LeafletMouseEvent) => void;
  selectedMarkerId?: string | number | null;
}

/**
 * Component to render multiple map markers efficiently
 */
const MapMarkers: React.FC<MapMarkersProps> = ({
  markers,
  onMarkerClick,
  selectedMarkerId = null,
}) => {
  // Handle click on a specific marker
  const handleMarkerClick = (markerId: string | number) => (e: L.LeafletMouseEvent) => {
    if (onMarkerClick) {
      onMarkerClick(markerId, e);
    }
  };

  return (
    <>
      {markers.map(marker => {
        const isSelected = selectedMarkerId === marker.id;

        // Create marker props based on available data
        const markerProps: any = {
          key: marker.id,
          markerId: marker.id,
          position: marker.position,
          showPopup: isSelected || !!marker.showPopup,
        };

        // Only add optional props if they exist
        if (marker.popupContent) markerProps.popupContent = marker.popupContent;
        if (marker.icon) markerProps.icon = marker.icon;
        if (marker.title) markerProps.title = marker.title;
        if (marker.zIndexOffset !== undefined) markerProps.zIndexOffset = marker.zIndexOffset;
        if (marker.opacity !== undefined) markerProps.opacity = marker.opacity;
        if (onMarkerClick) markerProps.onClick = handleMarkerClick(marker.id);

        return <MapMarker {...markerProps} />;
      })}
    </>
  );
};

export default MapMarkers;
import type { DivIcon, LatLngExpression } from 'leaflet';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

import Logger from '../../utils/Logger';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

export interface ILocation {
  lat: number;
  lng: number;
  display_name?: string;
  address?: Record<string, string>;
  tags?: Record<string, any>;
  isUserSelected?: boolean;
  [key: string]: any;
}

export interface IMeetup {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location: Location;
  attendees?: number;
  categories?: string[];
  status?: string;
  url?: string;
  distance?: number;
  [key: string]: any;
}

export interface IMapMarkerIcons {
  userIcon: DivIcon;
  meetupIcon: DivIcon;
}

export interface IPopupConfig {
  maxWidth?: number;
  minWidth?: number;
  closeButton?: boolean;
  autoPan?: boolean;
  closeOnClick?: boolean;
  className?: string;
}

export interface IMapMarkersProps {
  currentCenter?: Location;
  activeMeetups?: Meetup[];
  icons: MapMarkerIcons;
  getPopupConfig: () => PopupConfig;
  handlePopupOpen?: () => void;
  onMarkerClick?: (location: Location) => void;
  selectedMeetupId?: string;
  highlightSelected?: boolean;
  showPopups?: boolean;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  currentCenter,
  activeMeetups = [],
  icons,
  getPopupConfig,
  handlePopupOpen,
  onMarkerClick,
  selectedMeetupId,
  highlightSelected = true,
  showPopups = true,
}) => {
  const renderStartTimeRef = useRef<number>(Date.now());
  const lastMeetupsRef = useRef<Meetup[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedMeetupId);

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('map', 'mapMarkersInit', duration, {
      success: true,
      hasCurrentCenter: !!currentCenter,
      meetupCount: activeMeetups.length ?? 0,
      hasIcons: !!icons,
    });

    return () => {
      Logger.debug('MapMarkers', 'Component unmounted');
    };
  }, []);

  // Update selected meetup when prop changes
  useEffect(() => {
    if (selectedMeetupId !== selectedId) {
      setSelectedId(selectedMeetupId);
    }
  }, [selectedMeetupId]);

  // Track meetups changes
  useEffect(() => {
    if (activeMeetups) {
      const startTime = Date.now();
      const meetupCount = activeMeetups.length;
      const addedMeetups = activeMeetups.filter(
        meetup => !lastMeetupsRef.current.find(m => m.id === meetup.id)
      );
      const removedMeetups = lastMeetupsRef.current.filter(
        meetup => !activeMeetups.find(m => m.id === meetup.id)
      );

      PerformanceMonitor.trackOperationTiming('map', 'mapMarkersUpdate', Date.now() - startTime, {
        success: true,
        meetupCount,
        addedCount: addedMeetups.length,
        removedCount: removedMeetups.length,
        hasCurrentCenter: !!currentCenter,
      });

      lastMeetupsRef.current = activeMeetups;
    }
  }, [activeMeetups, currentCenter]);

  // Handler to trigger both popup open and the click callback
  const handleMarkerClick = (meetup: Meetup) => {
    const startTime = Date.now();

    // Update selected ID
    setSelectedId(meetup.id);

    // Only proceed if we have a click handler
    if (!onMarkerClick) {
      PerformanceMonitor.trackOperationTiming('map', 'mapMarkerClick', 0, {
        success: false,
        reason: 'noClickHandler',
        meetupId: meetup.id,
      });
      return;
    }

    // Create location object from meetup data
    const locationData: Location = {
      ...meetup.location,
      isUserSelected: true,
      display_name: meetup.title ?? (meetup.location.display_name || 'Selected Location'),
      meetupId: meetup.id,
    };

    // Call the click handler
    onMarkerClick(locationData);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('map', 'mapMarkerClick', duration, {
      success: true,
      meetupId: meetup.id,
      hasTitle: !!meetup.title,
      hasAddress: !!meetup.location.address,
    });
  };

  // Memoize the user marker to prevent unnecessary re-renders
  const userMarker = useMemo(() => {
    if (!currentCenter?.lat ?? !currentCenter.lng) return null;

    return (
      <Marker
        position={[currentCenter.lat, currentCenter.lng] as LatLngExpression}
        icon={icons.userIcon}
        eventHandlers={{
          popupopen: () => {
            const startTime = Date.now();
            if (handlePopupOpen) {
              handlePopupOpen();
              const duration = Date.now() - startTime;
              PerformanceMonitor.trackOperationTiming('map', 'mapMarkerPopupOpen', duration, {
                success: true,
                type: 'userLocation',
                lat: currentCenter.lat,
                lng: currentCenter.lng,
              });
            }
          },
        }}
      >
        {showPopups && (
          <Popup {...getPopupConfig()}>
            <div className="meetup-card text-base p-2">Your Location</div>
          </Popup>
        )}
      </Marker>
    );
  }, [currentCenter, icons.userIcon, handlePopupOpen, getPopupConfig, showPopups]);

  return (
    <>
      {/* User location marker */}
      {userMarker}

      {/* Meetup markers - only show active ones */}
      {Array.isArray(activeMeetups) &&
        activeMeetups.map(meetup => {
          // Skip invalid meetups
          if (!meetup.location.lat ?? !meetup.location.lng) {
            Logger.warn('MapMarkers', 'Invalid meetup location', { meetupId: meetup.id });
            return null;
          }

          // Determine if this meetup is selected
          const isSelected = highlightSelected && selectedId === meetup.id;

          return (
            <Marker
              key={meetup.id ?? `meetup-${Math.random()}`}
              position={[meetup.location.lat, meetup.location.lng] as LatLngExpression}
              icon={icons.meetupIcon}
              zIndexOffset={isSelected ? 1000 : 500}
              opacity={isSelected ? 1 : 0.8}
              eventHandlers={{
                click: () => handleMarkerClick(meetup),
                popupopen: () => {
                  const startTime = Date.now();
                  if (handlePopupOpen) {
                    handlePopupOpen();
                    const duration = Date.now() - startTime;
                    PerformanceMonitor.trackOperationTiming('map', 'mapMarkerPopupOpen', duration, {
                      success: true,
                      type: 'meetup',
                      meetupId: meetup.id,
                      lat: meetup.location.lat,
                      lng: meetup.location.lng,
                    });
                  }
                },
              }}
            >
              {showPopups && (
                <Popup {...getPopupConfig()}>
                  <div className="meetup-card text-base p-2">
                    <h3 className="font-semibold">{meetup.title ?? 'Unnamed Meetup'}</h3>
                    {meetup.description && <p className="text-sm">{meetup.description}</p>}
                    {meetup.date && (
                      <p className="text-xs mt-2">
                        {meetup.date} {meetup.time || ''}
                      </p>
                    )}
                    {meetup.distance !== undefined && (
                      <p className="text-xs text-gray-500">
                        {meetup.distance < 1000
                          ? `${Math.round(meetup.distance)}m away`
                          : `${(meetup.distance / 1000).toFixed(1)}km away`}
                      </p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
    </>
  );
};

export default MapMarkers;
