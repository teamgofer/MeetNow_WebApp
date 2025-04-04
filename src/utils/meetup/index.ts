/**
 * Meetup utilities
 * Provides functionality for managing meetups
 */

import { getSignedUrlFromFullUrl } from '../wasabi-storage';
import { IMeetup } from '../../components/map/MeetupMarkers';
import { getSupabaseClient } from '../../supabase';
import logger from '../Logger';

// Export functions from other meetup utility files
export * from './search';
export * from './validation';
export * from './error-handling';

import { handleMeetupError } from './error-handling';

/**
 * Refresh the signed URLs for meetup images
 * Makes sure images use fresh pre-signed URLs that won't expire
 * Uses staggered loading to prioritize visible meetups
 * @param meetups Array of meetups to refresh
 * @param expirySeconds Expiration time in seconds
 * @param visibleCount Number of meetups that are considered visible and should be loaded first
 * @param onUpdate Optional callback to handle background updates
 * @returns Updated meetups with refreshed signed URLs for visible items
 */
export const refreshMeetupImageUrls = async (
  meetups: IMeetup[],
  expirySeconds: number = 86400,
  visibleCount: number = 5,
  onUpdate?: (meetup: IMeetup, index: number) => void
): Promise<IMeetup[]> => {
  if (!meetups || meetups.length === 0) {
    return [];
  }

  // Create a new array to avoid mutating the original
  const updatedMeetups = [...meetups];

  // Split into visible and background meetups
  const visibleMeetups = updatedMeetups.slice(0, visibleCount);
  const backgroundMeetups = updatedMeetups.slice(visibleCount);

  // Process visible meetups immediately
  await Promise.all(
    visibleMeetups.map(async (meetup, index) => {
      if (
        meetup.image_url &&
        typeof meetup.image_url === 'string' &&
        (!meetup.signed_image_url || shouldRefreshUrl(meetup.signed_image_url))
      ) {
        try {
          // Generate a fresh signed URL with specified expiration
          const signedUrl = await getSignedUrlFromFullUrl(
            meetup.image_url as string,
            expirySeconds,
            true // Anonymous/public access
          );

          if (signedUrl) {
            updatedMeetups[index] = {
              ...meetup,
              signed_image_url: signedUrl,
            };
          }
        } catch (error) {
          console.error(
            `Failed to refresh signed URL for meetup ${meetup.id || 'unknown'}:`,
            error
          );
        }
      }
    })
  );

  // Process background meetups after a short delay
  if (backgroundMeetups.length > 0) {
    setTimeout(() => {
      backgroundMeetups.forEach(async (meetup, offsetIndex) => {
        const index = offsetIndex + visibleCount;

        if (
          meetup.image_url &&
          typeof meetup.image_url === 'string' &&
          (!meetup.signed_image_url || shouldRefreshUrl(meetup.signed_image_url))
        ) {
          try {
            const signedUrl = await getSignedUrlFromFullUrl(
              meetup.image_url as string,
              expirySeconds,
              true
            );

            if (signedUrl) {
              // Create updated meetup object
              const updatedMeetup = {
                ...meetup,
                signed_image_url: signedUrl,
              };

              // Use callback if provided to update state
              if (onUpdate) {
                onUpdate(updatedMeetup, index);
              }
            }
          } catch (error) {
            console.error(
              `Failed to refresh background URL for meetup ${meetup.id || 'unknown'}:`,
              error
            );
          }
        }
      });
    }, 300); // Delay background loading by 300ms
  }

  // Return immediately with visible meetups processed
  return updatedMeetups;
};

/**
 * Check if a signed URL needs refreshing
 * @param url The signed URL to check
 * @param bufferTimeMs Buffer time in milliseconds before expiry (default: 15 minutes)
 * @returns True if the URL should be refreshed
 */
const shouldRefreshUrl = (url: string, bufferTimeMs: number = 15 * 60 * 1000): boolean => {
  // Check if the URL contains an expires parameter
  const expiresMatch = url.match(/expires=(\d+)/);
  if (!expiresMatch) return true; // If no expires parameter, refresh

  const expiryTimestamp = parseInt(expiresMatch[1], 10);
  const currentTime = Date.now();

  // Refresh if the URL will expire within the buffer time
  return expiryTimestamp - currentTime < bufferTimeMs;
};

/**
 * Format the distance to a meetup for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatMeetupDistance = (distance?: number): string => {
  if (distance === undefined || distance === null) return '';

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }

  return `${distance.toFixed(1)}km away`;
};

/**
 * Format time ago for a meetup
 * @param timestamp ISO timestamp string
 * @returns Human-readable time ago string
 */
export const formatTimeAgo = (timestamp: string): string => {
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

/**
 * Get a meetup with a signed image URL
 * @param meetupId ID of the meetup to retrieve
 * @returns Meetup with signed image URL
 */
export async function getMeetupWithSignedImageUrl(meetupId: string): Promise<IMeetup> {
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
        // Generate a signed URL with the isAnonymous flag
        const signedUrl = await getSignedUrlFromFullUrl(data.image_url, 86400, true);
        return { ...data, signed_image_url: signedUrl };
      } catch (urlError) {
        logger.error('LocationManager', 'Error getting signed URL for meetup image', urlError);
      }
    }

    return data;
  } catch (error) {
    const handledError = handleMeetupError(error as Error, 'get meetup with signed image URL');
    throw new Error(handledError.message);
  }
}

/**
 * Add signed image URLs to meetups
 * @param meetups Array of meetups to process
 * @returns Meetups with signed image URLs
 */
export async function addSignedImageUrlsToMeetups(meetups: IMeetup[]): Promise<IMeetup[]> {
  try {
    const meetupsWithSignedUrls = await Promise.all(
      meetups.map(async meetup => {
        if (meetup.image_url && typeof meetup.image_url === 'string') {
          try {
            // Get signed URL from the path with the isAnonymous flag
            const signedUrl = await getSignedUrlFromFullUrl(
              meetup.image_url as string,
              86400,
              true
            );
            return { ...meetup, signed_image_url: signedUrl };
          } catch (urlError) {
            logger.error('LocationManager', 'Error getting signed URL for meetup image', urlError);
          }
        }
        return meetup;
      })
    );

    return meetupsWithSignedUrls;
  } catch (error) {
    const handledError = handleMeetupError(error as Error, 'add signed image URLs to meetups');
    throw new Error(handledError.message);
  }
}
