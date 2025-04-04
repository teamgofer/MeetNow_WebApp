import { getSupabaseClient } from '../../supabase';
import { getUploadPresignedUrl } from '../wasabi-storage';

import { handleMeetupError } from './error-handling';

/**
 * Get a pre-signed URL for uploading a meetup image
 */
export const getMeetupImageUploadUrl = async (
  meetupId: string,
  contentType: string,
  fileName: string,
  isPublic: boolean = true
): Promise<{ uploadUrl: string; path: string }> => {
  try {
    const path = `meetups/${meetupId}/${fileName}`;
    const result = await getUploadPresignedUrl(path, contentType, 300, isPublic);

    if (!result.success || !result.uploadUrl) {
      throw new Error(result.error?.toString() || 'Failed to generate upload URL');
    }

    return { uploadUrl: result.uploadUrl, path };
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'get meetup image upload URL'
    );
  }
};

/**
 * Update a meetup's image URL
 */
export const updateMeetupImage = async (
  meetupId: string,
  imageUrl: string,
  imagePath?: string
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('update_meetup_image', {
      p_meetup_id: meetupId,
      p_image_url: imageUrl,
      p_image_path: imagePath,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'update meetup image'
    );
  }
};

/**
 * Refresh a meetup's image URL
 */
export const refreshMeetupImageUrl = async (meetupId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('refresh_meetup_image_url', {
      p_meetup_id: meetupId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw handleMeetupError(
      error instanceof Error ? error : new Error('Unknown error'),
      'refresh meetup image URL'
    );
  }
};
