import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';

const MapMarkers = ({ currentCenter, activeMeetups, icons, getPopupConfig, handlePopupOpen, onMarkerClick }) => {
  // Handler to trigger both popup open and the click callback
  const handleMarkerClick = (meetup) => {
    // Only proceed if we have a click handler
    if (!onMarkerClick) return;
    
    // Create location object from meetup data
    const locationData = {
      lat: meetup.location.lat,
      lng: meetup.location.lng,
      isUserSelected: true,
      display_name: meetup.title || meetup.address || 'Selected Location'
    };
    
    // Call the click handler
    onMarkerClick(locationData);
  };

  return (
    <>
      {/* User location marker */}
      {currentCenter && currentCenter.lat && currentCenter.lng && (
        <Marker 
          position={[currentCenter.lat, currentCenter.lng]} 
          icon={icons.userIcon}
          eventHandlers={{
            popupopen: handlePopupOpen
          }}
          className="user-marker"
        >
          <Popup {...getPopupConfig()}>
            <div className="meetup-card text-base p-2">Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Meetup markers - only show active ones */}
      {activeMeetups.map((meetup) => (
        meetup.location && meetup.location.lat && meetup.location.lng && (
          <Marker 
            key={meetup.id}
            position={[meetup.location.lat, meetup.location.lng]} 
            icon={icons.meetupIcon}
            eventHandlers={{
              popupopen: handlePopupOpen,
              click: () => handleMarkerClick(meetup)
            }}
            className="meetup-marker"
          >
            <Popup {...getPopupConfig()}>
              <div className="meetup-card text-sm p-3">
                <p className="font-semibold mb-2 text-base">{meetup.title || meetup.address || 'Meeting Point'}</p>
                
                {meetup.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    {meetup.description}
                  </p>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  {meetup.distance_meters ? `${(meetup.distance_meters).toFixed(0)}m away` : ''}
                </p>
                
                <p className="text-gray-600 dark:text-gray-300">
                  {meetup.expires_at ? (
                    `Expires: ${new Date(meetup.expires_at).toLocaleTimeString()}`
                  ) : meetup.starts_at && meetup.duration_minutes ? (
                    `Expires: ${(() => {
                      const expiryTime = new Date(meetup.starts_at);
                      expiryTime.setMinutes(expiryTime.getMinutes() + meetup.duration_minutes);
                      return expiryTime.toLocaleTimeString();
                    })()}`
                  ) : (
                    'Duration: 1 hour'
                  )}
                </p>
                
                {meetup.creator_name && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Created by: {meetup.creator_name}
                  </p>
                )}
                
                {meetup.current_participants > 0 && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {meetup.current_participants} of {meetup.max_participants} participants
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </>
  );
};

MapMarkers.propTypes = {
  currentCenter: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired,
  activeMeetups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired
    }).isRequired,
    address: PropTypes.string,
    distance_meters: PropTypes.number,
    expires_at: PropTypes.string,
    starts_at: PropTypes.string,
    duration_minutes: PropTypes.number,
    current_participants: PropTypes.number,
    max_participants: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    creator_name: PropTypes.string
  })).isRequired,
  icons: PropTypes.shape({
    userIcon: PropTypes.object.isRequired,
    meetupIcon: PropTypes.object.isRequired
  }).isRequired,
  getPopupConfig: PropTypes.func.isRequired,
  handlePopupOpen: PropTypes.func.isRequired,
  onMarkerClick: PropTypes.func
};

export default MapMarkers; 