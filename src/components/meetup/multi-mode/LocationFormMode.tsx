import React, { useState, useCallback, useRef } from 'react';
import {
  IoCalendarOutline,
  IoTextOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoImageOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import { LocationSearchResult } from '../../search/LocationSearch';

export interface MeetupFormData {
  title: string;
  description: string;
  duration: number;
  image?: File | null;
}

export interface LocationFormModeProps {
  location: LocationSearchResult;
  onSubmit: (data: MeetupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Form component for creating a meetup at a specific location
 */
const LocationFormMode: React.FC<LocationFormModeProps> = ({
  location,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60); // Default 1 hour
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        setError('Please enter a title for your meetup');
        return;
      }

      // Clear any previous errors
      setError(null);

      try {
        // Submit form data
        await onSubmit({
          title,
          description,
          duration,
          image,
        });

        // Reset form after successful submission
        setTitle('');
        setDescription('');
        setDuration(60);
        setImage(null);
        setImagePreview(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while creating the meetup');
        }
      }
    },
    [title, description, duration, image, onSubmit]
  );

  // Handle image selection
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only accept images under 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }

      setImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Trigger file input click
  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Clear selected image
  const handleClearImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2 pr-8 flex items-center">
        <IoCalendarOutline className="text-blue-500 mr-2" />
        Create Meetup
      </h2>

      <div className="mb-3 text-sm bg-blue-50 p-2 rounded-md flex items-start">
        <IoInformationCircleOutline className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <span>
          Creating a meetup at: <strong>{location.display_name || 'Selected Location'}</strong>
        </span>
      </div>

      {error && <div className="mb-3 text-sm bg-red-50 p-2 rounded-md text-red-700">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
            <IoTextOutline className="inline mr-1" /> Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="What's this meetup about?"
            required
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
            <IoDocumentTextOutline className="inline mr-1" /> Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add some details about your meetup..."
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="duration">
            <IoTimeOutline className="inline mr-1" /> Duration
          </label>
          <select
            id="duration"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <IoImageOutline className="inline mr-1" /> Image (optional)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isLoading}
          />

          {imagePreview ? (
            <div className="relative h-32 bg-gray-100 rounded-md overflow-hidden">
              <img src={imagePreview} alt="Meetup preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md"
                disabled={isLoading}
              >
                <IoCloseOutline size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleImageClick}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400 transition-colors"
              disabled={isLoading}
            >
              <div className="text-center text-gray-500">
                <IoImageOutline className="mx-auto h-8 w-8 mb-1" />
                <span>Click to upload an image</span>
              </div>
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Meetup'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <IoLocationOutline className="mr-2" />
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationFormMode;
