// Direct SQL approach to create meetups without using functions
import { supabase } from '../lib/supabase';

/**
 * Create a meetup using direct SQL instead of RPC functions
 * This avoids the stack depth limit issue
 */
export async function createMeetupDirect({
  title = 'Meetup',
  description = null,
  address = 'Unknown location',
  image = null,
  location = null,
  isFree = true,
  durationMinutes = 60,
  maxParticipants = 10,
}) {
  try {
    // Validation
    if (!title) {
      throw new Error('Title is required');
    }

    if (!location?.lat || !location.lng) {
      throw new Error('Valid location with lat/lng is required');
    }

    // Create geography point
    // We need to use a GeoJSON format for direct insertion
    const geoPoint = {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    };

    const startTime = new Date();

    // Direct insert to the meetups table
    const { data, error } = await supabase
      .from('meetups')
      .insert({
        title,
        description,
        address,
        image_url: image,
        // Use the ST_GeomFromGeoJSON function to convert GeoJSON to geography
        location: geoPoint,
        starts_at: startTime,
        duration_minutes: durationMinutes,
        status: 'active',
        is_free_meetup: isFree,
        max_participants: maxParticipants,
        current_participants: 1,
      })
      .select('id, created_at, title, address')
      .single();

    if (error) {
      console.error('Error creating meetup with direct SQL:', error);
      throw error;
    }

    // Calculate expiry for the response
    const expiryTime = new Date(startTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes);

    // Return similar format as the function would
    return {
      id: data.id,
      title: data.title,
      address: data.address,
      created_at: data.created_at,
      starts_at: startTime,
      duration_minutes: durationMinutes,
      expires_at: expiryTime,
      location,
    };
  } catch (error) {
    console.error('Error in createMeetupDirect:', error);
    throw error;
  }
}

/**
 * Create a free meetup with minimal parameters
 */
export async function createFreeMeetupDirect({
  title,
  description = null,
  address,
  image = null,
  location,
}) {
  return createMeetupDirect({
    title,
    description,
    address,
    image,
    location,
    isFree: true,
    durationMinutes: 60,
    maxParticipants: 10,
  });
}
