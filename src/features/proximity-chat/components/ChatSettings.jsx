import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';

/**
 * ChatSettings component displays a modal with settings for the proximity chat
 * feature, including proximity radius, anonymous mode, notification settings,
 * and privacy controls.
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the settings panel is open
 * @param {Function} props.onClose Callback to close the settings panel
 * @param {boolean} props.showPrivacyInfo Whether to show privacy information
 */
const ChatSettings = ({
  isOpen,
  onClose,
  showPrivacyInfo = true
}) => {
  const { chatSettings, updateChatSettings } = useProximityChatContext();
  const [activeTab, setActiveTab] = useState('general');
  
  // Create a local copy of settings to work with
  const [localSettings, setLocalSettings] = useState({...chatSettings});
  
  if (!isOpen) return null;
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setLocalSettings({
      ...localSettings,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    });
  };
  
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings({
      ...localSettings,
      [name]: parseInt(value, 10)
    });
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleSave = () => {
    updateChatSettings(localSettings);
    onClose();
  };
  
  const handleReset = () => {
    // Reset to default settings
    const defaultSettings = {
      proximityRadius: 100,
      anonymousMode: false,
      notificationsEnabled: true,
      autoScroll: true,
      showDistance: true,
      showTimestamps: true,
      maxMessagesShown: 50
    };
    
    setLocalSettings(defaultSettings);
    // Don't save automatically - user must click Save
  };
  
  const renderGeneralTab = () => (
    <div className="settings-content">
      <div className="setting-group">
        <label htmlFor="proximityRadius">Proximity Radius</label>
        <div className="radius-control">
          <input
            type="range"
            id="proximityRadius"
            name="proximityRadius"
            min="10"
            max="500"
            step="10"
            value={localSettings.proximityRadius}
            onChange={handleSliderChange}
          />
          <span className="radius-value">{localSettings.proximityRadius}m</span>
        </div>
        <div className="setting-description">
          Only receive messages from users within this distance
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="anonymousMode">Anonymous Mode</label>
        <div className="toggle-control">
          <button
            id="anonymousMode"
            className={`toggle-button ${localSettings.anonymousMode ? 'on' : 'off'}`}
            onClick={() => setLocalSettings({
              ...localSettings,
              anonymousMode: !localSettings.anonymousMode
            })}
            aria-pressed={localSettings.anonymousMode}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">
            {localSettings.anonymousMode ? 'On' : 'Off'}
          </span>
        </div>
        <div className="setting-description">
          Hide your identity when sending messages
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="notificationsEnabled">Notifications</label>
        <div className="toggle-control">
          <button
            id="notificationsEnabled"
            className={`toggle-button ${localSettings.notificationsEnabled ? 'on' : 'off'}`}
            onClick={() => setLocalSettings({
              ...localSettings,
              notificationsEnabled: !localSettings.notificationsEnabled
            })}
            aria-pressed={localSettings.notificationsEnabled}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">
            {localSettings.notificationsEnabled ? 'On' : 'Off'}
          </span>
        </div>
        <div className="setting-description">
          Receive notifications for new messages
        </div>
      </div>
      
      <button className="reset-button" onClick={handleReset}>
        Reset to Defaults
      </button>
    </div>
  );
  
  const renderDisplayTab = () => (
    <div className="settings-content">
      <div className="setting-group">
        <label htmlFor="autoScroll">Auto-scroll to New Messages</label>
        <div className="toggle-control">
          <button
            id="autoScroll"
            className={`toggle-button ${localSettings.autoScroll ? 'on' : 'off'}`}
            onClick={() => setLocalSettings({
              ...localSettings,
              autoScroll: !localSettings.autoScroll
            })}
            aria-pressed={localSettings.autoScroll}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">
            {localSettings.autoScroll ? 'On' : 'Off'}
          </span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="showDistance">Show User Distance</label>
        <div className="toggle-control">
          <button
            id="showDistance"
            className={`toggle-button ${localSettings.showDistance ? 'on' : 'off'}`}
            onClick={() => setLocalSettings({
              ...localSettings,
              showDistance: !localSettings.showDistance
            })}
            aria-pressed={localSettings.showDistance}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">
            {localSettings.showDistance ? 'On' : 'Off'}
          </span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="showTimestamps">Show Timestamps</label>
        <div className="toggle-control">
          <button
            id="showTimestamps"
            className={`toggle-button ${localSettings.showTimestamps ? 'on' : 'off'}`}
            onClick={() => setLocalSettings({
              ...localSettings,
              showTimestamps: !localSettings.showTimestamps
            })}
            aria-pressed={localSettings.showTimestamps}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">
            {localSettings.showTimestamps ? 'On' : 'Off'}
          </span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="maxMessagesShown">Maximum Messages Shown</label>
        <div className="radius-control">
          <input
            type="range"
            id="maxMessagesShown"
            name="maxMessagesShown"
            min="10"
            max="200"
            step="10"
            value={localSettings.maxMessagesShown}
            onChange={handleSliderChange}
          />
          <span className="radius-value">{localSettings.maxMessagesShown}</span>
        </div>
        <div className="setting-description">
          Older messages will be removed from view
        </div>
      </div>
    </div>
  );
  
  const renderPrivacyTab = () => (
    <div className="settings-content">
      <div className="setting-group">
        <label>Blocked Users</label>
        {chatSettings.blockedUsers && chatSettings.blockedUsers.length > 0 ? (
          <div className="user-list">
            {chatSettings.blockedUsers.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <img
                    src={user.avatar || '/assets/default-avatar.png'}
                    alt={user.username}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.username}</span>
                </div>
                <button
                  className="mute-button"
                  onClick={() => {
                    const newBlocked = chatSettings.blockedUsers.filter(
                      blocked => blocked.id !== user.id
                    );
                    setLocalSettings({
                      ...localSettings,
                      blockedUsers: newBlocked
                    });
                  }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No blocked users</p>
          </div>
        )}
      </div>
      
      {showPrivacyInfo && (
        <div className="privacy-info">
          <p>
            <strong>Privacy Information:</strong>
          </p>
          <p>
            Your location is only shared when you have the app open and is only
            used to connect you with other nearby users.
          </p>
          <p>
            In anonymous mode, your username and profile picture will not be
            visible to other users, but your messages will still be visible.
          </p>
          <p>
            You can block any user by clicking their avatar and selecting "Block User".
          </p>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="chat-settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Chat Settings</h3>
          <button className="close-button" onClick={onClose} aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => handleTabChange('general')}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => handleTabChange('display')}
          >
            Display
          </button>
          <button
            className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => handleTabChange('privacy')}
          >
            Privacy
          </button>
        </div>
        
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'display' && renderDisplayTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
        
        <div className="settings-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

ChatSettings.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  showPrivacyInfo: PropTypes.bool
};

export default ChatSettings; 