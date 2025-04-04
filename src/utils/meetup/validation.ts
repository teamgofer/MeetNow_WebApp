import type { IMeetupData, IMeetupValidationError } from '../../types/meetup';

export const validateMeetupData = (data: Partial<IMeetupData>): IMeetupValidationError[] => {
  const errors: IMeetupValidationError[] = [];

  // Required fields
  if (!data.lat || !data.lng) {
    errors.push({
      field: 'location',
      message: 'Location coordinates are required',
    });
  }
  if (!data.title) {
    errors.push({
      field: 'title',
      message: 'Title is required',
    });
  }

  // Validate coordinates
  if (data.lat && (isNaN(data.lat) || data.lat < -90 || data.lat > 90)) {
    errors.push({
      field: 'lat',
      message: 'Invalid latitude value',
    });
  }
  if (data.lng && (isNaN(data.lng) || data.lng < -180 || data.lng > 180)) {
    errors.push({
      field: 'lng',
      message: 'Invalid longitude value',
    });
  }

  // Validate duration
  if (data.duration && (isNaN(data.duration) || data.duration < 60)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be at least 60 minutes',
    });
  }

  // Validate title length
  if (data.title && data.title.length > 100) {
    errors.push({
      field: 'title',
      message: 'Title must be less than 100 characters',
    });
  }

  // Validate description length
  if (data.description && data.description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 1000 characters',
    });
  }

  return errors;
};
