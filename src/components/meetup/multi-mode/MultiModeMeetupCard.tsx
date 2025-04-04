import React, { useState, useCallback } from 'react';
import { LocationSearchResult } from '../../search/LocationSearch';
import { IoCloseOutline } from 'react-icons/io5';
import LocationInfoMode from './LocationInfoMode';
import LocationFormMode, { MeetupFormData } from './LocationFormMode';

// Define available display modes
export enum MeetupCardMode {
  LOCATION_INFO = 'location_info',
  CREATE_FORM = 'create_form',
  HIDDEN = 'hidden',
}

// Base props for the MultiModeMeetupCard
export interface MultiModeMeetupCardProps {
  location?: LocationSearchResult;
  onClose: () => void;
  onCreateMeetup?: (data: MeetupFormData & { location: LocationSearchResult }) => Promise<void>;
  onGetDirections?: (location: LocationSearchResult) => void;
  className?: string;
  isLoading?: boolean;
}

/**
 * A multi-purpose card component that can display different modes:
 * 1. Location information (when a map location is clicked)
 * 2. Meetup creation form (when user wants to create a meetup at a location)
 */
const MultiModeMeetupCard: React.FC<MultiModeMeetupCardProps> = ({
  location,
  onClose,
  onCreateMeetup,
  onGetDirections,
  className = '',
  isLoading = false,
}) => {
  // Active display mode state
  const [mode, setMode] = useState<MeetupCardMode>(
    location ? MeetupCardMode.LOCATION_INFO : MeetupCardMode.HIDDEN
  );

  // Handle switching to create mode
  const handleSwitchToCreateMode = useCallback(() => {
    setMode(MeetupCardMode.CREATE_FORM);
  }, []);

  // Handle switching to info mode
  const handleSwitchToInfoMode = useCallback(() => {
    setMode(MeetupCardMode.LOCATION_INFO);
  }, []);

  // Handle form submission
  const handleSubmitForm = useCallback(
    async (formData: MeetupFormData) => {
      if (onCreateMeetup && location) {
        // Add location data to the form submission
        await onCreateMeetup({
          ...formData,
          location,
        });

        // Close the card after successful submission
        onClose();
      }
    },
    [location, onCreateMeetup, onClose]
  );

  // If no location is provided or mode is hidden, don't render
  if (!location || mode === MeetupCardMode.HIDDEN) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-xl rounded-b-lg max-w-md mx-auto slide-down ${className}`}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Close"
        >
          <IoCloseOutline size={24} />
        </button>

        {/* Content based on active mode */}
        {mode === MeetupCardMode.LOCATION_INFO && (
          <LocationInfoMode
            location={location}
            onCreateMeetup={handleSwitchToCreateMode}
            onGetDirections={onGetDirections}
          />
        )}

        {mode === MeetupCardMode.CREATE_FORM && (
          <LocationFormMode
            location={location}
            onSubmit={handleSubmitForm}
            onCancel={handleSwitchToInfoMode}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default MultiModeMeetupCard;
