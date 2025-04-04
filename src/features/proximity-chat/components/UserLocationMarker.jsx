import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';

import { PerformanceMonitor } from '../../../utils/PerformanceMonitor';

/**
 * Component for displaying user location markers on the map
 * Supports different privacy modes (exact, approximate, anonymous)
 */
const UserLocationMarker = ({
  user,
  isCurrentUser = false,
  approximateLocation = false,
  anonymousMode = false,
  showLabel = true,
  onClick,
  size = 'medium',
  pulseAnimation = true,
  showAvatar = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const renderStartTimeRef = useRef(Date.now());

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerInit', duration, {
      success: true,
      isCurrentUser,
      approximateLocation,
      anonymousMode,
      size,
      hasAvatar: !!user.avatar,
    });
  }, []);

  // Track hover state changes
  useEffect(() => {
    if (isHovered) {
      PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerHover', 0, {
        success: true,
        isCurrentUser,
        anonymousMode,
      });
    }
  }, [isHovered, isCurrentUser, anonymousMode]);

  // Size values based on the size prop
  const getSizeValues = () => {
    const startTime = Date.now();
    const values = (() => {
      switch (size) {
        case 'small':
          return {
            marker: 24,
            avatar: 18,
            pulse: 40,
            fontSize: 10,
          };
        case 'large':
          return {
            marker: 40,
            avatar: 32,
            pulse: 60,
            fontSize: 14,
          };
        case 'medium':
        default:
          return {
            marker: 32,
            avatar: 24,
            pulse: 50,
            fontSize: 12,
          };
      }
    })();

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerSizeCalc', duration, {
      success: true,
      size,
      values,
    });

    return values;
  };

  const sizeValues = getSizeValues();

  // Color for the marker based on user status
  const getMarkerColor = () => {
    const startTime = Date.now();
    const color = (() => {
      if (isCurrentUser) {
        return 'var(--primary-color, #1976D2)';
      }

      if (anonymousMode) {
        return '#9E9E9E';
      }

      if (user.isActive) {
        return '#4CAF50';
      }

      return '#FF9800';
    })();

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerColorCalc', duration, {
      success: true,
      isCurrentUser,
      anonymousMode,
      isActive: user.isActive,
      color,
    });

    return color;
  };

  // Render anonymous marker or avatar
  const renderMarkerContent = () => {
    const startTime = Date.now();
    const content = (() => {
      if (anonymousMode || !showAvatar) {
        // Anonymous marker is just a colored circle
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: getMarkerColor(),
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: sizeValues.fontSize,
              fontWeight: 'bold',
            }}
          >
            {isCurrentUser ? 'Me' : ''}
          </div>
        );
      }

      // Avatar with border for online status
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${getMarkerColor()}`,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username || 'User'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onLoad={() => {
                PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerAvatarLoad', 0, {
                  success: true,
                  isCurrentUser,
                  hasUsername: !!user.username,
                });
              }}
              onError={error => {
                PerformanceMonitor.trackError('map', 'userLocationMarkerAvatarLoad', error);
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: getMarkerColor(),
                color: '#fff',
                fontSize: sizeValues.fontSize,
                fontWeight: 'bold',
              }}
            >
              {user.username ? user.username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
      );
    })();

    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerRender', duration, {
      success: true,
      isAnonymous: anonymousMode,
      showAvatar,
      hasAvatar: !!user.avatar,
    });

    return content;
  };

  return (
    <div
      className={`user-location-marker ${isCurrentUser ? 'current-user' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isHovered ? 3 : isCurrentUser ? 2 : 1,
      }}
      onClick={() => {
        const startTime = Date.now();
        if (onClick) {
          onClick();
          const duration = Date.now() - startTime;
          PerformanceMonitor.trackOperationTiming('map', 'userLocationMarkerClick', duration, {
            success: true,
            isCurrentUser,
            anonymousMode,
          });
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={anonymousMode ? 'Anonymous user' : user.username || 'User'}
      tabIndex={0}
    >
      {/* Position indicator dot if location is approximate */}
      {approximateLocation && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sizeValues.marker * 1.6,
            height: sizeValues.marker * 1.6,
            borderRadius: '50%',
            backgroundColor: getMarkerColor(),
            opacity: 0.2,
            zIndex: -1,
          }}
        />
      )}

      {/* Pulse animation */}
      {pulseAnimation && user.isActive && !anonymousMode && (
        <div
          className="location-marker-pulse"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: sizeValues.pulse,
            height: sizeValues.pulse,
            borderRadius: '50%',
            backgroundColor: getMarkerColor(),
            opacity: 0,
            animation: 'marker-pulse 1.5s infinite ease-out',
            zIndex: -1,
          }}
        />
      )}

      {/* Marker */}
      <div
        className="location-marker"
        style={{
          width: sizeValues.marker,
          height: sizeValues.marker,
          transition: 'all 0.2s ease',
        }}
      >
        {renderMarkerContent()}
      </div>

      {/* Username label */}
      {showLabel && user.username && !anonymousMode && (
        <div
          className={`username-label ${isHovered ? 'visible' : ''}`}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '3px 8px',
            borderRadius: '10px',
            fontSize: sizeValues.fontSize,
            marginBottom: '5px',
            whiteSpace: 'nowrap',
            opacity: isHovered ? 1 : 0.8,
            transition: 'all 0.2s ease',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isCurrentUser ? 'You' : user.username}
        </div>
      )}

      {/* Approximate location indicator */}
      {approximateLocation && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '2px 4px',
            borderRadius: '8px',
            fontSize: sizeValues.fontSize - 2,
            marginTop: '3px',
            whiteSpace: 'nowrap',
            opacity: isHovered ? 1 : 0.6,
          }}
        >
          Approximate
        </div>
      )}
    </div>
  );
};

UserLocationMarker.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
    avatar: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
  isCurrentUser: PropTypes.bool,
  approximateLocation: PropTypes.bool,
  anonymousMode: PropTypes.bool,
  showLabel: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  pulseAnimation: PropTypes.bool,
  showAvatar: PropTypes.bool,
};

export default UserLocationMarker;
