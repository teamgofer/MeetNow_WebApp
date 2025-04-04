import { handleMeetupError, ErrorCategory } from '../error-handling';

describe('handleMeetupError', () => {
  it('should categorize validation errors', () => {
    const error = new Error('Validation failed: Title is required');
    const result = handleMeetupError(error, 'create meetup');

    expect(result.category).toBe(ErrorCategory.VALIDATION);
    expect(result.message).toBe('Validation failed: Title is required');
    expect(result.originalError).toBe(error);
    expect(result.timestamp).toBeDefined();
  });

  it('should categorize network errors', () => {
    const error = new Error('Network request failed');
    const result = handleMeetupError(error, 'fetch meetups');

    expect(result.category).toBe(ErrorCategory.NETWORK);
    expect(result.message).toBe('Network request failed');
    expect(result.originalError).toBe(error);
    expect(result.timestamp).toBeDefined();
  });

  it('should categorize storage errors', () => {
    const error = new Error('Failed to upload image to storage');
    const result = handleMeetupError(error, 'upload image');

    expect(result.category).toBe(ErrorCategory.STORAGE);
    expect(result.message).toBe('Failed to upload image to storage');
    expect(result.originalError).toBe(error);
    expect(result.timestamp).toBeDefined();
  });

  it('should categorize database errors', () => {
    const error = new Error('Database connection failed');
    const result = handleMeetupError(error, 'save meetup');

    expect(result.category).toBe(ErrorCategory.DATABASE);
    expect(result.message).toBe('Database connection failed');
    expect(result.originalError).toBe(error);
    expect(result.timestamp).toBeDefined();
  });

  it('should use unknown category for unrecognized errors', () => {
    const error = new Error('Unknown error occurred');
    const result = handleMeetupError(error, 'unknown operation');

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.message).toBe('Unknown error occurred');
    expect(result.originalError).toBe(error);
    expect(result.timestamp).toBeDefined();
  });

  it('should use operation name in message when error message is empty', () => {
    const error = new Error('');
    const result = handleMeetupError(error, 'create meetup');

    expect(result.message).toBe('Failed to create meetup');
  });
});
