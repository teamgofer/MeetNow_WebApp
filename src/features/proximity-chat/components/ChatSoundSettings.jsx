import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaVolumeUp, FaVolumeMute, FaVolumeDown, FaBell, FaBellSlash } from 'react-icons/fa';
import audioUtils from '../utils/audioUtils';
import '../styles/proximity-chat.css';

/**
 * Component for managing sound notification settings for proximity chat
 */
const ChatSoundSettings = ({ className, compact = false }) => {
  const [preferences, setPreferences] = useState(audioUtils.getAudioPreferences());
  
  // Update local state when preferences change from other components
  useEffect(() => {
    const updatePreferences = () => {
      setPreferences(audioUtils.getAudioPreferences());
    };
    
    // Create custom event listener for preference changes
    window.addEventListener('proximityChat.preferencesChanged', updatePreferences);
    
    return () => {
      window.removeEventListener('proximityChat.preferencesChanged', updatePreferences);
    };
  }, []);
  
  // Update preferences when toggles change
  const handleMasterToggle = () => {
    const newState = audioUtils.toggleMasterSound();
    setPreferences(prev => ({ ...prev, masterEnabled: newState }));
    
    // Play a sound if enabled
    if (newState) {
      audioUtils.testNotificationSound('connected');
    }
  };
  
  const handleSoundTypeToggle = (soundType) => {
    const newState = audioUtils.toggleSoundType(soundType);
    setPreferences(prev => ({ ...prev, [soundType]: newState }));
    
    // Play a test sound if enabled
    if (newState && preferences.masterEnabled) {
      audioUtils.testNotificationSound(soundType);
    }
  };
  
  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    const normalizedVolume = audioUtils.setNotificationVolume(volume);
    setPreferences(prev => ({ ...prev, volume: normalizedVolume }));
    
    // Play a test sound
    if (preferences.masterEnabled) {
      audioUtils.testNotificationSound('newMessage', normalizedVolume);
    }
  };
  
  // Determine volume icon based on level
  const getVolumeIcon = () => {
    if (!preferences.masterEnabled) return FaVolumeMute;
    if (preferences.volume < 0.3) return FaVolumeDown;
    return FaVolumeUp;
  };
  
  const VolumeIcon = getVolumeIcon();
  
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
                  onClick={() => audioUtils.testNotificationSound('newMessage')}
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
                  onClick={() => audioUtils.testNotificationSound('userNearby')}
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
                  onClick={() => audioUtils.testNotificationSound('messageSent')}
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
                  onClick={() => audioUtils.testNotificationSound('typing')}
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
                  onClick={() => audioUtils.testNotificationSound('connected')}
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
                  onClick={() => audioUtils.testNotificationSound('disconnected')}
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