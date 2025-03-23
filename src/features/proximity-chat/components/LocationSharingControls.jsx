import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';
import { formatDistance } from '../utils/locationUtils';

/**
 * Component for controlling location sharing settings in the proximity chat
 * Provides granular controls for location sharing preferences
 */
const LocationSharingControls = ({ onUpdate }) => {
  const { chatSettings, updateLocationSharing } = useProximityChatContext();
  
  const [locationSettings, setLocationSettings] = useState({
    isEnabled: true,
    precisionLevel: 'exact', // 'exact', 'approximate', 'area'
    sharingSchedule: 'always', // 'always', 'custom'
    customSchedule: {
      startTime: '09:00',
      endTime: '21:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // All days by default
    },
    autoDisableWhenInactive: true,
    inactivityTimeout: 30, // minutes
    excludedUsers: []
  });
  
  // Initialize settings from context
  useEffect(() => {
    if (chatSettings && chatSettings.locationSharing) {
      setLocationSettings(chatSettings.locationSharing);
    }
  }, [chatSettings]);
  
  // Update the context when settings change
  const handleSettingsSave = async () => {
    await updateLocationSharing(locationSettings);
    
    if (onUpdate) {
      onUpdate(locationSettings);
    }
  };
  
  // Toggle location sharing on/off
  const toggleLocationSharing = () => {
    setLocationSettings(prev => {
      const updated = {
        ...prev,
        isEnabled: !prev.isEnabled
      };
      return updated;
    });
  };
  
  // Change precision level
  const handlePrecisionChange = (level) => {
    setLocationSettings(prev => ({
      ...prev,
      precisionLevel: level
    }));
  };
  
  // Update sharing schedule
  const handleScheduleChange = (schedule) => {
    setLocationSettings(prev => ({
      ...prev,
      sharingSchedule: schedule
    }));
  };
  
  // Toggle auto-disable when inactive
  const toggleAutoDisable = () => {
    setLocationSettings(prev => ({
      ...prev,
      autoDisableWhenInactive: !prev.autoDisableWhenInactive
    }));
  };
  
  // Update inactivity timeout
  const handleTimeoutChange = (e) => {
    const timeout = parseInt(e.target.value, 10);
    if (!isNaN(timeout) && timeout >= 5) {
      setLocationSettings(prev => ({
        ...prev,
        inactivityTimeout: timeout
      }));
    }
  };
  
  // Update custom schedule times
  const handleTimeChange = (field, value) => {
    setLocationSettings(prev => ({
      ...prev,
      customSchedule: {
        ...prev.customSchedule,
        [field]: value
      }
    }));
  };
  
  // Toggle days of week for custom schedule
  const toggleDayOfWeek = (day) => {
    setLocationSettings(prev => {
      const daysOfWeek = [...prev.customSchedule.daysOfWeek];
      const index = daysOfWeek.indexOf(day);
      
      if (index >= 0) {
        daysOfWeek.splice(index, 1);
      } else {
        daysOfWeek.push(day);
        daysOfWeek.sort();
      }
      
      return {
        ...prev,
        customSchedule: {
          ...prev.customSchedule,
          daysOfWeek
        }
      };
    });
  };
  
  // Get explanation for current precision level
  const getPrecisionDescription = () => {
    switch (locationSettings.precisionLevel) {
      case 'exact':
        return 'Your precise location will be shared (within a few meters)';
      case 'approximate':
        return 'Your approximate location will be shared (within 100 meters)';
      case 'area':
        return 'Only your general area will be shared (neighborhood level)';
      default:
        return '';
    }
  };
  
  // Save settings when changing important settings
  useEffect(() => {
    handleSettingsSave();
  }, [locationSettings.isEnabled, locationSettings.precisionLevel]);
  
  return (
    <div className="location-sharing-controls">
      <div className="location-sharing-header">
        <h3 className="location-sharing-title">Location Sharing</h3>
        <div className="toggle-control">
          <button
            className={`location-toggle-button ${locationSettings.isEnabled ? 'on' : 'off'}`}
            onClick={toggleLocationSharing}
            {...createAccessibleButtonProps(
              toggleLocationSharing,
              `${locationSettings.isEnabled ? 'Disable' : 'Enable'} location sharing`
            )}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className="toggle-status">
            {locationSettings.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      <div className={`location-controls-content ${!locationSettings.isEnabled ? 'disabled' : ''}`}>
        <section className="location-control-section">
          <h4 className="control-section-title">Precision Level</h4>
          <div className="precision-controls">
            <div className="radio-control">
              <input
                type="radio"
                id="precision-exact"
                name="precision"
                value="exact"
                checked={locationSettings.precisionLevel === 'exact'}
                onChange={() => handlePrecisionChange('exact')}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="precision-exact">Exact</label>
            </div>
            <div className="radio-control">
              <input
                type="radio"
                id="precision-approximate"
                name="precision"
                value="approximate"
                checked={locationSettings.precisionLevel === 'approximate'}
                onChange={() => handlePrecisionChange('approximate')}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="precision-approximate">Approximate</label>
            </div>
            <div className="radio-control">
              <input
                type="radio"
                id="precision-area"
                name="precision"
                value="area"
                checked={locationSettings.precisionLevel === 'area'}
                onChange={() => handlePrecisionChange('area')}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="precision-area">General Area</label>
            </div>
          </div>
          <div className="precision-description">{getPrecisionDescription()}</div>
        </section>
        
        <section className="location-control-section">
          <h4 className="control-section-title">Sharing Schedule</h4>
          <div className="schedule-controls">
            <div className="radio-control">
              <input
                type="radio"
                id="schedule-always"
                name="schedule"
                value="always"
                checked={locationSettings.sharingSchedule === 'always'}
                onChange={() => handleScheduleChange('always')}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="schedule-always">Always share when online</label>
            </div>
            <div className="radio-control">
              <input
                type="radio"
                id="schedule-custom"
                name="schedule"
                value="custom"
                checked={locationSettings.sharingSchedule === 'custom'}
                onChange={() => handleScheduleChange('custom')}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="schedule-custom">Custom schedule</label>
            </div>
            
            {locationSettings.sharingSchedule === 'custom' && (
              <div className="custom-schedule-controls">
                <div className="time-range">
                  <div className="time-input">
                    <label htmlFor="start-time">Start Time</label>
                    <input
                      type="time"
                      id="start-time"
                      value={locationSettings.customSchedule.startTime}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      disabled={!locationSettings.isEnabled}
                    />
                  </div>
                  <div className="time-input">
                    <label htmlFor="end-time">End Time</label>
                    <input
                      type="time"
                      id="end-time"
                      value={locationSettings.customSchedule.endTime}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      disabled={!locationSettings.isEnabled}
                    />
                  </div>
                </div>
                
                <div className="days-of-week">
                  <span className="days-label">Days of the week:</span>
                  <div className="day-toggles">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={index}
                        className={`day-toggle ${locationSettings.customSchedule.daysOfWeek.includes(index) ? 'selected' : ''}`}
                        onClick={() => toggleDayOfWeek(index)}
                        disabled={!locationSettings.isEnabled}
                        {...createAccessibleButtonProps(
                          () => toggleDayOfWeek(index),
                          `Toggle ${day}`
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        
        <section className="location-control-section">
          <h4 className="control-section-title">Auto-Disable</h4>
          <div className="auto-disable-controls">
            <div className="checkbox-control">
              <input
                type="checkbox"
                id="auto-disable"
                checked={locationSettings.autoDisableWhenInactive}
                onChange={toggleAutoDisable}
                disabled={!locationSettings.isEnabled}
              />
              <label htmlFor="auto-disable">
                Automatically disable location sharing when inactive
              </label>
            </div>
            
            {locationSettings.autoDisableWhenInactive && (
              <div className="timeout-control">
                <label htmlFor="inactivity-timeout">
                  Disable after inactivity for
                </label>
                <input
                  type="number"
                  id="inactivity-timeout"
                  min="5"
                  max="240"
                  value={locationSettings.inactivityTimeout}
                  onChange={handleTimeoutChange}
                  disabled={!locationSettings.isEnabled}
                />
                <span className="timeout-unit">minutes</span>
              </div>
            )}
          </div>
        </section>
        
        <div className="location-sharing-actions">
          <button
            className="save-settings-button"
            onClick={handleSettingsSave}
            disabled={!locationSettings.isEnabled}
            {...createAccessibleButtonProps(
              handleSettingsSave,
              'Save location sharing settings'
            )}
          >
            Save Settings
          </button>
        </div>
      </div>
      
      <div className="location-sharing-info">
        <div className="info-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <div className="info-content">
          <p>
            Your location is only used to match you with nearby users for chat. 
            It is not stored permanently and is refreshed regularly when active.
          </p>
          <p>
            When location sharing is disabled, you won't be visible to others 
            in the proximity chat, and you won't receive messages.
          </p>
        </div>
      </div>
    </div>
  );
};

LocationSharingControls.propTypes = {
  onUpdate: PropTypes.func
};

export default LocationSharingControls; 