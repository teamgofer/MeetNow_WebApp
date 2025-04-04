import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useBlockedUsers } from '../context/BlockedUsersContext';
import { useProximityChatContext } from '../context/ProximityChatContext';
import {
  identifyChatHotspots,
  getUserMarkerConfig,
  calculateMapBounds,
} from '../utils/mapOverlayUtils';

import ChatHotspot from './ChatHotspot';
import UserLocationMarker from './UserLocationMarker';
import '../style/mapComponentStyles.css';

/**
 * ProximityChatMap component - Displays a map with chat hotspots and user locations
 */
const ProximityChatMap = ({
  mapProvider = 'leaflet', // 'leaflet', 'google', or 'custom'
  initialZoom = 15,
  showControls = true,
  showLegend = true,
  centerOnUser = true,
  height = '400px',
  width = '100%',
  messagePreview = true,
  onHotspotSelect,
  onUserSelect,
  className = '',
}) => {
  const { messages, nearbyUsers, userLocation, currentUserId, chatSettings, updateUserLocation } =
    useProximityChatContext();

  const { isUserBlocked } = useBlockedUsers();

  // State
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [mapMode, setMapMode] = useState('default'); // 'default', 'heatmap', 'satellite'

  const mapContainerRef = useRef(null);
  const markersRef = useRef({
    users: new Map(),
    hotspots: new Map(),
  });

  // Initialize the map
  useEffect(() => {
    let map = null;

    const initMap = async () => {
      setIsLoading(true);

      try {
        // Different initialization based on map provider
        if (mapProvider === 'leaflet') {
          // For actual implementation, you'd import and use the leaflet library
          // This is a simplified mock implementation
          map = {
            setView: (center, zoom) => {},
            on: (event, handler) => {},
            remove: () => {},
            addLayer: layer => {},
            removeLayer: layer => {},
            fitBounds: bounds => {},
          };
        } else if (mapProvider === 'google') {
          // Mock Google Maps implementation
          map = {
            setCenter: center => {},
            setZoom: zoom => {},
            addListener: (event, handler) => {},
            getBounds: () => {},
          };
        } else {
          // Custom map provider
          map = {
            // Custom map methods
          };
        }

        setMapInstance(map);
        setIsLoading(false);

        // Initial view centered on user if location is available
        if (userLocation && centerOnUser) {
          if (mapProvider === 'leaflet') {
            map.setView([userLocation.latitude, userLocation.longitude], initialZoom);
          } else if (mapProvider === 'google') {
            map.setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
            map.setZoom(initialZoom);
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoading(false);
      }
    };

    if (mapContainerRef.current && !mapInstance) {
      initMap();
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        if (mapProvider === 'leaflet') {
          mapInstance.remove();
        }
        // Other provider-specific cleanup
      }
    };
  }, [mapProvider, initialZoom, centerOnUser, userLocation]);

  // Calculate hotspots when messages or users change
  useEffect(() => {
    if (!messages || !Array.isArray(messages)) return;

    const options = {
      clusterRadius: 50,
      timeWindowMinutes: 30,
      minimumMessageCount: 1,
    };

    // Filter out messages from blocked users
    const filteredMessages = messages.filter(msg => !isUserBlocked(msg.senderId));

    const detectedHotspots = identifyChatHotspots(filteredMessages, nearbyUsers, options);

    setHotspots(detectedHotspots);
  }, [messages, nearbyUsers, isUserBlocked]);

  // Update map markers when hotspots or users change
  useEffect(() => {
    if (!mapInstance) return;

    // In a real implementation, you would create actual map markers here
    // This is just tracking what markers would be created
    const userMarkers = new Map();
    const hotspotMarkers = new Map();

    // Add user markers
    if (nearbyUsers && Array.isArray(nearbyUsers)) {
      nearbyUsers.forEach(user => {
        if (isUserBlocked(user.id)) return;

        const privacySettings =
          user.id === currentUserId ? chatSettings.privacy || {} : user.privacySettings || {};

        const markerConfig = getUserMarkerConfig(user, privacySettings);

        if (markerConfig) {
          userMarkers.set(user.id, {
            user,
            config: markerConfig,
          });
        }
      });
    }

    // Add hotspot markers
    if (hotspots && Array.isArray(hotspots)) {
      hotspots.forEach((hotspot, index) => {
        hotspotMarkers.set(`hotspot-${index}`, {
          hotspot,
          selected:
            selectedHotspot &&
            selectedHotspot.latitude === hotspot.latitude &&
            selectedHotspot.longitude === hotspot.longitude,
        });
      });
    }

    // In a real implementation, you would now update the actual map markers
    markersRef.current = {
      users: userMarkers,
      hotspots: hotspotMarkers,
    };

    // If we should center on a selected item
    if (selectedHotspot || (centerOnUser && userLocation)) {
      const centerPoint = selectedHotspot || userLocation;

      if (mapProvider === 'leaflet') {
        mapInstance.setView([centerPoint.latitude, centerPoint.longitude], initialZoom);
      } else if (mapProvider === 'google') {
        mapInstance.setCenter({ lat: centerPoint.latitude, lng: centerPoint.longitude });
      }
    }

    // Auto-fit bounds if needed
    if (!centerOnUser && !selectedHotspot && (userMarkers.size > 0 || hotspotMarkers.size > 0)) {
      // Gather all points to include in bounds
      const points = [];

      userMarkers.forEach(marker => {
        points.push(marker.config.location);
      });

      hotspotMarkers.forEach(marker => {
        points.push(marker.hotspot);
      });

      if (points.length > 0) {
        const bounds = calculateMapBounds(points, 15);

        if (bounds && mapProvider === 'leaflet') {
          mapInstance.fitBounds([
            [bounds.sw.lat, bounds.sw.lng],
            [bounds.ne.lat, bounds.ne.lng],
          ]);
        }
      }
    }
  }, [
    mapInstance,
    nearbyUsers,
    hotspots,
    selectedHotspot,
    userLocation,
    chatSettings,
    currentUserId,
    isUserBlocked,
    centerOnUser,
    mapProvider,
    initialZoom,
  ]);

  // Handle hotspot click
  const handleHotspotClick = useCallback(
    hotspot => {
      setSelectedHotspot(hotspot);
      if (onHotspotSelect) {
        onHotspotSelect(hotspot);
      }
    },
    [onHotspotSelect]
  );

  // Handle user marker click
  const handleUserClick = useCallback(
    user => {
      setSelectedUser(user);
      if (onUserSelect) {
        onUserSelect(user);
      }
    },
    [onUserSelect]
  );

  // Handle map mode change
  const handleMapModeChange = mode => {
    setMapMode(mode);
  };

  // Render map controls
  const renderMapControls = () => {
    if (!showControls) return null;

    return (
      <div className="map-controls">
        <button
          className={`map-control-button ${mapMode === 'default' ? 'active' : ''}`}
          onClick={() => handleMapModeChange('default')}
          aria-label="Default map view"
          title="Default map view"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </button>
        <button
          className={`map-control-button ${mapMode === 'satellite' ? 'active' : ''}`}
          onClick={() => handleMapModeChange('satellite')}
          aria-label="Satellite view"
          title="Satellite view"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        </button>
        <button
          className={`map-control-button ${mapMode === 'heatmap' ? 'active' : ''}`}
          onClick={() => handleMapModeChange('heatmap')}
          aria-label="Heat map view"
          title="Heat map view"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
          >
            <path d="M12 2v6.5l2.5-2.5 2.5 2.5V2"></path>
            <path d="M16 16.5c0 1-1.8 3-4 3s-4-2-4-3c0-2 2-2.5 4-4.5 2 2 4 2.5 4 4.5z"></path>
            <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"></path>
          </svg>
        </button>
        {userLocation && (
          <button
            className="map-control-button"
            onClick={() => {
              if (mapProvider === 'leaflet' && mapInstance) {
                mapInstance.setView([userLocation.latitude, userLocation.longitude], initialZoom);
              }
            }}
            aria-label="Center on me"
            title="Center on me"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        )}
      </div>
    );
  };

  // Render map legend
  const renderMapLegend = () => {
    if (!showLegend) return null;

    return (
      <div className="map-legend">
        <div className="legend-title">Map Legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker hotspot"></div>
            <span>Active Chat Area</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker user"></div>
            <span>Your Location</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker anonymous"></div>
            <span>Anonymous User</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker approximate"></div>
            <span>Approximate Location</span>
          </div>
        </div>
      </div>
    );
  };

  // Render a mock preview of the map with hotspots and users
  const renderMockMap = () => {
    return (
      <div
        className="proximity-map-content"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: mapMode === 'satellite' ? '#333' : '#f0f0f0',
        }}
      >
        {/* Render hotspots */}
        {Array.from(markersRef.current.hotspots.entries()).map(([id, data]) => {
          const { hotspot, selected } = data;
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
              }}
            >
              <ChatHotspot
                hotspot={hotspot}
                isSelected={selected}
                onClick={() => handleHotspotClick(hotspot)}
                showActivityMetrics={true}
                pulseAnimation={true}
                theme={mapMode === 'satellite' ? 'detailed' : 'default'}
              />
            </div>
          );
        })}

        {/* Render user markers */}
        {Array.from(markersRef.current.users.entries()).map(([id, data]) => {
          const { user, config } = data;
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
              }}
            >
              <UserLocationMarker
                user={user}
                isCurrentUser={config.isCurrentUser}
                approximateLocation={config.approximateLocation}
                anonymousMode={config.anonymous}
                showLabel={config.showLabel}
                onClick={() => handleUserClick(user)}
                pulseAnimation={true}
                showAvatar={!!config.avatar}
              />
            </div>
          );
        })}

        {/* Preview message */}
        {previewMessage && (
          <div
            className="map-message-bubble"
            style={{
              left: `${Math.random() * 60 + 20}%`,
              top: `${Math.random() * 60 + 20}%`,
            }}
          >
            <div className="message-bubble-sender">{previewMessage.sender.username}</div>
            <div className="message-bubble-content">{previewMessage.content}</div>
            <div className="message-bubble-timestamp">Just now</div>
            <div className="message-bubble-arrow"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`proximity-chat-map ${className}`}
      style={{ height, width }}
      ref={mapContainerRef}
    >
      {isLoading ? (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
        </div>
      ) : (
        <>
          {renderMockMap()}
          {renderMapControls()}
          {renderMapLegend()}
        </>
      )}
    </div>
  );
};

ProximityChatMap.propTypes = {
  mapProvider: PropTypes.oneOf(['leaflet', 'google', 'custom']),
  initialZoom: PropTypes.number,
  showControls: PropTypes.bool,
  showLegend: PropTypes.bool,
  centerOnUser: PropTypes.bool,
  height: PropTypes.string,
  width: PropTypes.string,
  messagePreview: PropTypes.bool,
  onHotspotSelect: PropTypes.func,
  onUserSelect: PropTypes.func,
  className: PropTypes.string,
};

export default ProximityChatMap;
