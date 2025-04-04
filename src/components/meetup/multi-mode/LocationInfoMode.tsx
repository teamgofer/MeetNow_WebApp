import React from 'react';
import { LocationSearchResult } from '../../search/LocationSearch';
import { IoLocationOutline, IoCalendarOutline } from 'react-icons/io5';

export interface LocationInfoModeProps {
  location: LocationSearchResult;
  onCreateMeetup: () => void;
  onGetDirections?: (location: LocationSearchResult) => void;
}

/**
 * Component to display location information and actions
 */
const LocationInfoMode: React.FC<LocationInfoModeProps> = ({
  location,
  onCreateMeetup,
  onGetDirections,
}) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2 pr-8 flex items-center">
        <IoLocationOutline className="text-red-500 mr-2" />
        {location.display_name || 'Selected Location'}
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        {location.address?.road ? `${location.address.road}, ` : ''}
        {location.address?.city || location.address?.town || location.address?.village || ''}
        {location.address?.state ? `, ${location.address.state}` : ''}
        {location.address?.country ? `, ${location.address.country}` : ''}
      </p>

      <div className="flex items-center text-sm text-gray-600 mb-4">
        <span className="font-semibold mr-2">Coordinates:</span>
        {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onCreateMeetup}
          className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
        >
          <IoCalendarOutline className="mr-2" />
          Create Meetup Here
        </button>

        {onGetDirections && (
          <button
            onClick={() => onGetDirections(location)}
            className="py-2 px-3 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <IoLocationOutline className="mr-1" />
            Directions
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationInfoMode;
