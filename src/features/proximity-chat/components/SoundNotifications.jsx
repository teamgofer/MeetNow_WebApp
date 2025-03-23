import React, { useState, useEffect, useRef } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { createAccessibleButtonProps, generateAccessibleId } from '../utils/accessibilityUtils';

/**
 * Component for managing sound notifications in the proximity chat
 */
const SoundNotifications = () => {
  const { chatSettings, updateChatSettings } = useProximityChatContext();
  const [volume, setVolume] = useState(chatSettings.soundVolume || 0.5);
  const [isMuted, setIsMuted] = useState(!chatSettings.soundEnabled);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const volumeSliderId = useRef(generateAccessibleId('volume')).current;
  const soundToggleId = useRef(generateAccessibleId('toggle')).current;
  
  // Update context settings when local state changes
  useEffect(() => {
    updateChatSettings({
      soundEnabled: !isMuted,
      soundVolume: volume
    });
  }, [volume, isMuted, updateChatSettings]);
  
  // Close settings panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);
  
  const toggleSound = () => {
    setIsMuted(!isMuted);
    
    // Announce status change for screen readers
    const announcer = document.getElementById('sound-status-announcer');
    if (announcer) {
      announcer.textContent = `Sound notifications ${!isMuted ? 'muted' : 'enabled'}`;
    }
  };
  
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // If raising volume from 0, unmute
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    
    // If lowering volume to 0, mute
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };
  
  // Set up accessible button props
  const toggleButtonProps = createAccessibleButtonProps(
    toggleSettings,
    `${isSettingsOpen ? 'Close' : 'Open'} sound settings`
  );
  
  const soundToggleProps = createAccessibleButtonProps(
    toggleSound,
    `${isMuted ? 'Enable' : 'Disable'} sound notifications`
  );
  
  // Determine volume level for icon display
  const getVolumeIcon = () => {
    if (isMuted) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      );
    }
    
    // Using volume to determine icon
    if (volume <= 0.33) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        </svg>
      );
    } else if (volume <= 0.66) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      );
    }
  };
  
  return (
    <div className="sound-notifications-container" ref={settingsRef}>
      <button 
        className="sound-settings-toggle"
        {...toggleButtonProps}
      >
        <span className="sr-only">Sound Settings</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      
      {isSettingsOpen && (
        <div 
          className="sound-settings-panel"
          role="dialog"
          aria-label="Sound notification settings"
        >
          <h4 id="sound-settings-title" className="settings-header">Sound Settings</h4>
          
          <div className="settings-content">
            <div className="sound-toggle-container">
              <label id={soundToggleId} htmlFor="sound-toggle">Sound Notifications</label>
              <button 
                id="sound-toggle"
                className={`sound-toggle-btn ${isMuted ? 'muted' : 'unmuted'}`}
                aria-labelledby={soundToggleId}
                aria-pressed={!isMuted}
                {...soundToggleProps}
              >
                {getVolumeIcon()}
                <span className="sr-only">{isMuted ? 'Enable' : 'Disable'} sound</span>
              </button>
            </div>
            
            <div className="volume-control-container">
              <label id={volumeSliderId} htmlFor="volume-slider">Volume</label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-labelledby={volumeSliderId}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(volume * 100)}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                disabled={isMuted}
              />
              <div className="volume-value">{Math.round(volume * 100)}%</div>
            </div>
          </div>
          
          <div className="settings-footer">
            <button 
              className="close-settings-btn"
              onClick={() => setIsSettingsOpen(false)}
              aria-label="Close sound settings"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden accessibility announcer */}
      <div 
        id="sound-status-announcer" 
        className="sr-only" 
        aria-live="polite"
      ></div>
    </div>
  );
};

export default SoundNotifications; 