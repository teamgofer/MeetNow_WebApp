import { getSupabaseClient } from '../../supabase';
import type { IMeetupCreateData } from '../../types/meetup';

import { handleMeetupError } from './error-handling';
import { getMeetupImageUploadUrl, updateMeetupImage } from './image';
import { validateMeetupData } from './validation';

/**
 * Create a new meetup
 */
export const createMeetup = async (data: IMeetupCreateData): Promise<any> => {
  try {
    // Validate meetup data
    const validationErrors = validateMeetupData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors[0].message}`);
    }

    // If there's an image file, get a pre-signed URL for upload
    let imageUrl = null;
    if (data.image && data.image instanceof File) {
      const { uploadUrl, path } = await getMeetupImageUploadUrl(
        'temp', // We'll update this after creating the meetup
        data.image.type,
        data.image.name,
        data.isPublic
      );
      imageUrl = uploadUrl;
    }

    // Create the meetup in the database
    const supabase = getSupabaseClient();
    const { data: meetup, error } = await supabase.rpc('create_meetup', {
      p_title: data.title,
      p_description: data.description ?? null,
      p_address: data.address,
      p_lat: data.lat,
      p_lng: data.lng,
      p_image: imageUrl,
      p_user_id: data.user_id || '',
      p_duration_minutes: data.duration,
    });

    if (error) {
      throw error;
    }

    return meetup;
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'create meetup'
    );
  }
};

/**
 * Join a meetup
 */
export const joinMeetup = async (meetupId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('join_meetup', { p_meetup_id: meetupId });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'join meetup'
    );
  }
};

/**
 * Leave a meetup
 */
export const leaveMeetup = async (meetupId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('leave_meetup', { p_meetup_id: meetupId });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'leave meetup'
    );
  }
};

/**
 * Cancel a meetup
 */
export const cancelMeetup = async (meetupId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('cancel_meetup', { p_meetup_id: meetupId });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'cancel meetup'
    );
  }
};
