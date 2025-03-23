import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatDistance } from '../utils/locationUtils';
import { formatRelativeTime } from '../utils/dateUtils';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { useBlockedUsers } from '../context/BlockedUsersContext';

/**
 * Shows a list of nearby users with their distance and status
 * Displays join/leave activity and provides interactions
 */
const NearbyUsersList = ({ onUserSelect }) => {
  const { nearbyUsers = [], chatSettings, currentUserId } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();
  const [activities, setActivities] = useState([]);
  const [expandedUsers, setExpandedUsers] = useState({});
  const activityLogRef = useRef(null);
  const prevNearbyUsersRef = useRef([]);
  
  // Maximum number of activity log entries to keep
  const MAX_ACTIVITY_LOGS = 30;
  
  // Maximum distance to consider users nearby
  const radius = chatSettings?.proximityRadius || 100;
  
  // Track enter/exit events
  useEffect(() => {
    const prevUsers = prevNearbyUsersRef.current;
    const prevUserIds = new Set(prevUsers.map(user => user.id));
    const currentUserIds = new Set(nearbyUsers.map(user => user.id));
    
    // Find users who entered the vicinity
    const entered = nearbyUsers.filter(user => 
      !prevUserIds.has(user.id) && user.id !== currentUserId
    );
    
    // Find users who left the vicinity
    const left = prevUsers.filter(user => 
      !currentUserIds.has(user.id) && user.id !== currentUserId
    );
    
    // Create activity entries
    const newActivities = [
      ...entered.map(user => ({
        id: `enter-${user.id}-${Date.now()}`,
        userId: user.id,
        username: user.username,
        type: 'entered',
        timestamp: new Date(),
        avatarUrl: user.avatarUrl,
        avatarColor: user.avatarColor
      })),
      ...left.map(user => ({
        id: `exit-${user.id}-${Date.now()}`,
        userId: user.id,
        username: user.username,
        type: 'left',
        timestamp: new Date(),
        avatarUrl: user.avatarUrl,
        avatarColor: user.avatarColor
      }))
    ];
    
    if (newActivities.length > 0) {
      setActivities(prev => {
        const combined = [...newActivities, ...prev];
        // Only keep a certain number of activities to avoid memory issues
        return combined.slice(0, MAX_ACTIVITY_LOGS);
      });
    }
    
    // Update ref for next comparison
    prevNearbyUsersRef.current = nearbyUsers;
  }, [nearbyUsers, currentUserId]);
  
  // Scroll to bottom of activity log when new entries are added
  useEffect(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight;
    }
  }, [activities]);
  
  // Toggle expanded state for a user
  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };
  
  // Filter out blocked users and sort by distance
  const getFilteredUsers = () => {
    return nearbyUsers
      .filter(user => user.id !== currentUserId && !isUserBlocked(user.id))
      .filter(user => user.distance <= radius)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  };
  
  const renderUserAvatar = (user) => {
    if (user.avatarUrl) {
      return (
        <img 
          src={user.avatarUrl} 
          alt={`${user.username}'s avatar`}
          className="nearby-user-avatar-img" 
        />
      );
    } else {
      return (
        <div 
          className="nearby-user-avatar-placeholder"
          style={{ backgroundColor: user.avatarColor || '#727cf5' }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
      );
    }
  };
  
  // Render a nearby user entry
  const renderUser = (user) => {
    const isExpanded = expandedUsers[user.id] || false;
    const isAnonymous = user.isAnonymous || false;
    
    return (
      <li 
        key={user.id} 
        className={`nearby-user-item ${isExpanded ? 'expanded' : ''}`}
      >
        <div 
          className="nearby-user-main"
          onClick={() => toggleUserExpanded(user.id)}
        >
          <div className="nearby-user-avatar">
            {renderUserAvatar(user)}
            <div className="nearby-user-status-indicator online" />
          </div>
          
          <div className="nearby-user-info">
            <div className="nearby-user-name">
              {user.username}
              {isAnonymous && <span className="anonymous-badge">Anonymous</span>}
            </div>
            
            <div className="nearby-user-distance">
              {user.distance ? formatDistance(user.distance) : 'Unknown distance'}
            </div>
          </div>
          
          <button 
            className="nearby-user-expand-button"
            aria-label={isExpanded ? 'Show less' : 'Show more'}
            aria-expanded={isExpanded}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                <polyline points="18 15 12 9 6 15"></polyline>
              ) : (
                <polyline points="6 9 12 15 18 9"></polyline>
              )}
            </svg>
          </button>
        </div>
        
        {isExpanded && (
          <div className="nearby-user-details">
            <div className="nearby-user-actions">
              <button 
                className="user-action-button message-button"
                onClick={() => onUserSelect && onUserSelect(user)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Message
              </button>
              
              <button 
                className="user-action-button view-profile-button"
                onClick={() => {
                  // This would open user profile in a real app
                  console.log('View profile for', user.id);
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
              </button>
            </div>
            
            <div className="nearby-user-stats">
              <div className="nearby-user-stat">
                <span className="stat-label">Status:</span>
                <span className="stat-value">Online</span>
              </div>
              <div className="nearby-user-stat">
                <span className="stat-label">Last message:</span>
                <span className="stat-value">
                  {user.lastActivity ? formatRelativeTime(user.lastActivity) : 'Never'}
                </span>
              </div>
            </div>
          </div>
        )}
      </li>
    );
  };
  
  // Render an activity log entry
  const renderActivity = (activity) => {
    let message;
    let iconContent;
    
    switch (activity.type) {
      case 'entered':
        message = `${activity.username} entered the chat`;
        iconContent = (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4CAF50" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        );
        break;
      case 'left':
        message = `${activity.username} left the chat`;
        iconContent = (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#F44336" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        );
        break;
      default:
        message = `${activity.username} activity`;
        iconContent = null;
    }
    
    return (
      <li key={activity.id} className={`activity-item ${activity.type}`}>
        <span className="activity-icon">{iconContent}</span>
        <span className="activity-message">{message}</span>
        <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
      </li>
    );
  };
  
  const filteredUsers = getFilteredUsers();
  
  return (
    <div className="nearby-users-container">
      <div className="nearby-users-header">
        <h3 className="nearby-users-title">
          Nearby Users <span className="user-count">({filteredUsers.length})</span>
        </h3>
        <div className="nearby-users-settings">
          <span className="radius-indicator">Within {radius}m</span>
        </div>
      </div>
      
      {filteredUsers.length > 0 ? (
        <ul className="nearby-users-list">
          {filteredUsers.map(renderUser)}
        </ul>
      ) : (
        <div className="nearby-users-empty">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="15" x2="16" y2="15"></line>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          <p>No users nearby. Keep the app open to discover people as they come into range.</p>
        </div>
      )}
      
      <div className="activity-section">
        <h4 className="activity-title">Recent Activity</h4>
        <div className="activity-log" ref={activityLogRef}>
          {activities.length > 0 ? (
            <ul className="activity-list">
              {activities.map(renderActivity)}
            </ul>
          ) : (
            <p className="activity-empty">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

NearbyUsersList.propTypes = {
  onUserSelect: PropTypes.func
};

export default NearbyUsersList; 