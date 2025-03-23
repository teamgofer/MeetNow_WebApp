import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * NearbyUsersIndicator displays a badge showing how many users are nearby
 * in the proximity chat with different visual styles based on user count.
 * 
 * @param {Object} props Component props
 * @param {Array} props.nearbyUsers Array of nearby user objects
 * @param {number} props.maxDistance Maximum distance considered "nearby" in meters
 * @param {string} props.size Size variant ('small', 'medium', 'large')
 * @param {boolean} props.animateChanges Whether to animate when user count changes
 * @param {Function} props.onClick Optional click handler
 */
const NearbyUsersIndicator = ({
  nearbyUsers = [],
  maxDistance = 100,
  size = 'medium',
  animateChanges = true,
  onClick
}) => {
  const [animation, setAnimation] = useState(false);
  const [prevCount, setPrevCount] = useState(nearbyUsers.length);
  
  // Filter users who are within the maximum distance
  const usersInRange = nearbyUsers.filter(user => 
    user.distance && user.distance <= maxDistance
  );
  
  const userCount = usersInRange.length;
  
  // Determine the visual style based on nearby user count
  let statusClass = 'empty';
  if (userCount >= 10) {
    statusClass = 'many';
  } else if (userCount >= 5) {
    statusClass = 'moderate';
  } else if (userCount > 0) {
    statusClass = 'few';
  }
  
  // Play animation when user count changes
  useEffect(() => {
    if (animateChanges && userCount !== prevCount) {
      setAnimation(true);
      const timer = setTimeout(() => setAnimation(false), 1000);
      setPrevCount(userCount);
      return () => clearTimeout(timer);
    }
  }, [userCount, prevCount, animateChanges]);
  
  // Format text based on user count
  const getUserCountText = () => {
    if (userCount === 0) {
      return 'No nearby users';
    } else if (userCount === 1) {
      return '1 nearby user';
    } else {
      return `${userCount} nearby users`;
    }
  };
  
  return (
    <div 
      className={`
        nearby-users-indicator 
        ${statusClass} 
        ${animation ? 'animating' : ''} 
        size-${size}
      `}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={`Users within ${maxDistance}m of your location`}
    >
      <span className="indicator-icon">
        {userCount === 0 ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="21" y1="11" x2="15" y2="11"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        )}
      </span>
      <span className="indicator-text">{getUserCountText()}</span>
    </div>
  );
};

NearbyUsersIndicator.propTypes = {
  nearbyUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      distance: PropTypes.number
    })
  ),
  maxDistance: PropTypes.number,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animateChanges: PropTypes.bool,
  onClick: PropTypes.func
};

export default NearbyUsersIndicator; 