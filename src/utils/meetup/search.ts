import { getSupabaseClient } from '../../supabase';
import type { MeetupSearchResult } from '../../types/meetup';
import { MeetupSearchOptions } from '../../types/meetup';
import logger from '../Logger';

import { handleMeetupError } from './error-handling';

const MAX_RESULTS = 20;
const DEFAULT_RADIUS = 5000; // 5km in meters

export async function searchNearbyMeetups(
  location: { lat: number; lng: number },
  distanceMeters: number = DEFAULT_RADIUS,
  limit: number = MAX_RESULTS,
  freeOnly: boolean = false
): Promise<MeetupSearchResult[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('search_nearby_meetups', {
      p_lat: location.lat,
      p_lng: location.lng,
      p_radius: distanceMeters,
      p_limit: limit,
      p_free_only: freeOnly,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    const handledError = handleMeetupError(error as Error, 'search nearby meetups');
    throw new Error(handledError.message);
  }
}

export async function isMeetupExpired(meetupId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('is_meetup_expired', { p_meetup_id: meetupId });
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    const handledError = handleMeetupError(error as Error, 'check meetup expiration');
    throw new Error(handledError.message);
  }
}
