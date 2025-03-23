import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from './index.js';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { cn } from '../../lib/utils';
import { formatMeetupTime, calculateExpiryTime } from '../../utils/timezone.js';

const formatDistance = (distanceInMeters) => {
  if (typeof distanceInMeters !== 'number' || isNaN(distanceInMeters)) {
    console.error('Invalid distance value:', distanceInMeters);
    return 'Distance unknown';
  }

  // Round to nearest meter for small distances
  if (distanceInMeters < 100) {
    return `${Math.round(distanceInMeters)}m away`;
  }
  // Round to nearest 10m for medium distances
  else if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters / 10) * 10}m away`;
  }
  // Use kilometers with one decimal for larger distances
  return `${(distanceInMeters / 1000).toFixed(1)}km away`;
};

const formatTimeRemaining = (expiresAt, timezone, startsAt, durationMinutes, location) => {
  // Calculate expiry using location coordinates if available
  let expiryTime;
  
  if (location && location.lat && location.lng && startsAt && durationMinutes) {
    // If we have coordinates, prefer using our location-based timezone calculation
    try {
      // Create a Date object from the expiry time converted from the meetup's location timezone
      const formattedExpiryTimeString = calculateExpiryTime(startsAt, durationMinutes, location.lat, location.lng);
      // Only need this for calculations, not display
      const tempExpiryTime = new Date(startsAt);
      tempExpiryTime.setMinutes(tempExpiryTime.getMinutes() + durationMinutes);
      expiryTime = tempExpiryTime;
      
      // Log for debugging
      console.log('Using location-based expiry time:', {
        location,
        startsAt,
        calculatedExpiry: formattedExpiryTimeString,
        expiryTimeObj: expiryTime
      });
    } catch (error) {
      console.error('Error calculating location-based expiry time:', error);
      // Fall back to original calculation method
      if (!expiresAt && startsAt && durationMinutes) {
        expiryTime = new Date(startsAt);
        expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes);
      } else if (expiresAt) {
        expiryTime = new Date(expiresAt);
      }
    }
  } else {
    // Use original method as fallback
    if (!expiresAt && startsAt && durationMinutes) {
      expiryTime = new Date(startsAt);
      expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes);
    } else if (expiresAt) {
      expiryTime = new Date(expiresAt);
    }
  }
  
  if (!expiryTime) {
    return { text: 'Duration unknown', percentLeft: 0 };
  }

  // Now calculate time remaining
  const now = new Date();
  const timeDiff = expiryTime - now;
  
  // If already expired
  if (timeDiff <= 0) {
    return { text: 'Expired', percentLeft: 0 };
  }
  
  // Calculate time remaining in hours/minutes
  const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format text
  let text;
  if (hoursRemaining > 0) {
    text = `${hoursRemaining}h ${minutesRemaining}m left`;
  } else if (minutesRemaining > 0) {
    text = `${minutesRemaining}m left`;
  } else {
    text = 'Ending now';
  }
  
  // Calculate percentage left (assume 3 hours max for percentage calculation)
  // This is just for UI color coding, not critical logic
  const totalDurationMs = durationMinutes ? durationMinutes * 60 * 1000 : 3 * 60 * 60 * 1000;
  const percentLeft = Math.min(100, Math.max(0, (timeDiff / totalDurationMs) * 100));
  
  return { text, percentLeft };
};

const formatAddress = (address) => {
  if (!address) return '';
  
  // Split the address by commas and clean up each part
  const parts = address.split(',').map(part => part.trim());
  
  // If it's a landmark or place name (e.g., "Central Park" or "Times Square")
  if (parts.length > 1 && !parts[0].match(/^\d/)) {
    // Check if first part is a meaningful place name (not just a street)
    if (parts[0].toLowerCase().includes('park') || 
        parts[0].toLowerCase().includes('square') ||
        parts[0].toLowerCase().includes('plaza') ||
        parts[0].toLowerCase().includes('center') ||
        parts[0].toLowerCase().includes('station')) {
      return parts[0];
    }
  }

  // Look for intersection format in any part
  for (const part of parts) {
    if (part.toLowerCase().includes(' and ') || part.includes(' & ')) {
      return part;
    }
  }

  // For street addresses, try to get the most relevant part
  const firstPart = parts[0];
  
  // If it's a numbered street (like "34th Street"), keep it as is
  if (firstPart.match(/^\d+(st|nd|rd|th)/i)) {
    return firstPart;
  }

  // If it starts with a number, try to extract just the street name
  if (firstPart.match(/^\d+/)) {
    const streetMatch = firstPart.match(/\d+\s+(.+)/);
    if (streetMatch) {
      // Check if it's a meaningful street name
      const streetName = streetMatch[1];
      if (streetName.toLowerCase().includes('street') ||
          streetName.toLowerCase().includes('avenue') ||
          streetName.toLowerCase().includes('road') ||
          streetName.toLowerCase().includes('boulevard') ||
          streetName.toLowerCase().includes('lane')) {
        return streetName;
      }
    }
  }

  // For other cases, use the first meaningful part
  // Skip parts that are just numbers (like postal codes) or common administrative divisions
  const skipWords = ['county', 'city', 'state', 'province'];
  for (const part of parts) {
    if (!part.match(/^\d+$/) && // not just a number
        !skipWords.some(word => part.toLowerCase().includes(word)) && // not an administrative division
        part.length > 1) { // not too short
      return part;
    }
  }

  return firstPart;
};

const MeetupCard = ({ meetup, onClick }) => {
  const [timeInfo, setTimeInfo] = useState(() => {
    return formatTimeRemaining(
      meetup.expires_at, 
      meetup.timezone, 
      meetup.starts_at, 
      meetup.duration_minutes,
      meetup.location
    );
  });
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState(meetup.status);

  useEffect(() => {
    const updateTime = () => {
      // Use the unified formatTimeRemaining function that handles location
      const newTimeInfo = formatTimeRemaining(
        meetup.expires_at, 
        meetup.timezone, 
        meetup.starts_at, 
        meetup.duration_minutes,
        meetup.location
      );
      setTimeInfo(newTimeInfo);
      
      // Check if meetup has expired or is inactive
      const now = new Date();
      let isExpired = false;
      
      // Calculate expiry regardless of which fields are available
      let expiryTime;
      if (meetup.expires_at) {
        expiryTime = new Date(meetup.expires_at);
      } else if (meetup.starts_at && meetup.duration_minutes) {
        expiryTime = new Date(meetup.starts_at);
        expiryTime.setMinutes(expiryTime.getMinutes() + meetup.duration_minutes);
      }
      
      if (expiryTime) {
        isExpired = expiryTime <= now;
      }
      
      const isInactive = meetup.status !== 'active';
      
      if ((isExpired || isInactive) && status === 'active') {
        setStatus(isExpired ? 'expired' : 'inactive');
        // Add fade out animation before hiding
        setTimeout(() => setIsVisible(false), 3000);
      }
      
      return newTimeInfo;
    };

    // Initial update
    updateTime();

    // Update every second
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [meetup.id, meetup.expires_at, meetup.starts_at, meetup.duration_minutes, meetup.timezone, meetup.status, status, meetup.location]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Get the best available address information
  const addressDisplay = formatAddress(meetup.address) || formatAddress(meetup.place_name) || 'Location selected';
  const distanceText = meetup.distance_meters ? formatDistance(meetup.distance_meters) : 'Calculating distance...';

  // Get the bearing text if available
  const getBearingText = (bearing) => {
    if (typeof bearing !== 'number') return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };
  const bearingText = meetup.bearing ? getBearingText(meetup.bearing) : '';

  // Added location-based time formatting for detailed view
  const formatLocalTime = (timestamp) => {
    if (!timestamp) return 'Time not available';
    if (meetup.location && meetup.location.lat && meetup.location.lng) {
      return formatMeetupTime(timestamp, meetup.location.lat, meetup.location.lng);
    }
    return new Date(timestamp).toLocaleTimeString();
  };

  // Create a click handler that passes the meetup location to the parent component
  const handleClick = () => {
    if (onClick && meetup.location && meetup.location.lat && meetup.location.lng) {
      onClick({
        lat: meetup.location.lat,
        lng: meetup.location.lng,
        display_name: meetup.title || 'Meetup Location',
        address: meetup.address || addressDisplay,
        isMeetupLocation: true,
        meetupId: meetup.id
      });
    }
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 meetup-card",
        status === 'expired' || status === 'inactive' ? 'meetup-fade-out' : '',
        meetup.is_within_viewport ? 'border-primary-500' : '',
        "cursor-pointer"
      )}
      data-status={status}
      onClick={handleClick}
    >
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
            <div className="text-sm text-gray-500 truncate">
              {addressDisplay}
            </div>
            {meetup.current_participants > 0 && (
              <div className="text-xs text-blue-600">
                {meetup.current_participants} participant{meetup.current_participants !== 1 ? 's' : ''}
                {meetup.max_participants && ` (max ${meetup.max_participants})`}
              </div>
            )}
          </div>

          {/* Right: Time and Distance */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center justify-end space-x-1.5">
              <FaClock className="text-gray-400 w-3 h-3" />
              <div className={cn(
                'text-sm font-medium',
                status === 'expired' ? 'text-red-500' : 
                status === 'inactive' ? 'text-gray-400' :
                timeInfo.percentLeft <= 5 ? 'text-red-500' :
                timeInfo.percentLeft <= 25 ? 'text-yellow-500' :
                'text-green-600'
              )}>
                {timeInfo.text}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1 flex items-center justify-end space-x-1">
              <FaMapMarkerAlt className="text-blue-500 w-2.5 h-2.5" />
              <span>{distanceText}</span>
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
                  {meetup.starts_at ? (
                    <span>
                      Starts at {formatLocalTime(meetup.starts_at)} 
                      {meetup.duration_minutes && ` (${meetup.duration_minutes} min)`}
                    </span>
                  ) : meetup.expires_at ? (
                    <span>Expires at {formatLocalTime(meetup.expires_at)}</span>
                  ) : (
                    <span>Time details unavailable</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const getSearchRadius = (zoomLevel) => {
  // If no zoom level provided, use a reasonable default
  if (!zoomLevel) return 1;

  // Define fixed radius tiers based on zoom levels
  if (zoomLevel >= 18) return 0.25; // 250m for very close zoom
  if (zoomLevel >= 16) return 1;    // 1km for neighborhood view
  if (zoomLevel >= 14) return 2.5;  // 2.5km for local area
  if (zoomLevel >= 12) return 5;    // 5km for wider area
  if (zoomLevel >= 10) return 10;   // 10km for city view
  if (zoomLevel >= 8) return 25;    // 25km for regional view
  return 50;                        // 50km for very zoomed out view
};

const formatSearchRadius = (radius) => {
  if (radius < 1) {
    return `${(radius * 1000).toFixed(0)}m`;
  } else if (radius < 100) {
    return `${radius.toFixed(1)}km`;
  } else if (radius < 1000) {
    return `${Math.round(radius)}km`;
  } else {
    return `${(radius / 1000).toFixed(1)}Mm`; // Megameters for very large distances
  }
};

const getScaleContext = (zoomLevel) => {
  if (zoomLevel >= 18) return 'on this street';
  if (zoomLevel >= 16) return 'in this neighborhood';
  if (zoomLevel >= 14) return 'in this area';
  if (zoomLevel >= 12) return 'in this city';
  if (zoomLevel >= 10) return 'in this region';
  if (zoomLevel >= 8) return 'in this area';
  return 'in this region';
};

const getActiveCount = (meetups) => {
  if (!meetups || !Array.isArray(meetups)) {
    return 0;
  }
  
  return meetups.filter(m => {
    if (m.status !== 'active') return false;
    
    const now = new Date();
    
    // Handle both legacy and new expiration formats
    if (m.expires_at) {
      return new Date(m.expires_at) > now;
    } else if (m.starts_at && m.duration_minutes) {
      const expiryTime = new Date(m.starts_at);
      expiryTime.setMinutes(expiryTime.getMinutes() + m.duration_minutes);
      return expiryTime > now;
    }
    
    // If we can't determine expiry, assume it's expired
    return false;
  }).length;
};

const NearbyMeetups = ({ meetups, currentLocation, mapZoom = 16, onMeetupClick }) => {
  const [sortedMeetups, setSortedMeetups] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [searchRadius, setSearchRadius] = useState(getSearchRadius(mapZoom));
  const scaleContext = useMemo(() => getScaleContext(mapZoom), [mapZoom]);

  // Update sorted meetups when original meetups change
  useEffect(() => {
    if (!meetups || !Array.isArray(meetups)) {
      setSortedMeetups([]);
      setActiveCount(0);
      return;
    }

    // Filter active meetups and sort by distance
    const active = meetups.filter(m => m && m.status === 'active');
    
    // Sort by distance if available
    const sorted = [...active].sort((a, b) => {
      // Prefer distance_meters if available
      if (a.distance_meters && b.distance_meters) {
        return a.distance_meters - b.distance_meters;
      }
      
      // Fall back to distance field
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      
      // If no distance available, use creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    setSortedMeetups(sorted);
    setActiveCount(active.length);
  }, [meetups]);

  // Update search radius when zoom changes
  useEffect(() => {
    setSearchRadius(getSearchRadius(mapZoom));
  }, [mapZoom]);

  return (
    <div className="nearby-meetups-container">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Nearby Meetups</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-2 py-1 rounded-full ${activeCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {activeCount} {activeCount === 1 ? 'meetup' : 'meetups'}
          </span>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full p-1 hover:bg-gray-200"
            aria-label={isCollapsed ? 'Expand nearby meetups' : 'Collapse nearby meetups'}
          >
            {isCollapsed ? 
              <span className="text-sm font-medium">Show</span> :
              <span className="text-sm font-medium">Hide</span>
            }
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
            <div>
              Showing meetups within {formatSearchRadius(searchRadius)}
            </div>
            <div className="scale-context">{scaleContext}</div>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-auto pr-1">
            {sortedMeetups.length > 0 ? (
              sortedMeetups.map(meetup => (
                <MeetupCard 
                  key={meetup.id} 
                  meetup={meetup}
                  onClick={onMeetupClick}
                />
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                <p>No active meetups nearby</p>
                <p className="text-sm mt-1">Be the first to create one!</p>
              </div>
            )}
          </div>
        </>
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    location: PropTypes.object.isRequired,
    address: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    expires_at: PropTypes.string,
    starts_at: PropTypes.string,
    duration_minutes: PropTypes.number,
    distance: PropTypes.number,
    timezone: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        offset: PropTypes.number,
        dstOffset: PropTypes.number
      })
    ]),
    title: PropTypes.string,
    description: PropTypes.string,
    image_url: PropTypes.string,
    place_name: PropTypes.string,
    is_within_viewport: PropTypes.bool,
    bearing: PropTypes.number,
    current_participants: PropTypes.number,
    max_participants: PropTypes.number,
    distance_meters: PropTypes.number
  }).isRequired,
  onClick: PropTypes.func
};

NearbyMeetups.propTypes = {
  meetups: PropTypes.array.isRequired,
  currentLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  mapZoom: PropTypes.number,
  onMeetupClick: PropTypes.func
};

export default NearbyMeetups;