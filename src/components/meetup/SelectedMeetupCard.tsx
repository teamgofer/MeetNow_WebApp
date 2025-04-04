import React, { useState } from 'react';
import { IMeetup } from '../map/MeetupMarkers';
import { formatMeetupDistance, formatTimeAgo } from '../../utils/meetup/index';
import { FaTimes, FaWalking, FaClock } from 'react-icons/fa';
import CountdownTimer from '../ui/CountdownTimer';

interface SelectedMeetupCardProps {
  meetup: IMeetup;
  onClose: () => void;
  onDirections: () => void;
}

/**
 * Card to display details of a selected meetup
 */
const SelectedMeetupCard: React.FC<SelectedMeetupCardProps> = ({
  meetup,
  onClose,
  onDirections,
}) => {
  const [imageError, setImageError] = useState(false);
  const {
    title,
    description,
    distance,
    address,
    expiresAt,
    signed_image_url,
    starts_at = new Date().toISOString(),
    duration_minutes = 60,
  } = meetup;

  // Handler for image load errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Calculate start time and duration
  const getStartTimeAndDuration = () => {
    if (!starts_at) return { startTime: 'Now', duration: '1 hour' };

    // Format start time
    const start = new Date(starts_at);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const startTime = `${formattedHours}:${formattedMinutes} ${ampm}`;

    // Format duration
    const hours_duration = Math.floor(duration_minutes / 60);
    const minutes_remainder = duration_minutes % 60;

    let duration = '';
    if (hours_duration > 0) {
      duration += `${hours_duration} hour${hours_duration !== 1 ? 's' : ''}`;
    }
    if (minutes_remainder > 0) {
      if (duration) duration += ' ';
      duration += `${minutes_remainder} minute${minutes_remainder !== 1 ? 's' : ''}`;
    }

    return { startTime, duration: duration || '1 hour' };
  };

  const { startTime, duration } = getStartTimeAndDuration();

  return (
    <div className="selected-meetup-card bg-white shadow-lg rounded-lg overflow-hidden flex flex-col max-w-md w-full max-h-[80vh]">
      {/* Header with close button */}
      <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
        <h3 className="font-semibold text-xl truncate">{title}</h3>
        <button
          onClick={onClose}
          className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
          aria-label="Close meetup details"
        >
          <FaTimes size={18} />
        </button>
      </div>

      {/* Image (if available) */}
      {signed_image_url && !imageError && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={signed_image_url}
            alt={title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
      )}

      {/* Meetup details */}
      <div className="p-4 overflow-y-auto flex-grow">
        {/* Distance */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <FaWalking className="mr-2 text-blue-500" />
          {formatMeetupDistance(distance)}
        </div>

        {/* Time */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <FaClock className="mr-2 text-blue-500" />
          Started {formatTimeAgo(starts_at)}
        </div>

        {/* Description */}
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{description}</p>

        {/* Address */}
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-gray-700">Location</p>
          <p className="text-gray-600">{address}</p>
        </div>

        {/* Duration */}
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-gray-700">Duration</p>
          <p className="text-gray-600">
            {startTime} • {duration}
          </p>
        </div>

        {/* Countdown timer */}
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Expires in</p>
          <CountdownTimer targetDate={new Date(expiresAt)} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onDirections}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default SelectedMeetupCard;
