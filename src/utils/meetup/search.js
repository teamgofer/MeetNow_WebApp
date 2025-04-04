import { getSupabaseClient } from '../../supabase';
import { handleMeetupError } from './error-handling';
const MAX_RESULTS = 20;
const DEFAULT_RADIUS = 5000;
export async function searchNearbyMeetups(location, distanceMeters = DEFAULT_RADIUS, limit = MAX_RESULTS, freeOnly = false) {
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
    }
    catch (error) {
        const handledError = handleMeetupError(error, 'search nearby meetups');
        throw new Error(handledError.message);
    }
}
export async function isMeetupExpired(meetupId) {
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
    }
    catch (error) {
        const handledError = handleMeetupError(error, 'check meetup expiration');
        throw new Error(handledError.message);
    }
}
//# sourceMappingURL=search.js.map