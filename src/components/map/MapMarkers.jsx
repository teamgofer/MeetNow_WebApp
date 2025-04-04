import React, { useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

const MapMarkers = ({
  currentCenter,
  activeMeetups,
  icons,
  getPopupConfig,
  handlePopupOpen,
  onMarkerClick,
}) => {
  const renderStartTimeRef = useRef(Date.now());
  const lastMeetupsRef = useRef([]);

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('map', 'mapMarkersInit', duration, {
      success: true,
      hasCurrentCenter: !!currentCenter,
      meetupCount: activeMeetups?.length || 0,
      hasIcons: !!icons,
    });
  }, []);

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

      PerformanceMonitor.trackOperationTiming('map', 'mapMarkersUpdate', 0, {
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
  const handleMarkerClick = meetup => {
    const startTime = Date.now();

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
    const locationData = {
      lat: meetup.location.lat,
      lng: meetup.location.lng,
      isUserSelected: true,
      display_name: meetup.title || meetup.address || 'Selected Location',
    };

    // Call the click handler
    onMarkerClick(locationData);

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('map', 'mapMarkerClick', duration, {
      success: true,
      meetupId: meetup.id,
      hasTitle: !!meetup.title,
      hasAddress: !!meetup.address,
    });
  };

  return (
    <>
      {/* User location marker */}
      {currentCenter && currentCenter.lat && currentCenter.lng && (
        <Marker
          position={[currentCenter.lat, currentCenter.lng]}
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
          className="user-marker"
        >
          <Popup {...getPopupConfig()}>
            <div className="meetup-card text-base p-2">Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Meetup markers - only show active ones */}
      {Array.isArray(activeMeetups) &&
        activeMeetups.map(meetup => {
          if (!meetup?.location?.lat || !meetup?.location?.lng) {
            PerformanceMonitor.trackError(
              'map',
              'mapMarkerInvalidMeetup',
              new Error('Invalid meetup location')
            );
            return null;
          }

          return (
            <Marker
              key={meetup.id || `meetup-${Math.random()}`}
              position={[meetup.location.lat, meetup.location.lng]}
              icon={icons.meetupIcon}
              eventHandlers={{
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
              <Popup>
                <div className="meetup-card text-base p-2">
                  <h3 className="font-semibold">{meetup.title || 'Unnamed Meetup'}</h3>
                  <p className="text-sm">{meetup.description || 'No description available'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
};

MapMarkers.propTypes = {
  currentCenter: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  activeMeetups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  icons: PropTypes.shape({
    userIcon: PropTypes.object.isRequired,
    meetupIcon: PropTypes.object.isRequired,
  }).isRequired,
  getPopupConfig: PropTypes.func.isRequired,
  handlePopupOpen: PropTypes.func,
  onMarkerClick: PropTypes.func,
};

export default MapMarkers;
