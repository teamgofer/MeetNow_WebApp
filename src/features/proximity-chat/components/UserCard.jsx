import React from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import UserBlockControls from './UserBlockControls';
import { distanceConstants } from '../constants';
import { formatDistance } from '../utils/locationUtils';

/**
 * User card component for displaying users in the proximity chat
 * Includes user info, distance, and blocking controls
 */
const UserCard = ({ 
  user, 
  onClick, 
  isSelected = false, 
  showDistance = true,
  showBlockControls = true,
  expanded = false,
  className = '',
}) => {
  const { userLocation } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();
  
  const isBlocked = isUserBlocked(user.id);
  
  // Calculate distance between current user and this user
  const distance = userLocation && user.location ? 
    Math.round(
      Math.sqrt(
        Math.pow(userLocation.latitude - user.location.latitude, 2) + 
        Math.pow(userLocation.longitude - user.location.longitude, 2)
      ) * distanceConstants.METERS_PER_DEGREE
    ) : null;
  
  // Format the distance for display
  const formattedDistance = distance !== null ? formatDistance(distance) : '';
  
  // Handle user card click
  const handleClick = () => {
    if (onClick && !isBlocked) {
      onClick(user);
    }
  };
  
  // Handle user blocked
  const handleUserBlocked = () => {
    // Any additional actions needed when user is blocked
  };
  
  // Handle user unblocked
  const handleUserUnblocked = () => {
    // Any additional actions needed when user is unblocked
  };
  
  return (
    <div 
      className={`user-card ${isSelected ? 'user-card--selected' : ''} ${isBlocked ? 'user-card--blocked' : ''} ${expanded ? 'user-card--expanded' : ''} ${className}`}
      onClick={handleClick}
      aria-selected={isSelected}
      tabIndex={0}
      role="option"
    >
      <div className="user-card__avatar">
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={`${user.username}'s avatar`} 
            className="user-card__avatar-img"
          />
        ) : (
          <div 
            className="user-card__avatar-placeholder"
            style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        {isBlocked && (
          <div className="user-card__blocked-indicator" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M4.93 4.93l14.14 14.14" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="user-card__info">
        <div className="user-card__name-row">
          <h3 className="user-card__username">
            {user.username}
            {user.isAnonymous && (
              <span className="user-card__anonymous-badge" aria-label="Anonymous user">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
                  <path d="M9 12v6" />
                  <path d="M13 12v6" />
                  <path d="M7 8.03V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1.03" />
                  <path d="M5 3L4 7M19 3l1 4" />
                </svg>
              </span>
            )}
          </h3>
          {showDistance && distance !== null && (
            <span className="user-card__distance" aria-label={`${formattedDistance} away`}>
              {formattedDistance}
            </span>
          )}
        </div>
        
        {expanded && user.status && (
          <p className="user-card__status">{user.status}</p>
        )}
        
        {expanded && user.lastActive && (
          <p className="user-card__last-active">
            Last active: {formatRelativeTime(user.lastActive)}
          </p>
        )}
        
        {isBlocked && (
          <p className="user-card__blocked-message" aria-live="polite">
            You've blocked this user
          </p>
        )}
      </div>
      
      {showBlockControls && (
        <div className="user-card__actions" onClick={(e) => e.stopPropagation()}>
          <UserBlockControls 
            userId={user.id}
            username={user.username}
            onBlock={handleUserBlocked}
            onUnblock={handleUserUnblocked}
            compact={!expanded}
          />
        </div>
      )}
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (timestamp) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.round((date - now) / 1000);
  
  // Convert to appropriate time unit
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  } else {
    return rtf.format(Math.round(diffInSeconds / 86400), 'day');
  }
};

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    avatarColor: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number
    }),
    isAnonymous: PropTypes.bool,
    status: PropTypes.string,
    lastActive: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
  showDistance: PropTypes.bool,
  showBlockControls: PropTypes.bool,
  expanded: PropTypes.bool,
  className: PropTypes.string
};

export default UserCard; 