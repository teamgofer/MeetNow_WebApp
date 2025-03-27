import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import withSafeExtraction from '../../hocs/withSafeExtraction';
import { useMeetupState, useMapState, useUIState } from '../../contexts/ComponentStateContext';
import MeetupCard from './MeetupCard';

/**
 * NearbyMeetups component displays a list of meetups near the user
 * This is an example of a component extracted from MeetNowApp
 */
const NearbyMeetups = ({ className = '', maxDistance = 5 }) => {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Access centralized state via hooks
  const { meetupState, meetupActions } = useMeetupState();
  const { mapState } = useMapState();
  const { uiActions } = useUIState();
  
  // Destructure meetup state
  const { nearbyMeetups, filters } = meetupState;
  const { userLocation } = mapState;
  
  // Fetch nearby meetups when location or filters change
  useEffect(() => {
    const fetchNearbyMeetups = async () => {
      if (!userLocation) return;
      
      setIsLoading(true);
      try {
        // This would normally call your API
        // For demonstration, we're simulating the API call
        const mockApiCall = async () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve([
                {
                  id: '1',
                  title: 'Coffee Meetup',
                  description: 'Let\'s grab coffee and chat!',
                  location: {
                    lat: userLocation.lat + 0.001,
                    lng: userLocation.lng + 0.001
                  },
                  startTime: new Date(Date.now() + 3600000).toISOString(),
                  attendees: 3,
                  distance: 0.3
                },
                {
                  id: '2',
                  title: 'Park Hangout',
                  description: 'Relaxing at the park',
                  location: {
                    lat: userLocation.lat - 0.002,
                    lng: userLocation.lng - 0.001
                  },
                  startTime: new Date(Date.now() + 7200000).toISOString(),
                  attendees: 5,
                  distance: 0.8
                }
              ]);
            }, 500);
          });
        };
        
        const meetups = await mockApiCall();
        meetupActions.setNearbyMeetups(meetups);
      } catch (error) {
        setError(error);
        uiActions.setError('nearbyMeetups', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNearbyMeetups();
  }, [userLocation, filters.distance, filters.category, filters.timeRange, meetupActions, uiActions]);
  
  // Handle meetup selection
  const handleSelectMeetup = (meetup) => {
    meetupActions.setActiveMeetup(meetup);
    uiActions.setBottomSheetState('expanded');
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`nearby-meetups-loading ${className}`}>
        <div className="loading-spinner"></div>
        <p>Finding meetups near you...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`nearby-meetups-error ${className}`}>
        <p>Error loading meetups: {error.message}</p>
        <button 
          onClick={() => {
            setError(null);
            uiActions.clearError('nearbyMeetups');
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Render empty state
  if (nearbyMeetups.length === 0) {
    return (
      <div className={`nearby-meetups-empty ${className}`}>
        <p>No meetups found within {maxDistance} miles.</p>
        <p>Why not create one?</p>
      </div>
    );
  }
  
  // Render meetups list
  return (
    <div className={`nearby-meetups ${className}`} data-testid="nearby-meetups">
      <h2>Nearby Meetups</h2>
      <div className="meetups-list">
        {nearbyMeetups.map(meetup => (
          <MeetupCard 
            key={meetup.id}
            meetup={meetup}
            onClick={() => handleSelectMeetup(meetup)}
          />
        ))}
      </div>
    </div>
  );
};

NearbyMeetups.propTypes = {
  className: PropTypes.string,
  maxDistance: PropTypes.number
};

// Export the component wrapped with safe extraction HOC
export default withSafeExtraction(NearbyMeetups, {
  id: 'NearbyMeetups',
  dependencies: ['MapComponent', 'BottomSheet'],
  errorBoundary: true,
  defaultProps: { maxDistance: 5 }
}); 