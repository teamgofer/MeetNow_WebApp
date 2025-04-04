import { getSupabaseClient } from '../../supabase';
import { getUploadPresignedUrl } from '../wasabi-storage';
import { handleMeetupError } from './error-handling';
export const getMeetupImageUploadUrl = async (meetupId, contentType, fileName, isPublic = true) => {
    try {
        const path = `meetups/${meetupId}/${fileName}`;
        const result = await getUploadPresignedUrl(path, contentType, 300, isPublic);
        if (!result.success || !result.uploadUrl) {
            throw new Error(result.error?.toString() || 'Failed to generate upload URL');
        }
        return { uploadUrl: result.uploadUrl, path };
    }
    catch (error) {
        throw handleMeetupError(error instanceof Error ? error : new Error('Unknown error'), 'get meetup image upload URL');
    }
};
export const updateMeetupImage = async (meetupId, imageUrl, imagePath) => {
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
    }
    catch (error) {
        throw handleMeetupError(error instanceof Error ? error : new Error('Unknown error'), 'update meetup image');
    }
};
export const refreshMeetupImageUrl = async (meetupId) => {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.rpc('refresh_meetup_image_url', {
            p_meetup_id: meetupId,
        });
        if (error) {
            throw error;
        }
    }
    catch (error) {
        throw handleMeetupError(error instanceof Error ? error : new Error('Unknown error'), 'refresh meetup image URL');
    }
};
//# sourceMappingURL=image.js.map