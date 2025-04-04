import { getSupabaseClient } from '../../../supabase';
import type { MeetupCreateData } from '../../../types/meetup';
import { searchLocations } from '../../location-services';
import { uploadFile } from '../../wasabi-storage';
import { createMeetup, joinMeetup, leaveMeetup, cancelMeetup } from '../operations';

// Mock dependencies
jest.mock('../../../supabase');
jest.mock('../../wasabi-storage');
jest.mock('../../location-services');
jest.mock('../../Logger');

describe('Meetup Operations', () => {
  const mockSupabase = {
    rpc: jest.fn(),
  };

  const mockMeetupData: MeetupCreateData = {
    lat: 40.7128,
    lng: -74.006,
    address: 'New York, NY',
    title: 'Test Meetup',
    description: 'Test Description',
    duration: 60,
    user_id: 'test-user-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createMeetup', () => {
    it('should create a meetup successfully', async () => {
      const mockResult = {
        id: 'test-id',
        ...mockMeetupData,
        created_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        status: 'active',
      };

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createMeetup(mockMeetupData);

      expect(result).toEqual(mockResult);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_meetup', {
        p_title: mockMeetupData.title,
        p_description: mockMeetupData.description,
        p_address: mockMeetupData.address,
        p_lat: mockMeetupData.lat,
        p_lng: mockMeetupData.lng,
        p_image: null,
        p_user_id: mockMeetupData.user_id,
        p_duration_minutes: mockMeetupData.duration,
      });
    });

    it('should handle image upload', async () => {
      const mockFile = new File([''], 'test.jpg');
      const mockImageUrl = 'https://example.com/test.jpg';
      const mockResult = {
        id: 'test-id',
        ...mockMeetupData,
        created_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        status: 'active',
      };

      (uploadFile as jest.Mock).mockResolvedValueOnce({
        success: true,
        url: mockImageUrl,
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createMeetup({ ...mockMeetupData, image: mockFile });

      expect(result).toEqual(mockResult);
      expect(uploadFile).toHaveBeenCalledWith(mockFile, expect.stringContaining('meetup_'));
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_meetup',
        expect.objectContaining({
          p_image: mockImageUrl,
        })
      );
    });

    it('should handle geocoding when address is missing', async () => {
      const mockGeocodedAddress = '123 Test St, New York, NY';
      const mockResult = {
        id: 'test-id',
        ...mockMeetupData,
        created_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        status: 'active',
      };

      (searchLocations as jest.Mock).mockResolvedValueOnce([{ display_name: mockGeocodedAddress }]);
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createMeetup({ ...mockMeetupData, address: '' });

      expect(result).toEqual(mockResult);
      expect(searchLocations).toHaveBeenCalledWith(`${mockMeetupData.lat},${mockMeetupData.lng}`, {
        limit: 1,
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_meetup',
        expect.objectContaining({
          p_address: mockGeocodedAddress,
        })
      );
    });

    it('should throw error on validation failure', async () => {
      await expect(createMeetup({ ...mockMeetupData, title: '' })).rejects.toThrow(
        'Validation failed: Title is required'
      );
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database error');
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(createMeetup(mockMeetupData)).rejects.toThrow('Database error');
    });
  });

  describe('joinMeetup', () => {
    it('should join meetup successfully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await joinMeetup('test-id');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('join_meetup', { p_meetup_id: 'test-id' });
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Join failed');
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(joinMeetup('test-id')).rejects.toThrow('Join failed');
    });
  });

  describe('leaveMeetup', () => {
    it('should leave meetup successfully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await leaveMeetup('test-id');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('leave_meetup', { p_meetup_id: 'test-id' });
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Leave failed');
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(leaveMeetup('test-id')).rejects.toThrow('Leave failed');
    });
  });

  describe('cancelMeetup', () => {
    it('should cancel meetup successfully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await cancelMeetup('test-id');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('cancel_meetup', { p_meetup_id: 'test-id' });
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Cancel failed');
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(cancelMeetup('test-id')).rejects.toThrow('Cancel failed');
    });
  });
});
