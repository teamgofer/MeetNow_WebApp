import React, { useState, useCallback } from 'react';
import { IMeetup } from '../map/MeetupMarkers';
import { LocationSearchResult } from '../search/LocationSearch';
import CountdownTimer from '../ui/CountdownTimer';
import {
  FaTimes,
  FaDirections,
  FaCalendar,
  FaMapMarkerAlt,
  FaPen,
  FaImage,
  FaInfoCircle,
  FaClock,
  FaPalette,
} from 'react-icons/fa';
import { IoCreateOutline, IoTimeOutline, IoImageOutline } from 'react-icons/io5';
import { formatMeetupDistance, formatTimeAgo } from '../../utils/meetup/index';
import MeetupImageUploader from '../MeetupImageUploader';
import { CardMode } from '../../constants/card-modes';
import { ProgressiveImage } from '../common';
import { IOptimizedImageProps } from '../../types/components';
import MeetupImagePreview from '../MeetupImagePreview';
import { getUploadPresignedUrl, getSignedViewUrl } from '../../utils/wasabi-storage';

// Color scheme types and definitions
type ColorScheme = 'A' | 'B';

const colorSchemes = {
  A: {
    background: 'from-indigo-50 via-purple-50/90 to-pink-50/80',
    hover: 'hover:from-indigo-100 hover:via-purple-100/90 hover:to-pink-100/80',
    shimmer: 'from-indigo-100/50 via-purple-100/50 to-pink-100/50',
    text: 'text-indigo-900',
    textSecondary: 'text-indigo-700',
    badge: 'from-indigo-500 to-purple-500',
    item: 'from-indigo-100 to-purple-100',
    scrollbar: 'scrollbar-thumb-indigo-300',
  },
  B: {
    background: 'from-emerald-50 via-orange-50/90 to-rose-50/80',
    hover: 'hover:from-emerald-100 hover:via-orange-100/90 hover:to-rose-100/80',
    shimmer: 'from-emerald-100/50 via-orange-100/50 to-rose-100/50',
    text: 'text-emerald-900',
    textSecondary: 'text-emerald-700',
    badge: 'from-emerald-500 to-orange-500',
    item: 'from-emerald-100 to-orange-100',
    scrollbar: 'scrollbar-thumb-emerald-300',
  },
};

// Data interface for creating/editing a meetup
export interface MeetupFormData {
  title: string;
  description: string;
  duration: number;
  image?: File | null;
  image_url?: string | undefined;
}

// Props for the unified card component
export interface UnifiedMeetupCardProps {
  meetup?: IMeetup; // Meetup data for display
  locationData?: LocationSearchResult; // Location data for display or creating meetup
  mode?: CardMode; // Initial display mode
  onClose: () => void; // Close the card
  onDirections?: (data: IMeetup | LocationSearchResult) => void; // Get directions
  onCreateMeetup?: (data: MeetupFormData & { location: LocationSearchResult }) => Promise<void>; // Create meetup
  onEditMeetup?: (id: string, data: MeetupFormData) => Promise<void>; // Edit meetup (future)
  className?: string; // Additional CSS classes
  isLoading?: boolean; // Loading state
  isDirectionsActive?: boolean; // Whether directions are already active
  awaitingSecondPoint?: boolean; // Whether waiting for second point selection for multi-point routing
}

/**
 * A unified card component that can display meetups, locations, and forms
 * This combines functionality from SelectedMeetupCard and MultiModeMeetupCard
 * into a single consistent component
 */
