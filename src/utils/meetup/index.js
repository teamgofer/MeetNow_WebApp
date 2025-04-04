import { getSignedUrlFromFullUrl } from '../wasabi-storage';
import { getSupabaseClient } from '../../supabase';
import logger from '../Logger';
export * from './search';
export * from './validation';
export * from './error-handling';
import { handleMeetupError } from './error-handling';
export const refreshMeetupImageUrls = async (meetups, expirySeconds = 86400, visibleCount = 5, onUpdate) => {
    if (!meetups || meetups.length === 0) {
        return [];
    }
    const updatedMeetups = [...meetups];
    const visibleMeetups = updatedMeetups.slice(0, visibleCount);
    const backgroundMeetups = updatedMeetups.slice(visibleCount);
    await Promise.all(visibleMeetups.map(async (meetup, index) => {
        if (meetup.image_url &&
            typeof meetup.image_url === 'string' &&
            (!meetup.signed_image_url || shouldRefreshUrl(meetup.signed_image_url))) {
            try {
                const signedUrl = await getSignedUrlFromFullUrl(meetup.image_url, expirySeconds, true);
                if (signedUrl) {
                    updatedMeetups[index] = {
                        ...meetup,
                        signed_image_url: signedUrl,
                    };
                }
            }
            catch (error) {
                console.error(`Failed to refresh signed URL for meetup ${meetup.id || 'unknown'}:`, error);
            }
        }
    }));
    if (backgroundMeetups.length > 0) {
        setTimeout(() => {
            backgroundMeetups.forEach(async (meetup, offsetIndex) => {
                const index = offsetIndex + visibleCount;
                if (meetup.image_url &&
                    typeof meetup.image_url === 'string' &&
                    (!meetup.signed_image_url || shouldRefreshUrl(meetup.signed_image_url))) {
                    try {
                        const signedUrl = await getSignedUrlFromFullUrl(meetup.image_url, expirySeconds, true);
                        if (signedUrl) {
                            const updatedMeetup = {
                                ...meetup,
                                signed_image_url: signedUrl,
                            };
                            if (onUpdate) {
                                onUpdate(updatedMeetup, index);
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Failed to refresh background URL for meetup ${meetup.id || 'unknown'}:`, error);
                    }
                }
            });
        }, 300);
    }
    return updatedMeetups;
};
const shouldRefreshUrl = (url, bufferTimeMs = 15 * 60 * 1000) => {
    const expiresMatch = url.match(/expires=(\d+)/);
    if (!expiresMatch)
        return true;
    const expiryTimestamp = parseInt(expiresMatch[1], 10);
    const currentTime = Date.now();
    return expiryTimestamp - currentTime < bufferTimeMs;
};
export const formatMeetupDistance = (distance) => {
    if (distance === undefined || distance === null)
        return '';
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
};
export const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) {
        return 'just now';
    }
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
};
export async function getMeetupWithSignedImageUrl(meetupId) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        const { data, error } = await supabase.rpc('get_meetup', { p_meetup_id: meetupId });
        if (error) {
            throw error;
        }
        if (data && data.image_url && typeof data.image_url === 'string') {
            try {
                const signedUrl = await getSignedUrlFromFullUrl(data.image_url, 86400, true);
                return { ...data, signed_image_url: signedUrl };
            }
            catch (urlError) {
                logger.error('LocationManager', 'Error getting signed URL for meetup image', urlError);
            }
        }
        return data;
    }
    catch (error) {
        const handledError = handleMeetupError(error, 'get meetup with signed image URL');
        throw new Error(handledError.message);
    }
}
export async function addSignedImageUrlsToMeetups(meetups) {
    try {
        const meetupsWithSignedUrls = await Promise.all(meetups.map(async (meetup) => {
            if (meetup.image_url && typeof meetup.image_url === 'string') {
                try {
                    const signedUrl = await getSignedUrlFromFullUrl(meetup.image_url, 86400, true);
                    return { ...meetup, signed_image_url: signedUrl };
                }
                catch (urlError) {
                    logger.error('LocationManager', 'Error getting signed URL for meetup image', urlError);
                }
            }
            return meetup;
        }));
        return meetupsWithSignedUrls;
    }
    catch (error) {
        const handledError = handleMeetupError(error, 'add signed image URLs to meetups');
        throw new Error(handledError.message);
    }
}
//# sourceMappingURL=index.js.map