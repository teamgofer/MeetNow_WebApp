import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';

import { calculateChatBubbleSize } from '../utils/mapOverlayUtils';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * Component for visualizing active chat areas on the map
 * Shows an animated bubble with activity indicators
 */
const ChatHotspot = ({
  hotspot,
  onClick,
  isSelected = false,
  showActivityMetrics = true,
  minSize = 25,
  maxSize = 60,
  pulseAnimation = true,
  theme = 'default',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate the bubble size based on activity
  const bubbleSize = useMemo(() => {
    const activity = {
      messageCount: hotspot.messageCount || 0,
      uniqueUsers: hotspot.uniqueUserCount || 0,
      recentActivity: hotspot.recentActivity || 0,
    };

    return calculateChatBubbleSize(activity, { minSize, maxSize });
  }, [hotspot, minSize, maxSize]);

  // Determine the color based on activity level
  const getBubbleColor = () => {
    const { messageCount = 0, activeUserCount = 0 } = hotspot;

    if (isSelected) {
      return 'var(--primary-color)';
    }

    if (activeUserCount > 5 || messageCount > 30) {
      return '#FF5722'; // High activity
    } else if (activeUserCount > 2 || messageCount > 10) {
      return '#FFC107'; // Medium activity
    } else {
      return '#4CAF50'; // Low activity
    }
  };

  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'minimal':
        return {
          bubble: {
            opacity: 0.7,
            border: 'none',
          },
          inner: {
            display: 'none',
          },
          pulse: {
            opacity: 0.3,
          },
        };
      case 'detailed':
        return {
          bubble: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
          inner: {
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
          },
          pulse: {
            animationDuration: '2s',
          },
        };
      default:
        return {};
    }
  };

  const themeStyles = getThemeStyles();
  const bubbleColor = getBubbleColor();

  return (
    <div
      className={`chat-hotspot ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isSelected || isHovered ? 2 : 1,
        ...themeStyles.bubble,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={`Chat hotspot with ${hotspot.messageCount} messages and ${hotspot.activeUserCount} active users`}
      tabIndex={0}
    >
      {/* Pulse animation */}
      {pulseAnimation && (hotspot.activeUserCount > 0 || hotspot.recentActivity > 0.3) && (
        <div
          className="hotspot-pulse"
          style={{
            position: 'absolute',
            width: bubbleSize * 2.5,
            height: bubbleSize * 2.5,
            borderRadius: '50%',
            backgroundColor: bubbleColor,
            opacity: 0,
            animation: 'hotspot-pulse 2s infinite ease-out',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: -1,
            ...themeStyles.pulse,
          }}
        />
      )}

      {/* Main bubble */}
      <div
        className="hotspot-bubble"
        style={{
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: '50%',
          backgroundColor: bubbleColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: Math.max(12, bubbleSize / 3),
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          boxSizing: 'border-box',
        }}
      >
        {/* Inner circle showing message count */}
        <div
          className="hotspot-inner"
          style={{
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...themeStyles.inner,
          }}
        >
          {hotspot.activeUserCount > 0 ? hotspot.activeUserCount : ''}
        </div>
      </div>

      {/* Activity tooltip (shown on hover or selection) */}
      {showActivityMetrics && (isHovered || isSelected) && (
        <div
          className="hotspot-tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <strong>Active Conversation</strong>
            </div>
            <div className="tooltip-metrics">
              <div className="tooltip-metric">
                <span>Messages:</span> <strong>{hotspot.messageCount}</strong>
              </div>
              <div className="tooltip-metric">
                <span>Users:</span> <strong>{hotspot.uniqueUserCount}</strong>
              </div>
              <div className="tooltip-metric">
                <span>Active now:</span> <strong>{hotspot.activeUserCount}</strong>
              </div>
              {hotspot.lastMessage && (
                <div className="tooltip-metric">
                  <span>Last activity:</span>{' '}
                  <strong>{formatRelativeTime(hotspot.lastMessage.timestamp)}</strong>
                </div>
              )}
            </div>
            {hotspot.activeUserCount > 0 && (
              <div className="tooltip-join">Click to join conversation</div>
            )}
          </div>
          <div
            className="tooltip-arrow"
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 0, 0, 0.8)',
            }}
          />
        </div>
      )}
    </div>
  );
};

ChatHotspot.propTypes = {
  hotspot: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    messageCount: PropTypes.number,
    uniqueUserCount: PropTypes.number,
    recentMessageCount: PropTypes.number,
    activeUserCount: PropTypes.number,
    recentActivity: PropTypes.number,
    radius: PropTypes.number,
    lastMessage: PropTypes.object,
  }).isRequired,
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
  showActivityMetrics: PropTypes.bool,
  minSize: PropTypes.number,
  maxSize: PropTypes.number,
  pulseAnimation: PropTypes.bool,
  theme: PropTypes.oneOf(['default', 'minimal', 'detailed']),
};

export default ChatHotspot;
