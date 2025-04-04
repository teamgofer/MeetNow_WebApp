import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { DEFAULTS } from '../constants';

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
const ChatSettings = ({ isOpen, onClose, showPrivacyInfo = true }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [radius, setRadius] = useState(DEFAULTS.CHAT_RADIUS);
  const [showNotifications, setShowNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('proximityChat.settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.radius) setRadius(settings.radius);
        if (settings.showNotifications !== undefined)
          setShowNotifications(settings.showNotifications);
        if (settings.anonymousMode !== undefined) setAnonymousMode(settings.anonymousMode);
      } catch (error) {
        console.error('Error parsing saved chat settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  const saveSettings = newSettings => {
    const settings = {
      radius,
      showNotifications,
      anonymousMode,
      ...newSettings,
    };

    localStorage.setItem('proximityChat.settings', JSON.stringify(settings));
    return settings;
  };

  // Handle radius change
  const handleRadiusChange = e => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);

    const settings = saveSettings({ radius: newRadius });
    // onRadiusChange(newRadius);
  };

  // Handle notification toggle
  const handleNotificationsToggle = e => {
    const newValue = e.target.checked;
    setShowNotifications(newValue);
    saveSettings({ showNotifications: newValue });
  };

  // Handle anonymous mode toggle
  const handleAnonymousModeToggle = e => {
    const newValue = e.target.checked;
    setAnonymousMode(newValue);
    saveSettings({ anonymousMode: newValue });
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const handleSave = () => {
    // updateChatSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    // Reset to default settings
    const defaultSettings = {
      radius: DEFAULTS.CHAT_RADIUS,
      showNotifications: true,
      anonymousMode: false,
      ...DEFAULTS.CHAT_SETTINGS,
    };

    setRadius(defaultSettings.radius);
    setShowNotifications(defaultSettings.showNotifications);
    setAnonymousMode(defaultSettings.anonymousMode);
    // Don't save automatically - user must click Save
  };

  const renderGeneralTab = () => (
    <div className="settings-content">
      <div className="setting-group">
        <label
          htmlFor="radius-slider"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Chat Radius: {radius} meters
        </label>
        <input
          id="radius-slider"
          type="range"
          min="50"
          max={DEFAULTS.MAX_CHAT_RADIUS}
          step="50"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>50m</span>
          <span>{DEFAULTS.MAX_CHAT_RADIUS}m</span>
        </div>
      </div>

      <div className="setting-group">
        <label
          htmlFor="notifications-toggle"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Show Notifications
        </label>
        <div className="flex items-center justify-between">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              id="notifications-toggle"
              type="checkbox"
              checked={showNotifications}
              onChange={handleNotificationsToggle}
              className="sr-only"
            />
            <div
              className={`block w-10 h-6 rounded-full ${showNotifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showNotifications ? 'transform translate-x-4' : ''}`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="setting-group">
        <label
          htmlFor="anonymous-toggle"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Anonymous Mode
        </label>
        <div className="flex items-center justify-between">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              id="anonymous-toggle"
              type="checkbox"
              checked={anonymousMode}
              onChange={handleAnonymousModeToggle}
              className="sr-only"
            />
            <div
              className={`block w-10 h-6 rounded-full ${anonymousMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${anonymousMode ? 'transform translate-x-4' : ''}`}
              ></div>
            </div>
          </div>
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
            onClick={() =>
              setLocalSettings({
                ...localSettings,
                autoScroll: !localSettings.autoScroll,
              })
            }
            aria-pressed={localSettings.autoScroll}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">{localSettings.autoScroll ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="setting-group">
        <label htmlFor="showDistance">Show User Distance</label>
        <div className="toggle-control">
          <button
            id="showDistance"
            className={`toggle-button ${localSettings.showDistance ? 'on' : 'off'}`}
            onClick={() =>
              setLocalSettings({
                ...localSettings,
                showDistance: !localSettings.showDistance,
              })
            }
            aria-pressed={localSettings.showDistance}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">{localSettings.showDistance ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="setting-group">
        <label htmlFor="showTimestamps">Show Timestamps</label>
        <div className="toggle-control">
          <button
            id="showTimestamps"
            className={`toggle-button ${localSettings.showTimestamps ? 'on' : 'off'}`}
            onClick={() =>
              setLocalSettings({
                ...localSettings,
                showTimestamps: !localSettings.showTimestamps,
              })
            }
            aria-pressed={localSettings.showTimestamps}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-label">{localSettings.showTimestamps ? 'On' : 'Off'}</span>
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
        <div className="setting-description">Older messages will be removed from view</div>
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
                      blockedUsers: newBlocked,
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
            Your location is only shared when you have the app open and is only used to connect you
            with other nearby users.
          </p>
          <p>
            In anonymous mode, your username and profile picture will not be visible to other users,
            but your messages will still be visible.
          </p>
          <p>You can block any user by clicking their avatar and selecting "Block User".</p>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
  showPrivacyInfo: PropTypes.bool,
};

export default ChatSettings;
