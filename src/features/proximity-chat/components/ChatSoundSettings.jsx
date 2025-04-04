import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute, FaVolumeDown, FaBell, FaBellSlash } from 'react-icons/fa';

import audioUtils from '../utils/audioUtils';
import '../styles/proximity-chat.css';
import PerformanceMonitor from '../../../utils/PerformanceMonitor';

/**
 * Component for managing sound notification settings for proximity chat
 */
const ChatSoundSettings = ({ className, compact = false }) => {
  const [preferences, setPreferences] = useState(audioUtils.getAudioPreferences());
  const renderStartTimeRef = useRef(Date.now());

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.track('chat_sound_settings_init', duration, {
      success: true,
      metadata: {
        masterEnabled: preferences.masterEnabled,
        volume: preferences.volume,
        isCompact: compact,
        enabledSoundTypes: Object.entries(preferences)
          .filter(([key, value]) => key !== 'masterEnabled' && key !== 'volume' && value)
          .map(([key]) => key),
      },
    });
  }, []);

  // Update local state when preferences change from other components
  useEffect(() => {
    const updatePreferences = () => {
      const startTime = Date.now();
      const newPreferences = audioUtils.getAudioPreferences();
      setPreferences(newPreferences);

      const duration = Date.now() - startTime;
      PerformanceMonitor.track('chat_sound_settings_update', duration, {
        success: true,
        metadata: {
          masterEnabled: newPreferences.masterEnabled,
          volume: newPreferences.volume,
          isCompact: compact,
          enabledSoundTypes: Object.entries(newPreferences)
            .filter(([key, value]) => key !== 'masterEnabled' && key !== 'volume' && value)
            .map(([key]) => key),
        },
      });
    };

    // Create custom event listener for preference changes
    window.addEventListener('proximityChat.preferencesChanged', updatePreferences);

    return () => {
      window.removeEventListener('proximityChat.preferencesChanged', updatePreferences);
    };
  }, [compact]);

  // Update preferences when toggles change
  const handleMasterToggle = () => {
    const startTime = Date.now();
    const newState = audioUtils.toggleMasterSound();
    setPreferences(prev => ({ ...prev, masterEnabled: newState }));

    // Play a sound if enabled
    if (newState) {
      audioUtils.testNotificationSound('connected');
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.track('chat_sound_settings_master_toggle', duration, {
      success: true,
      metadata: {
        newState,
        volume: preferences.volume,
        isCompact: compact,
      },
    });
  };

  const handleSoundTypeToggle = soundType => {
    const startTime = Date.now();
    const newState = audioUtils.toggleSoundType(soundType);
    setPreferences(prev => ({ ...prev, [soundType]: newState }));

    // Play a test sound if enabled
    if (newState && preferences.masterEnabled) {
      audioUtils.testNotificationSound(soundType);
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.track('chat_sound_settings_type_toggle', duration, {
      success: true,
      metadata: {
        soundType,
        newState,
        masterEnabled: preferences.masterEnabled,
        volume: preferences.volume,
      },
    });
  };

  const handleVolumeChange = e => {
    const startTime = Date.now();
    const volume = parseFloat(e.target.value);
    const normalizedVolume = audioUtils.setNotificationVolume(volume);
    setPreferences(prev => ({ ...prev, volume: normalizedVolume }));

    // Play a test sound
    if (preferences.masterEnabled) {
      audioUtils.testNotificationSound('newMessage', normalizedVolume);
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.track('chat_sound_settings_volume_change', duration, {
      success: true,
      metadata: {
        oldVolume: preferences.volume,
        newVolume: normalizedVolume,
        masterEnabled: preferences.masterEnabled,
        isCompact: compact,
      },
    });
  };

  // Determine volume icon based on level
  const getVolumeIcon = () => {
    const startTime = Date.now();
    let icon;

    if (!preferences.masterEnabled) {
      icon = FaVolumeMute;
    } else if (preferences.volume < 0.3) {
      icon = FaVolumeDown;
    } else {
      icon = FaVolumeUp;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.track('chat_sound_settings_icon_update', duration, {
      success: true,
      metadata: {
        masterEnabled: preferences.masterEnabled,
        volume: preferences.volume,
        iconType: icon.displayName,
      },
    });

    return icon;
  };

  const VolumeIcon = getVolumeIcon();

  // Track test sound playback
  const handleTestSound = soundType => {
    const startTime = Date.now();
    audioUtils.testNotificationSound(soundType);
    const duration = Date.now() - startTime;
    PerformanceMonitor.track('chat_sound_settings_test_sound', duration, {
      success: true,
      metadata: {
        soundType,
        masterEnabled: preferences.masterEnabled,
        volume: preferences.volume,
      },
    });
  };

  // Compact version only shows master toggle and volume
  if (compact) {
    return (
      <div className={`proximity-chat-sound-settings compact ${className || ''}`}>
        <button
          className="sound-toggle-btn"
          onClick={handleMasterToggle}
          aria-label={preferences.masterEnabled ? 'Mute sounds' : 'Unmute sounds'}
          title={preferences.masterEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {preferences.masterEnabled ? <FaBell /> : <FaBellSlash />}
        </button>

        {preferences.masterEnabled && (
          <div className="volume-control">
            <VolumeIcon className="volume-icon" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences.volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              aria-label="Volume control"
            />
          </div>
        )}
      </div>
    );
  }

  // Full settings panel
  return (
    <div className={`proximity-chat-sound-settings ${className || ''}`}>
      <div className="sound-settings-header">
        <h3>Sound Notifications</h3>
        <button
          className="sound-toggle-btn master-toggle"
          onClick={handleMasterToggle}
          aria-label={preferences.masterEnabled ? 'Disable all sounds' : 'Enable all sounds'}
        >
          {preferences.masterEnabled ? <FaBell /> : <FaBellSlash />}
          <span>{preferences.masterEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>

      {preferences.masterEnabled && (
        <>
          <div className="volume-control main-volume">
            <VolumeIcon className="volume-icon" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences.volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              aria-label="Master volume control"
            />
            <span className="volume-percentage">{Math.round(preferences.volume * 100)}%</span>
          </div>

          <div className="sound-type-toggles">
            <div className="sound-type-item">
              <label htmlFor="sound-new-message">New Message</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('newMessage')}
                  aria-label="Test new message sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-new-message"
                    type="checkbox"
                    checked={preferences.newMessage}
                    onChange={() => handleSoundTypeToggle('newMessage')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="sound-type-item">
              <label htmlFor="sound-user-nearby">Nearby User</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('userNearby')}
                  aria-label="Test nearby user sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-user-nearby"
                    type="checkbox"
                    checked={preferences.userNearby}
                    onChange={() => handleSoundTypeToggle('userNearby')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="sound-type-item">
              <label htmlFor="sound-message-sent">Message Sent</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('messageSent')}
                  aria-label="Test message sent sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-message-sent"
                    type="checkbox"
                    checked={preferences.messageSent}
                    onChange={() => handleSoundTypeToggle('messageSent')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="sound-type-item">
              <label htmlFor="sound-typing">Typing</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('typing')}
                  aria-label="Test typing sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-typing"
                    type="checkbox"
                    checked={preferences.typing}
                    onChange={() => handleSoundTypeToggle('typing')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="sound-type-item">
              <label htmlFor="sound-connected">Connected</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('connected')}
                  aria-label="Test connected sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-connected"
                    type="checkbox"
                    checked={preferences.connected}
                    onChange={() => handleSoundTypeToggle('connected')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="sound-type-item">
              <label htmlFor="sound-disconnected">Disconnected</label>
              <div className="toggle-controls">
                <button
                  className="sound-test-btn"
                  onClick={() => handleTestSound('disconnected')}
                  aria-label="Test disconnected sound"
                  title="Test sound"
                >
                  ▶
                </button>
                <label className="toggle-switch">
                  <input
                    id="sound-disconnected"
                    type="checkbox"
                    checked={preferences.disconnected}
                    onChange={() => handleSoundTypeToggle('disconnected')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <button
            className="reset-settings-btn"
            onClick={() => {
              const defaults = audioUtils.resetAudioPreferences();
              setPreferences(defaults);
            }}
            aria-label="Reset sound settings to defaults"
          >
            Reset to Defaults
          </button>
        </>
      )}
    </div>
  );
};

ChatSoundSettings.propTypes = {
  /** Additional class names */
  className: PropTypes.string,
  /** Whether to show a compact version */
  compact: PropTypes.bool,
};

export default ChatSoundSettings;
