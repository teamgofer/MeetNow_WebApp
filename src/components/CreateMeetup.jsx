import React, { useState, useRef, useEffect } from 'react';
import { ensureProfile } from '../utils/auth';
import { createMeetup } from '../utils/meetup';
import LocationSearchEnhanced from './search/LocationSearchEnhanced';
import {
  IoLocationOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';
import './CreateMeetup.css';

/**
 * Location object interface
 * @typedef {Object} Location
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} display_name - Location display name
 */

/**
 * Meetup object interface
 * @typedef {Object} Meetup
 * @property {string} title - Meetup title
 * @property {string} description - Meetup description
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} address - Address
 * @property {number} max_participants - Maximum participants
 * @property {number} duration - Duration in minutes
 * @property {string} start_time - Start time ISO string
 */

/**
 * CreateMeetup component props
 * @typedef {Object} CreateMeetupProps
 * @property {Function} onClose - Function to call when closing the component
 * @property {Location|null} initialLocation - Initial location (optional)
 */

/**
 * CreateMeetup component for creating new meetups with enhanced location search
 * @param {CreateMeetupProps} props - Component props
 */
const CreateMeetup = ({ onClose, initialLocation = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [duration, setDuration] = useState('60');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');

  const [location, setLocation] = useState(initialLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const titleRef = useRef(null);
  const formRef = useRef(null);

  // Focus title input on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }

    // If we have an initial location, set the address
    if (initialLocation && initialLocation.display_name) {
      setAddress(initialLocation.display_name);
    }
  }, [initialLocation]);

  /**
   * Handle location selection from the LocationSearch component
   * @param {Location|null} selectedLocation - The selected location object
   */
  const handleLocationSelect = selectedLocation => {
    if (selectedLocation) {
      setLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lon || selectedLocation.lng,
        display_name: selectedLocation.display_name,
      });
      setAddress(selectedLocation.display_name || '');

      // Auto-generate title if empty
      if (!title) {
        setTitle(
          `Meetup at ${selectedLocation.name || selectedLocation.display_name.split(',')[0]}`
        );
      }
    } else {
      setLocation(null);
      setAddress('');
    }
  };

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async e => {
    e.preventDefault();

    // Validate required fields
    if (!title || !location) {
      setError('Title and location are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First ensure user has a profile
      await ensureProfile();

      // Convert date and time to ISO string
      const meetupDateTime = new Date(`${date}T${time}`);

      // Then create the meetup
      const meetupData = {
        title: title.trim(),
        description: description.trim(),
        lat: location.lat,
        lng: location.lng,
        address: address || location.display_name,
        max_participants: parseInt(maxParticipants) || 10,
        duration: parseInt(duration) || 60,
        start_time: meetupDateTime.toISOString(),
      };

      const result = await createMeetup(meetupData);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose(result.meetup);
        }, 2000);
      } else {
        setError(result.error || 'Failed to create meetup');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-meetup-container">
      <div className="create-meetup-header">
        <h2>Create a New Meetup</h2>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      {isSuccess ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h3>Meetup Created!</h3>
          <p>Your meetup has been successfully created.</p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="create-meetup-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="meetup-title">
              <IoDocumentTextOutline /> Title
            </label>
            <input
              ref={titleRef}
              id="meetup-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter meetup title"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>
              <IoLocationOutline /> Location
            </label>
            <div className="location-search-wrapper">
              <LocationSearchEnhanced
                onLocationSelect={handleLocationSelect}
                initialQuery={address}
                placeholder="Search for a location"
                showCurrentLocation={true}
                autoFocus={!title}
              />
            </div>
            {location && (
              <div className="selected-location-info">
                <span>Selected: </span>
                <span className="location-name">{location.display_name}</span>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="meetup-date">
                <IoCalendarOutline /> Date
              </label>
              <input
                id="meetup-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group half">
              <label htmlFor="meetup-time">
                <IoTimeOutline /> Time
              </label>
              <input
                id="meetup-time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="meetup-duration">
                <IoTimeOutline /> Duration (minutes)
              </label>
              <input
                id="meetup-duration"
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                min="15"
                max="480"
                required
              />
            </div>

            <div className="form-group half">
              <label htmlFor="meetup-participants">
                <IoPersonOutline /> Max Participants
              </label>
              <input
                id="meetup-participants"
                type="number"
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                min="2"
                max="100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="meetup-description">
              <IoDocumentTextOutline /> Description
            </label>
            <textarea
              id="meetup-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your meetup..."
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitting || !location}>
              {isSubmitting ? 'Creating...' : 'Create Meetup'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateMeetup;