const UnifiedMeetupCard: React.FC<UnifiedMeetupCardProps> = ({
  meetup,
  locationData,
  mode: initialMode,
  onClose,
  onDirections,
  onCreateMeetup,
  onEditMeetup,
  className = '',
  isLoading = false,
  isDirectionsActive = false,
  awaitingSecondPoint = false,
}) => {
  // Determine initial mode based on props if not explicitly provided
  const getInitialMode = (): CardMode => {
    if (initialMode) return initialMode;
    if (meetup) return CardMode.MEETUP_DISPLAY;
    if (locationData) return CardMode.LOCATION_DISPLAY;
    return CardMode.HIDDEN;
  };

  // Active display mode state
  const [mode, setMode] = useState<CardMode>(getInitialMode());

  // Color scheme state
  const [colorScheme, setColorScheme] = useState<ColorScheme>('A');

  // Toggle color scheme
  const toggleColorScheme = () => {
    setColorScheme(prev => (prev === 'A' ? 'B' : 'A'));
  };

  // Form state
  const [formData, setFormData] = useState<MeetupFormData>({
    title: '',
    description: '',
    duration: 60,
    image: null,
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format distance for display
  const formatDistance = (dist?: number): string => {
    if (!dist) return '';
    return dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`;
  };

  // Format time ago without external dependencies
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than a minute
    if (seconds < 60) {
      return 'just now';
    }

    // Less than an hour
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than a day
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than a week
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Format as date for older timestamps
    return date.toLocaleDateString();
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x200';
    e.currentTarget.style.opacity = '0.7';
  };

  // Calculate the start time and duration from properties
  const getStartTimeAndDuration = () => {
    if (!meetup) return { starts_at: '', durationMinutes: 60 };

    // If direct starts_at and duration_minutes are available, use them
    if (meetup.starts_at) {
      return {
        starts_at: meetup.starts_at,
        durationMinutes: meetup.duration_minutes || 60,
      };
    }

    // Fallback: if we have createdAt and expiresAt, calculate duration
    if (meetup.createdAt && meetup.expiresAt) {
      const createdDate = new Date(meetup.createdAt);
      const expiresDate = new Date(meetup.expiresAt);

      // Calculate duration in minutes
      const durationMs = expiresDate.getTime() - createdDate.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      return {
        starts_at: meetup.createdAt,
        durationMinutes,
      };
    }

    // Default: use createdAt as start with 60 minute duration
    return {
      starts_at: meetup.createdAt,
      durationMinutes: 60,
    };
  };

  // Format coordinates as a string
  const formatCoordinates = (lat: number, lon: number): string => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  // Handle mode switching
  const handleSwitchMode = (newMode: CardMode) => {
    setMode(newMode);
  };

  // Handle getting directions
  const handleGetDirections = () => {
    console.log('Get directions button clicked', {
      isDirectionsActive,
      mode,
      hasMeetup: !!meetup,
      hasLocationData: !!locationData,
    });

    if (onDirections) {
      if (mode === CardMode.MEETUP_DISPLAY && meetup) {
        console.log('Calling onDirections with meetup', meetup.title);
        onDirections(meetup);
      } else if (
        (mode === CardMode.LOCATION_DISPLAY || mode === CardMode.CREATE_FORM) &&
        locationData
      ) {
        console.log('Calling onDirections with location', locationData.display_name);
        onDirections(locationData);
      }
    } else if (locationData) {
      // Open Google Maps as fallback
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lon}`,
        '_blank'
      );
    } else if (meetup && Array.isArray(meetup.position)) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${meetup.position[0]},${meetup.position[1]}`,
        '_blank'
      );
    }
  };

  // Add a handler for image selection
  const handleImageSelected = (file: File | null) => {
    setSelectedImageFile(file);

    // Clear previous preview if image is removed
    if (!file && imagePreview) {
      setImagePreview(null);
      setFormData(prev => ({
        ...prev,
        image: null,
        image_url: undefined,
      }));
      return;
    }

    // Create preview for selected image
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Modify handleCreateMeetup to handle image upload
  const handleCreateMeetup = async () => {
    if (mode === CardMode.CREATE_FORM && locationData && onCreateMeetup) {
      try {
        setError(null);

        if (!formData.title.trim()) {
          setError('Please enter a title for your meetup');
          return;
        }

        // Set loading state
        if (isLoading) return; // Prevent multiple submissions

        // If an image was selected, upload it before creating the meetup
        let finalFormData = { ...formData };

        if (selectedImageFile) {
          try {
            // Generate a unique path for the image
            const timestamp = Date.now();
            const extension = selectedImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `meetups/meetup_${timestamp}.${extension}`;

            // Get pre-signed URL for upload
            const uploadUrlResult = await getUploadPresignedUrl(
              path,
              selectedImageFile.type,
              7200, // 2 hours expiry
              true // isAnonymous
            );

            if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
              throw new Error('Failed to get upload URL');
            }

            // Upload file directly to Wasabi
            const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': selectedImageFile.type,
              },
              body: selectedImageFile,
            });

            if (!uploadResponse.ok) {
              throw new Error(
                `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
              );
            }

            // Get signed URL for viewing the uploaded image
            if (uploadUrlResult.path) {
              const signedUrl = await getSignedViewUrl(
                uploadUrlResult.path,
                86400, // 24 hours expiry
                true // isAnonymous
              );

              // Update form data with the image path (not the full URL)
              finalFormData = {
                ...finalFormData,
                image_url: uploadUrlResult.path,
              };
            } else {
              console.error('Failed to get a valid path from upload');
            }
          } catch (err) {
            if (err instanceof Error) {
              setError(`Image upload failed: ${err.message}`);
            } else {
              setError('Image upload failed due to an unknown error');
            }
            return;
          }
        }

        // Create the meetup with the potentially updated form data
        await onCreateMeetup({
          ...finalFormData,
          location: locationData,
        });

        // Reset form data
        setFormData({
          title: '',
          description: '',
          duration: 60,
          image: null,
        });
        setSelectedImageFile(null);
        setImagePreview(null);

        // Close the card
        onClose();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while creating the meetup');
        }
      }
    } else if (mode === CardMode.LOCATION_DISPLAY && locationData) {
      // Switch to create form mode
      handleSwitchMode(CardMode.CREATE_FORM);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // If neither meetup nor locationData is provided, or mode is hidden, don't render
  if (mode === CardMode.HIDDEN || (!meetup && !locationData)) {
    return null;
  }

  // Get timing properties for meetup display
  const { starts_at, durationMinutes } = getStartTimeAndDuration();

  // Get current color scheme
  const colors = colorSchemes[colorScheme];

  return (
    <div
      className={`unified-meetup-card relative bg-gradient-to-br ${colors.background} backdrop-blur-sm shadow-xl rounded-lg overflow-hidden max-w-xl w-full mx-auto transition-all duration-300 ${className}`}
    >
      {/* Color scheme toggle button */}
      <button
        className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg text-gray-700 hover:bg-white/90 transition-all duration-200"
        onClick={toggleColorScheme}
        aria-label="Toggle color scheme"
      >
        <FaPalette className="text-lg" />
      </button>

      {/* Close button */}
      <button
        className="absolute top-3 right-12 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg text-gray-700 hover:bg-white/90 transition-all duration-200"
        onClick={onClose}
        aria-label="Close"
      >
        <FaTimes />
      </button>

      {/* MEETUP DISPLAY MODE */}
      {mode === CardMode.MEETUP_DISPLAY && meetup && (
        <>
          {/* Meetup image */}
          {meetup.signed_image_url || meetup.image_url ? (
            <div className="w-full h-48 relative">
              <ProgressiveImage
                src={meetup.signed_image_url || meetup.image_url || ''}
                alt={meetup.title}
                className="w-full h-full"
                width="100%"
                height="100%"
                objectFit="cover"
                placeholderColor="#e5e7eb"
                fallbackSrc="https://via.placeholder.com/400x200"
                loading="lazy"
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className={`w-full h-16 bg-gradient-to-r ${colors.badge}`}></div>
          )}

          {/* Content */}
          <div className="p-4 mb-3">
            {/* Header with title and distance */}
            <div className="flex justify-between items-start mb-2">
              <h2 className={`text-xl font-semibold ${colors.text} leading-tight`}>
                {meetup.title || 'Unnamed Meetup'}
              </h2>
              {meetup.distance !== undefined && (
                <span
                  className={`text-xs ${colors.textSecondary} font-medium bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm`}
                >
                  {formatMeetupDistance(meetup.distance)}
                </span>
              )}
            </div>

            {/* Description */}
            {meetup.description && (
              <p className={`text-sm ${colors.textSecondary} mb-3`}>{meetup.description}</p>
            )}

            {/* Address */}
            {meetup.address && (
              <div className="flex items-start mb-3">
                <div className={`w-4 h-4 mt-0.5 mr-2 ${colors.textSecondary} flex-shrink-0`}>
                  <FaMapMarkerAlt />
                </div>
                <p className={`text-sm ${colors.textSecondary} flex-1`}>{meetup.address}</p>
              </div>
            )}

            {/* Time details */}
            <div className="flex items-center mb-3">
              <div className={`w-4 h-4 mr-2 ${colors.textSecondary}`}>
                <FaClock />
              </div>
              <div className="text-sm">
                <span className={colors.textSecondary}>Started </span>
                <span className={`font-medium ${colors.text}`}>{formatTimeAgo(starts_at)}</span>
              </div>
            </div>

            {/* Countdown timer */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-md p-2 mb-3 shadow-sm`}>
              <CountdownTimer starts_at={starts_at} durationMinutes={durationMinutes} />
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative h-32 bg-white/80 backdrop-blur-sm rounded-md overflow-hidden shadow-sm">
                <ProgressiveImage
                  src={imagePreview}
                  alt="Meetup preview"
                  className="w-full h-full"
                  width="100%"
                  height="100%"
                  objectFit="cover"
                  placeholderColor="#e5e7eb"
                  loading="eager"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImageFile(null);
                    setFormData(prev => ({
                      ...prev,
                      image: null,
                      image_url: undefined,
                    }));
                  }}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 text-gray-700 hover:text-red-500 shadow-sm"
                  aria-label="Remove image"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between mt-4">
              <button
                className={`px-4 py-2 bg-gradient-to-r ${colors.badge} text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`}
                onClick={handleGetDirections}
              >
                <FaDirections className="mr-1" />
                {awaitingSecondPoint
                  ? 'Select another point to trace the route'
                  : isDirectionsActive
                    ? 'To Another Spot'
                    : 'Get Directions'}
              </button>

              {onEditMeetup && (
                <button
                  className={`px-4 py-2 bg-gradient-to-r ${colors.item} ${colors.text} rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`}
                  onClick={() => handleSwitchMode(CardMode.EDIT_FORM)}
                >
                  <FaPen className="mr-1" />
                  Edit
                </button>
              )}

              <button
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* LOCATION DISPLAY MODE */}
      {mode === CardMode.LOCATION_DISPLAY && locationData && (
        <>
          {/* Location header background */}
          <div
            className={`w-full h-32 bg-gradient-to-r ${colors.badge} flex items-center justify-center`}
          >
            <FaMapMarkerAlt className="text-white text-5xl" />
          </div>

          {/* Content */}
          <div className="p-4 mb-3">
            {/* Location name/title */}
            <h2 className={`text-xl font-semibold ${colors.text} leading-tight mb-2`}>
              {locationData.display_name?.split(',')[0] || 'Selected Location'}
            </h2>

            {/* Full address */}
            <div className="flex items-start mb-3">
              <div className={`w-4 h-4 mt-0.5 mr-2 ${colors.textSecondary} flex-shrink-0`}>
                <FaMapMarkerAlt />
              </div>
              <p className={`text-sm ${colors.textSecondary} flex-1`}>
                {locationData.display_name || 'No address available'}
              </p>
            </div>

            {/* Coordinates */}
            <div className="bg-white/80 backdrop-blur-sm rounded-md p-3 mb-4 shadow-sm">
              <p className={`text-xs ${colors.textSecondary} mb-1`}>Coordinates</p>
              <p className={`text-sm font-mono ${colors.text}`}>
                {formatCoordinates(locationData.lat, locationData.lon)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between mt-4">
              {onCreateMeetup && (
                <button
                  className={`px-4 py-2 bg-gradient-to-r ${colors.badge} text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`}
                  onClick={handleCreateMeetup}
                >
                  <IoCreateOutline className="mr-1" />
                  Create Meetup
                </button>
              )}
              <button
                className={`px-4 py-2 bg-gradient-to-r ${colors.item} ${colors.text} rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`}
                onClick={handleGetDirections}
              >
                <FaDirections className="mr-1" />
                {awaitingSecondPoint
                  ? 'Select another point to trace the route'
                  : isDirectionsActive
                    ? 'To Another Spot'
                    : 'Get Directions'}
              </button>
              <button
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* CREATE FORM MODE */}
      {mode === CardMode.CREATE_FORM && locationData && (
        <>
          <div
            className={`w-full h-16 bg-gradient-to-r ${colors.badge} flex items-center justify-center`}
          >
            <IoCreateOutline className="text-white text-3xl mr-2" />
            <h2 className="text-xl font-semibold text-white">Create Meetup</h2>
          </div>

          <div className="p-4">
            {/* Location context */}
            <div
              className={`mb-4 text-sm bg-white/80 backdrop-blur-sm p-3 rounded-md flex items-start shadow-sm`}
            >
              <FaInfoCircle className={`${colors.textSecondary} mr-2 mt-0.5 flex-shrink-0`} />
              <div>
                <p className={`font-medium ${colors.text} mb-1`}>Selected Location</p>
                <p className={colors.textSecondary}>
                  {locationData.display_name || 'Unknown location'}
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 text-sm bg-red-50 p-3 rounded-md text-red-700">{error}</div>
            )}

            {/* Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateMeetup();
              }}
            >
              {/* Title */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${colors.text} mb-1`} htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`}
                  placeholder="What's this meetup about?"
                  required
                  maxLength={100}
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  className={`block text-sm font-medium ${colors.text} mb-1`}
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`}
                  placeholder="Add some details about your meetup..."
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                />
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label
                  className={`block text-sm font-medium ${colors.text} mb-1`}
                  htmlFor="duration"
                >
                  <IoTimeOutline className="inline mr-1" />
                  Duration
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`}
                  disabled={isLoading}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                  <IoImageOutline className="inline mr-1" />
                  Image (optional)
                </label>

                {!imagePreview ? (
                  <div
                    className={`w-full p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-${colors.text} transition-colors bg-white/80 backdrop-blur-sm shadow-sm`}
                  >
                    <MeetupImagePreview onImageSelected={handleImageSelected} className="w-full" />
                  </div>
                ) : (
                  <div className="relative h-32 bg-white/80 backdrop-blur-sm rounded-md overflow-hidden shadow-sm">
                    <ProgressiveImage
                      src={imagePreview}
                      alt="Meetup preview"
                      className="w-full h-full"
                      width="100%"
                      height="100%"
                      objectFit="cover"
                      placeholderColor="#e5e7eb"
                      loading="eager"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImageFile(null);
                        setFormData(prev => ({
                          ...prev,
                          image: null,
                          image_url: undefined,
                        }));
                      }}
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 text-gray-700 hover:text-red-500 shadow-sm"
                      aria-label="Remove image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => handleSwitchMode(CardMode.LOCATION_DISPLAY)}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm"
                  disabled={isLoading}
                >
                  Back
                </button>

                <button
                  type="submit"
                  className={`px-4 py-2 ${isLoading ? 'bg-gray-400' : `bg-gradient-to-r ${colors.badge}`} text-white rounded-md transition-all duration-200 flex items-center shadow-sm`}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  Create Meetup
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* EDIT FORM MODE (placeholder) */}
      {mode === CardMode.EDIT_FORM && meetup && (
        <div className="p-4">
          <h2 className={`text-xl font-semibold ${colors.text} mb-4`}>Edit Meetup</h2>
          <p className={`${colors.textSecondary} mb-4`}>
            Edit functionality will be implemented in a future update.
          </p>
          <button
            className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm"
            onClick={() => handleSwitchMode(CardMode.MEETUP_DISPLAY)}
          >
            Back to Details
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedMeetupCard;
