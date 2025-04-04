import type { MeetupData } from '../../../types/meetup';
import { validateMeetupData } from '../validation';

describe('validateMeetupData', () => {
  const validMeetupData: MeetupData = {
    lat: 40.7128,
    lng: -74.006,
    address: 'New York, NY',
    title: 'Test Meetup',
    description: 'Test Description',
    duration: 60,
  };

  it('should return empty array for valid data', () => {
    const errors = validateMeetupData(validMeetupData);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', () => {
    const errors = validateMeetupData({});
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual({
      field: 'location',
      message: 'Location coordinates are required',
    });
    expect(errors).toContainEqual({
      field: 'title',
      message: 'Title is required',
    });
  });

  it('should validate coordinates', () => {
    const errors = validateMeetupData({
      ...validMeetupData,
      lat: 91,
      lng: -181,
    });
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual({
      field: 'lat',
      message: 'Invalid latitude value',
    });
    expect(errors).toContainEqual({
      field: 'lng',
      message: 'Invalid longitude value',
    });
  });

  it('should validate duration', () => {
    const errors = validateMeetupData({
      ...validMeetupData,
      duration: 30,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      field: 'duration',
      message: 'Duration must be at least 60 minutes',
    });
  });

  it('should validate title length', () => {
    const errors = validateMeetupData({
      ...validMeetupData,
      title: 'a'.repeat(101),
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      field: 'title',
      message: 'Title must be less than 100 characters',
    });
  });

  it('should validate description length', () => {
    const errors = validateMeetupData({
      ...validMeetupData,
      description: 'a'.repeat(1001),
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      field: 'description',
      message: 'Description must be less than 1000 characters',
    });
  });
});
