import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from './';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const formatDistance = (distanceInKm) => {
  if (typeof distanceInKm !== 'number' || isNaN(distanceInKm)) {
    console.error('Invalid distance value:', distanceInKm);
    return 'Distance unknown';
  }

  const distanceInMeters = distanceInKm * 1000;
  
  // Round to nearest meter for small distances
  if (distanceInMeters < 100) {
    return `${Math.round(distanceInMeters)}m away`;
  }
  // Round to nearest 10m for medium distances
  else if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters / 10) * 10}m away`;
  }
  // Use kilometers with one decimal for larger distances
  return `${distanceInKm.toFixed(1)}km away`;
};

const formatTimeRemaining = (expiresAt, timezone) => {
  try {
    if (!expiresAt) {
      console.error('No expiration time provided');
      return 'Time not set';
    }

    console.log('Formatting time for:', expiresAt);

    // Parse the expiration time
    const expiration = new Date(expiresAt);
    const now = new Date();

    if (isNaN(expiration.getTime())) {
      console.error('Invalid expiration date:', expiresAt);
      return 'Invalid time';
    }

    // Extract timezone offset from ISO string if available
    let timezoneOffset = 0;
    if (expiresAt.includes('+') || expiresAt.includes('-')) {
      const offsetMatch = expiresAt.match(/([+-])(\d{2}):?(\d{2})/);
      if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? 1 : -1;
        const hours = parseInt(offsetMatch[2], 10);
        const minutes = parseInt(offsetMatch[3], 10);
        timezoneOffset = sign * (hours * 60 + minutes) * 60 * 1000;
        console.log('Extracted timezone offset:', timezoneOffset);
      }
    }

    // Calculate time difference in milliseconds
    let diffMs = expiration.getTime() - now.getTime();

    // Apply timezone offset if provided in the ISO string
    if (timezoneOffset !== 0) {
      const localOffset = now.getTimezoneOffset() * 60 * 1000;
      diffMs = diffMs + localOffset - timezoneOffset;
      console.log('Applied timezone offset:', { localOffset, timezoneOffset, diffMs });
    }

    if (diffMs <= 0) {
      return 'Expired';
    }

    // Calculate minutes and seconds
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    // Format the output
    if (minutes === 0) {
      return `${seconds}s remaining`;
    }
    return `${minutes}m ${seconds}s remaining`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time error';
  }
};

const MeetupCard = ({ meetup }) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    return formatTimeRemaining(meetup.expires_at, meetup.timezone);
  });

  useEffect(() => {
    const updateTime = () => {
      const newTime = formatTimeRemaining(meetup.expires_at, meetup.timezone);
      setTimeRemaining(newTime);
      return newTime;
    };

    // Initial update
    updateTime();

    // Update every second
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [meetup.id, meetup.expires_at, meetup.timezone]);

  // Get the best available address information
  const addressDisplay = meetup.address || meetup.place_name || 'Location selected';
  const distanceText = meetup.distance ? formatDistance(meetup.distance) : 'Calculating distance...';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {/* Compact View (Always Visible) */}
        <div className="flex items-center p-4 space-x-4">
          {/* Left side: Mini image or icon */}
          <div className="flex-shrink-0">
            {meetup.image_url ? (
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={meetup.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FaMapMarkerAlt className="text-blue-500 text-xl" />
              </div>
            )}
          </div>

          {/* Middle: Basic Info */}
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {meetup.title || 'Instant Meetup'}
            </h3>
            <div className="text-sm text-gray-500 truncate">{distanceText}</div>
          </div>

          {/* Right: Time */}
          <div className="flex-shrink-0 text-right">
            <div 
              className={`text-sm font-medium ${
                timeRemaining === 'Expired' ? 'text-red-500' : 
                !timeRemaining.includes('m') ? 'text-yellow-500' : 'text-gray-600'
              }`}
            >
              {timeRemaining}
            </div>
          </div>
        </div>

        {/* Expanded View (Shown on Hover) */}
        <div className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:max-h-96">
          <div className="p-4 pt-0 space-y-4">
            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Full Image */}
            {meetup.image_url && (
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={meetup.image_url}
                  alt={meetup.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {meetup.description && (
              <p className="text-sm text-gray-600">
                {meetup.description}
              </p>
            )}

            {/* Detailed Location */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                <div className="font-medium">{addressDisplay}</div>
              </div>

              {meetup.timezone && (
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="mr-1">🌍</span>
                  Expires at {new Date(meetup.expires_at).toLocaleTimeString()}
                </div>
              )}
            </div>

            {meetup.status !== 'active' && (
              <div className="text-red-500 text-sm font-medium">
                Status: {meetup.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const NearbyMeetups = ({ meetups, currentLocation }) => {
  // Calculate distances for all meetups based on current location
  const meetupsWithDistances = useMemo(() => {
    if (!currentLocation) {
      console.warn('No current location provided to NearbyMeetups');
      return meetups;
    }

    console.log('Calculating distances with current location:', {
      lat: currentLocation.lat.toFixed(6),
      lng: currentLocation.lng.toFixed(6)
    });

    return meetups.map(meetup => {
      if (!meetup.location || typeof meetup.location.lat !== 'number' || typeof meetup.location.lng !== 'number') {
        console.error('Invalid meetup location:', meetup.location);
        return meetup;
      }

      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        meetup.location.lat,
        meetup.location.lng
      );

      console.log('Distance calculation:', {
        meetupId: meetup.id,
        meetupLocation: {
          lat: meetup.location.lat.toFixed(6),
          lng: meetup.location.lng.toFixed(6)
        },
        currentLocation: {
          lat: currentLocation.lat.toFixed(6),
          lng: currentLocation.lng.toFixed(6)
        },
        distanceKm: distance,
        distanceMeters: distance * 1000
      });

      return {
        ...meetup,
        distance: distance,
        distanceInMeters: distance * 1000
      };
    })
    .filter(meetup => {
      const isNearby = meetup.distanceInMeters <= 500; // 500 meters
      if (!isNearby) {
        console.log('Filtering out distant meetup:', {
          meetupId: meetup.id,
          distance: meetup.distanceInMeters,
          threshold: 500
        });
      }
      return isNearby;
    })
    .sort((a, b) => (a.distanceInMeters || 0) - (b.distanceInMeters || 0));
  }, [meetups, currentLocation]);

  useEffect(() => {
    console.log('NearbyMeetups state:', {
      meetupsCount: meetups.length,
      currentLocation: currentLocation ? {
        lat: currentLocation.lat.toFixed(6),
        lng: currentLocation.lng.toFixed(6)
      } : null,
      meetupsWithDistances: meetupsWithDistances.map(m => ({
        id: m.id,
        distance: m.distance,
        location: {
          lat: m.location.lat.toFixed(6),
          lng: m.location.lng.toFixed(6)
        }
      }))
    });
  }, [meetups, currentLocation, meetupsWithDistances]);

  return (
    <div className="absolute top-4 right-4 z-10 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-2 p-4 bg-white/50 backdrop-blur-sm rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Nearby Meetups ({meetupsWithDistances.length})
      </h2>
      <div className="space-y-2">
        {meetupsWithDistances.map((meetup) => (
          <MeetupCard key={meetup.id} meetup={meetup} />
        ))}
      </div>
      {meetupsWithDistances.length === 0 && (
        <div className="text-gray-500 text-center py-8">
          No meetups found within 500m
        </div>
      )}
    </div>
  );
};

// Haversine formula for calculating distances
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

MeetupCard.propTypes = {
  meetup: PropTypes.shape({
    id: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    address: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    expires_at: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    distance: PropTypes.number,
    timezone: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      offset: PropTypes.number.isRequired,
      dstOffset: PropTypes.number.isRequired
    })
  }).isRequired
};

NearbyMeetups.propTypes = {
  meetups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    address: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    expires_at: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    distance: PropTypes.number,
    timezone: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      offset: PropTypes.number.isRequired,
      dstOffset: PropTypes.number.isRequired
    })
  })).isRequired,
  currentLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  })
};

export default NearbyMeetups;