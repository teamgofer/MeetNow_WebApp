import React from 'react';
import PropTypes from 'prop-types';
import { FaUsers, FaMapMarkerAlt, FaCog, FaTimes } from 'react-icons/fa';
import { useProximityChatContext } from '../context/ProximityChatContext';
import ChatSoundSettings from './ChatSoundSettings';
import '../styles/proximity-chat.css';

/**
 * Header component for the proximity chat, including status information and controls
 */
const ChatHeader = ({ onClose, onSettingsClick, className }) => {
  const { 
    isConnected, 
    nearbyUsers, 
    userLocation,
    chatSettings 
  } = useProximityChatContext();

  return (
    <div className={`proximity-chat-header ${className || ''}`}>
      <div className="chat-header-main">
        <div className="chat-title">
          <h2>Proximity Chat</h2>
          {isConnected && (
            <div className="connection-status connected">
              <span className="status-indicator"></span>
              Connected
            </div>
          )}
          {!isConnected && (
            <div className="connection-status disconnected">
              <span className="status-indicator"></span>
              Disconnected
            </div>
          )}
        </div>

        <div className="chat-controls">
          <ChatSoundSettings compact={true} />
          
          <button 
            className="settings-btn"
            onClick={onSettingsClick}
            aria-label="Open chat settings"
            title="Settings"
          >
            <FaCog />
          </button>
          
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close chat"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {isConnected && (
        <div className="chat-status-bar">
          <div className="status-item nearby-users">
            <FaUsers className="status-icon" />
            <span className="status-value">{Array.isArray(nearbyUsers) ? nearbyUsers.length : 0}</span>
            <span className="status-label">Nearby</span>
          </div>

          {userLocation && (
            <div className="status-item location">
              <FaMapMarkerAlt className="status-icon" />
              <span className="status-value">
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </span>
            </div>
          )}

          <div className="status-item range">
            <span className="status-value">
              {(chatSettings.maxDistance / 1000).toFixed(1)} km
            </span>
            <span className="status-label">Range</span>
          </div>
        </div>
      )}
    </div>
  );
};

ChatHeader.propTypes = {
  /** Function to call when the close button is clicked */
  onClose: PropTypes.func.isRequired,
  /** Function to call when the settings button is clicked */
  onSettingsClick: PropTypes.func.isRequired,
  /** Additional class names */
  className: PropTypes.string,
};

export default ChatHeader; 