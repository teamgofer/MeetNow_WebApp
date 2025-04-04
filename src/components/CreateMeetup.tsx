import React, { useState, useRef, useEffect } from 'react';
import {
  IoLocationOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import type { ILocation } from '../types/location';
import type { ILocationSearchResult } from '../types/location';
import type { IMeetupCreateData } from '../types/meetup';
import { ensureProfile } from '../utils/auth';
import { createMeetup } from '../utils/meetup';

import LocationSearchEnhanced from './search/LocationSearchEnhanced';
import './CreateMeetup.css';

interface ICreateMeetupProps {
  onClose: (meetup?: any) => void;
  initialLocation?: any | null;
}

const CreateMeetup: React.FC<ICreateMeetupProps> = ({ onClose, initialLocation = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [duration, setDuration] = useState('60');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');

  const [location, setLocation] = useState<any | null>(initialLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus title input on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }

    // If we have an initial location, set the address
    if (initialLocation?.display_name) {
      setAddress(initialLocation.display_name);
    }
  }, [initialLocation]);

  const handleLocationSelect = (selectedLocation: any | null) => {
    if (selectedLocation) {
      setLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        display_name: selectedLocation.display_name ?? '',
      });
      setAddress(selectedLocation.display_name ?? '');

      // Auto-generate title if empty
      if (!title) {
        const locationName = selectedLocation.display_name?.split(',')[0] ?? 'Location';
        setTitle(`Meetup at ${locationName}`);
      }
    } else {
      setLocation(null);
      setAddress('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const meetupData: IMeetupCreateData = {
        title: title.trim(),
        description: description.trim() || null,
        lat: location.lat,
        lng: location.lng,
        address: (address ?? location.display_name) || '',
        duration: parseInt(duration) || 60,
        user_id: null, // Will be set by the server
      };

      const result = await createMeetup(meetupData);

      setIsSuccess(true);
      setTimeout(() => {
        onClose(result);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-meetup-container">
      <div className="create-meetup-header">
        <h2>Create a New Meetup</h2>
        <button className="close-button" onClick={() => onClose()} aria-label="Close">
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
                min="1"
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
              placeholder="Enter meetup description"
              maxLength={1000}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => onClose()}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !title || !location}
            >
              {isSubmitting ? 'Creating...' : 'Create Meetup'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateMeetup;
