import supabase, { getSupabaseClient } from '../supabase';
import { toPostGISPoint, fromPostGISPoint, processPostGISMeetups, getSearchRadiusFromZoom } from './geo-utils';
import { searchLocations } from './location-services';

// Get server time
export const getServerTime = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_server_time');
    
    if (error) {
      console.error('Error getting server time:', error);
      return null;
    }
    
    return new Date(data);
  } catch (error) {
    console.error('Error in getServerTime:', error);
    return null;
  }
};

/**
 * Creates a meetup with the given data
 * @param {Object} meetupData - The meetup data
 * @param {number} meetupData.lat - Latitude of the meetup location
 * @param {number} meetupData.lng - Longitude of the meetup location
 * @param {string} meetupData.address - Address of the meetup
 * @param {string} meetupData.title - Title of the meetup
 * @param {string} meetupData.description - Description of the meetup
 * @param {File} meetupData.image - Image for the meetup
 * @param {number} meetupData.duration - Duration of the meetup in minutes (default: 60)
 * @returns {Promise<Object>} - The created meetup
 */
export const createMeetup = async ({ lat, lng, address, title, description, image, duration = 60, user_id = null }) => {
  // Validate parameters
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid location coordinates');
    }

  // Always get a proper address from coordinates before storing in database
  // This ensures we never store "Your location" or coordinate strings
  let addressToStore = address;
  
  // If address is missing or looks like a placeholder, get a real address from coordinates
  if (!address || 
      typeof address !== 'string' || 
      address.includes('Your location') ||
      address.includes('Location at') ||
      address.includes('coordinates')) {
    
    console.log('Getting proper address from coordinates for storage in database');
    try {
      const locationData = await searchLocations(`${lat},${lng}`, 1);
      if (locationData && locationData.length > 0 && locationData[0].display_name) {
        addressToStore = locationData[0].display_name;
        console.log('Successfully geocoded address for database:', addressToStore);
      } else {
        addressToStore = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        console.log('Geocoding failed, using coordinates as fallback:', addressToStore);
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      addressToStore = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  if (!title) {
    title = 'Instant Meetup';
  }

  // Ensure duration is a number and at least 60 minutes
  duration = Number(duration) || 60;
  if (duration < 60) {
    duration = 60;
  }

  // Server should calculate expiry time based on duration (current time + duration)
  // We're simply preparing the data to send to the server
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Format the meetup data - we don't include expiry time as the server will calculate it
    const meetupData = {
      title,
      description: description || null,
      address: addressToStore, // Use our properly geocoded address
      lat,
      lng,
      status: 'active',
      user_id,
      duration_minutes: duration // Server will use this to calculate expiry
    };

    console.log('Creating meetup with data:', {
      ...meetupData,
      address_source: address === addressToStore ? 'user provided' : 'geocoded from coordinates'
    });

    // Upload image if provided
    if (image) {
      // Generate a unique filename
      const timestamp = Date.now();
      const extension = image.name.split('.').pop();
      const filename = `meetup_${timestamp}.${extension}`;
      const filePath = `meetups/${filename}`;

      // Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meetup-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('meetup-images')
        .getPublicUrl(filePath);

      if (urlData && urlData.publicUrl) {
        meetupData.image_url = urlData.publicUrl;
      }
    }

    // Call the create_meetup RPC function
    const { data, error } = await supabase.rpc('create_meetup', {
      p_title: meetupData.title,
      p_description: meetupData.description,
      p_address: meetupData.address,
      p_lat: meetupData.lat,
      p_lng: meetupData.lng,
      p_image: meetupData.image_url || null,
      p_user_id: meetupData.user_id,
      p_duration_minutes: meetupData.duration_minutes
    });

    if (error) {
      console.error('Error creating meetup:', error);
      throw new Error(error.message || 'Failed to create meetup');
    }

    return data;
  } catch (error) {
    console.error('Create meetup error:', error);
    throw error;
  }
};

/**
 * Creates a free meetup (1-hour to multi-hour meetup)
 * @param {Object} meetupData - The meetup data
 * @param {Object} meetupData.location - Location coordinates
 * @param {string} meetupData.address - Address of the meetup
 * @param {string} meetupData.title - Title of the meetup
 * @param {string} meetupData.description - Description of the meetup
 * @param {File} meetupData.image - Image for the meetup
 * @param {number} meetupData.duration - Duration of the meetup in minutes (default: 60)
 * @returns {Promise<Object>} - The created meetup
 */
export const createFreeMeetup = async ({ location, address, title, description, image, duration = 60 }) => {
  try {
    // Get the current user if logged in
    const supabase = getSupabaseClient();
    let userId = null;
    
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        userId = data.user.id;
      }
    }

    return await createMeetup({
      lat: location.lat,
      lng: location.lng,
      address,
      title,
      description,
      image,
      duration,
      user_id: userId
    });
  } catch (error) {
    console.error('Create free meetup error:', error);
    throw error;
  }
};

// Join a meetup
export const joinMeetup = async (meetupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Get the current meetup data
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups_with_expiry') // Use the view that has expires_at
      .select('*, profiles!creator_id(*)')
      .eq('id', meetupId)
      .single();

    if (meetupError || !meetup) {
      throw new Error('Meetup not found');
    }

    // Check if meetup is still active
    if (meetup.status !== 'active') {
      throw new Error('This meetup is no longer active');
    }

    // Check if expired
    if (new Date(meetup.expires_at) < new Date()) {
      throw new Error('This meetup has expired');
    }

    // Check if user is already a participant
    const { data: existingParticipant, error: participantError } = await supabase
      .from('meetup_participants')
      .select('*')
      .eq('meetup_id', meetupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipant) {
      throw new Error('You are already participating in this meetup');
    }

    // Check max participants limit
    if (meetup.current_participants >= meetup.max_participants) {
      throw new Error('This meetup is full');
    }

    // Add user to participants
    const { error: insertError } = await supabase
      .from('meetup_participants')
      .insert({
        meetup_id: meetupId,
        user_id: user.id
      });

    if (insertError) {
      throw insertError;
    }

    return { success: true, meetup: processPostGISMeetups(meetup) };
  } catch (error) {
    console.error('Error joining meetup:', error);
    return { success: false, error: error.message };
  }
};

// Leave a meetup
export const leaveMeetup = async (meetupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Check if user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('meetup_participants')
      .select('*')
      .eq('meetup_id', meetupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (participantError || !participant) {
      throw new Error('You are not a participant in this meetup');
    }

    // Remove participant record
    const { error: deleteError } = await supabase
      .from('meetup_participants')
      .delete()
      .eq('meetup_id', meetupId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error leaving meetup:', error);
    return { success: false, error: error.message };
  }
};

// Cancel a meetup (for creators)
export const cancelMeetup = async (meetupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Check if user is the creator
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('creator_id')
      .eq('id', meetupId)
      .single();

    if (meetupError || !meetup) {
      throw new Error('Meetup not found');
    }

    if (meetup.creator_id !== user.id) {
      throw new Error('Only the creator can cancel a meetup');
    }

    // Update meetup status to cancelled
    const { data: result, error: updateError } = await supabase
      .from('meetups')
      .update({ status: 'cancelled' })
      .eq('id', meetupId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return { success: true, meetup: processPostGISMeetups(result) };
  } catch (error) {
    console.error('Error cancelling meetup:', error);
    return { success: false, error: error.message };
  }
};

// Get nearby meetups
export const getNearbyMeetups = async (userLocation, zoomLevel = 14) => {
  try {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
      throw new Error('Invalid user location');
    }

    console.log('Fetching nearby meetups for location:', userLocation);
    
    // Calculate search radius based on zoom level
    const radiusMeters = getSearchRadiusFromZoom(zoomLevel);
    
    // Use the database function for spatial search
    const { data: meetups, error } = await supabase
      .rpc('nearby_meetups', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius_meters: radiusMeters,
        max_results: 50
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Process the results to convert PostGIS points to lat/lng format
    const processedMeetups = processPostGISMeetups(meetups);
    
    console.log(`Found ${processedMeetups.length} nearby meetups within ${radiusMeters}m`);
    return { success: true, meetups: processedMeetups };
  } catch (error) {
    console.error('Error fetching nearby meetups:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

export const handleToken = async (token, meetupId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Verify user owns the meetup
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('user_id')
      .eq('id', meetupId)
      .single();

    if (meetupError || !meetup) {
      throw new Error('Meetup not found');
    }

    if (meetup.user_id !== user.id) {
      throw new Error('Unauthorized: You can only boost your own meetups');
    }

    // Update the meetup with boost information
    const result = await supabase.update('meetups')
      .set({
        boost: true,
        boost_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      .eq('id', meetupId);

    return { success: true, meetup: result };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to calculate expires_at from starts_at and duration_minutes
export const calculateExpiresAt = (startsAt, durationMinutes) => {
  if (!startsAt || !durationMinutes) return null;
  
  const start = new Date(startsAt);
  if (isNaN(start.getTime())) return null;
  
  const expiryTime = new Date(start);
  expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes);
  return expiryTime.toISOString();
};

// Process meetup data to ensure expires_at is available
export const ensureExpiresAt = (meetup) => {
  if (!meetup) return meetup;
  
  const processed = { ...meetup };
  
  // If expires_at is not directly provided, calculate it
  if (!processed.expires_at && processed.starts_at && processed.duration_minutes) {
    processed.expires_at = calculateExpiresAt(processed.starts_at, processed.duration_minutes);
  }
  
  return processed;
};

// Process an array of meetups to ensure expires_at is available
export const ensureExpiresAtForAll = (meetups) => {
  if (!meetups || !Array.isArray(meetups)) return meetups;
  return meetups.map(meetup => ensureExpiresAt(meetup));
};

export const cancelFreeMeetup = async (meetupId) => {
  try {
    console.log('Cancelling meetup:', meetupId);
    
    // Now with unified schema, we can just update the meetups table directly
    const { data: result, error } = await supabase
      .from('meetups')
      .update({ status: 'cancelled' })
      .eq('id', meetupId)
      .select()
      .single();

    if (error) {
      console.error('Error in cancelFreeMeetup:', error);
      throw error;
    }

    console.log('Meetup cancelled successfully:', result);
    
    // Calculate expires_at for backwards compatibility if needed
    let meetupData = { ...result };
    if (!meetupData.expires_at && meetupData.starts_at && meetupData.duration_minutes) {
      const expiryTime = new Date(meetupData.starts_at);
      expiryTime.setMinutes(expiryTime.getMinutes() + meetupData.duration_minutes);
      meetupData.expires_at = expiryTime.toISOString();
    }
    
    return { success: true, meetup: meetupData };
  } catch (error) {
    console.error('Error cancelling free meetup:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

export const getNearbyFreeMeetups = async (userLat, userLng, radius = 5000, filters = {}) => {
  try {
    // Check if arguments are valid
    if (userLat === null || userLng === null || 
        userLat === undefined || userLng === undefined) {
      console.error('getNearbyFreeMeetups called with invalid coordinates:', { userLat, userLng });
      return { success: false, error: 'Invalid user location' };
    }

    // Ensure numeric values
    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);

    // Validate lat/lng values
    if (isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180) {
      console.error('getNearbyFreeMeetups called with invalid coordinate values:', { lat, lng });
      return { success: false, error: 'Invalid latitude or longitude values' };
    }

    console.log('Fetching nearby meetups for USER location:', { lat, lng }, 'with radius:', radius);
    
    // Calculate radius based on zoom level to get appropriate search distance
    const getRadiusFromZoom = (zoom) => {
      if (zoom >= 18) return 0.25;  // 250m
      if (zoom >= 16) return 1;     // 1km
      if (zoom >= 14) return 2.5;   // 2.5km
      if (zoom >= 12) return 5;     // 5km
      if (zoom >= 10) return 10;    // 10km
      if (zoom >= 8) return 25;     // 25km
      return 50;                    // 50km
    };

    const radiusKm = getRadiusFromZoom(14);
    const radiusMeters = radiusKm * 1000;

    // Use client-side filtering with the user's current location
    console.log(`Using client-side filtering with USER location and radius ${radiusMeters}m`);
    
    // Fetch all active meetups
    const { data, error } = await supabase
      .from('meetups_with_expiry')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No active meetups found');
      return { success: true, meetups: [] };
    }

    console.log(`Found ${data.length} active meetups, filtering by distance from USER...`);
    console.log('[DEBUG] Active meetups:', data.map(m => ({
      id: m.id, 
      title: m.title,
      location: m.location,
      hasLocation: !!m.location,
      locationFormat: m.location ? typeof m.location : 'undefined'
    })));

    // Process and filter meetups on the client side
    const meetupsWithValidLocation = data
      // Filter for free meetups
      .filter(meetup => meetup.is_free_meetup)
      // Only process meetups with valid locations
      .filter(meetup => {
        // Extract location coordinates
        let meetupLat, meetupLng;
        
      if (meetup.location) {
          // Handle different location formats
          if (typeof meetup.location === 'string') {
            // PostGIS hex format (like 0101000020E61000000100009F1F425DC060D625CF8B444040)
            if (meetup.location.startsWith('01')) {
              try {
                const point = fromPostGISPoint(meetup.location);
                if (point && point.lat && point.lng) {
                  meetupLat = point.lat;
                  meetupLng = point.lng;
                }
              } catch (err) {
                console.error(`Error parsing PostGIS point for meetup ${meetup.id}:`, err);
              }
            }
            // Standard WKT format (like POINT(lng lat))
            else if (meetup.location.startsWith('POINT')) {
          const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
                meetupLng = parseFloat(match[1]);
                meetupLat = parseFloat(match[2]);
              }
            }
          } else if (typeof meetup.location === 'object') {
            meetupLat = meetup.location.lat || meetup.location.latitude;
            meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
          }
        }
        
        const hasValidCoords = !!(meetupLat && meetupLng);
        if (!hasValidCoords) {
          console.log(`[DEBUG] Meetup ${meetup.id} skipped - invalid coordinates:`, meetup.location);
        } else {
          console.log(`[DEBUG] Meetup ${meetup.id} has valid coordinates: ${meetupLat}, ${meetupLng}`);
        }
        return hasValidCoords; // Filter out meetups without valid coordinates
      });
    
    console.log(`[DEBUG] Found ${meetupsWithValidLocation.length} meetups with valid coordinates`);
    
    // If we have no meetups with valid locations, return early
    if (meetupsWithValidLocation.length === 0) {
      console.log('No meetups with valid locations found');
      return { success: true, meetups: [] };
    }
    
    // Continue processing meetups with valid locations
    const filteredMeetups = meetupsWithValidLocation
      // Calculate distance from USER's location and add it to each meetup
      .map(meetup => {
        let meetupLat, meetupLng;
        
        // Extract coordinates from location object/string
        if (typeof meetup.location === 'string') {
          // PostGIS hex format (like 0101000020E61000000100009F1F425DC060D625CF8B444040)
          if (meetup.location.startsWith('01')) {
            try {
              const point = fromPostGISPoint(meetup.location);
              if (point && point.lat && point.lng) {
                meetupLat = point.lat;
                meetupLng = point.lng;
              }
            } catch (err) {
              console.error(`Error parsing PostGIS point for meetup ${meetup.id}:`, err);
            }
          }
          // Standard WKT format (like POINT(lng lat))
          else if (meetup.location.startsWith('POINT')) {
            const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              meetupLng = parseFloat(match[1]);
              meetupLat = parseFloat(match[2]);
            }
          }
        } else if (typeof meetup.location === 'object') {
          meetupLat = meetup.location.lat || meetup.location.latitude;
          meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
        }
        
        // Calculate distance using Haversine formula from USER location
        const distanceKm = calculateDistance(
          lat, 
          lng, 
          meetupLat, 
          meetupLng
        );
        
        // Convert to meters
        const distance = distanceKm * 1000;
      
      // Format distance for display
        let distance_formatted;
        if (distance < 1000) {
          distance_formatted = `${Math.round(distance)}m`;
        } else {
          distance_formatted = `${(distance / 1000).toFixed(1)}km`;
        }
        
        console.log(`[DEBUG] Meetup ${meetup.id} distance: ${distance}m (${distanceKm}km) from ${lat},${lng} to ${meetupLat},${meetupLng}`);
        
        return {
          ...meetup,
          distance_meters: distance,
          distance_formatted,
          location: { lat: meetupLat, lng: meetupLng } // Normalize location format
        };
      })
      // Filter by distance from USER
      .filter(meetup => {
        const isNearby = meetup.distance_meters <= radiusMeters;
        if (!isNearby) {
          console.log(`[DEBUG] Meetup ${meetup.id} filtered out - too far: ${meetup.distance_meters}m > ${radiusMeters}m`);
        }
        return isNearby;
      })
      // Sort by distance from USER (closest first)
      .sort((a, b) => a.distance_meters - b.distance_meters)
      // Apply limit
      .slice(0, 50);

    console.log(`Found ${filteredMeetups.length} nearby meetups after client-side filtering based on USER location`);
    
    // If debugging, show the ones we found
    if (filteredMeetups.length > 0) {
      console.log('[DEBUG] Nearby meetups:', filteredMeetups.map(m => ({
        id: m.id,
        title: m.title,
        distance: m.distance_meters,
        formatted: m.distance_formatted
      })));
    }
    
    return { success: true, meetups: filteredMeetups };
  } catch (error) {
    console.error('Error fetching nearby free meetups:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

// Calculate bearing between two points
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDeg(θ) + 360) % 360;
  return bearing;
};

const toDeg = (rad) => {
  return rad * (180 / Math.PI);
};

// More accurate distance calculation using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Search for nearby meetups
 */
export async function searchNearbyMeetups(location, distanceMeters = 5000, limit = 20, freeOnly = false) {
  try {
    if (!location || !location.lat || !location.lng) {
      console.error('Valid location with lat/lng is required');
      throw new Error('Valid location with lat/lng is required');
    }

    // Fetch all active meetups without spatial filtering
    console.log(`Fetching meetups for client-side filtering within ${distanceMeters}m`);
    
    const { data, error } = await supabase
      .from('meetups_with_expiry')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    console.log(`[DEBUG] Found ${data.length} active meetups, processing location formats:`, 
      data.map(m => ({id: m.id, location: m.location, hasLocation: !!m.location})));

    // Process and filter meetups on the client side
    const filteredMeetups = data
      // Filter by meetup type if needed
      .filter(meetup => !freeOnly || meetup.is_free_meetup)
      // Only process meetups with valid locations
      .filter(meetup => {
        // Extract location coordinates
        let lat, lng;
        
        if (meetup.location) {
          // Handle different location formats
          if (typeof meetup.location === 'string') {
            // PostGIS hex format (like 0101000020E61000000100009F1F425DC060D625CF8B444040)
            if (meetup.location.startsWith('01')) {
              try {
                const point = fromPostGISPoint(meetup.location);
                if (point && point.lat && point.lng) {
                  lat = point.lat;
                  lng = point.lng;
                }
              } catch (err) {
                console.error(`Error parsing PostGIS point for meetup ${meetup.id}:`, err);
              }
            }
            // Standard WKT format (like POINT(lng lat))
            else if (meetup.location.startsWith('POINT')) {
              const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) {
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
              }
            }
          } else if (typeof meetup.location === 'object') {
            lat = meetup.location.lat || meetup.location.latitude;
            lng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
          }
        }
        
        const hasValidCoords = !!(lat && lng);
        if (!hasValidCoords) {
          console.log(`[DEBUG] Meetup ${meetup.id} skipped - invalid coordinates:`, meetup.location);
        } else {
          console.log(`[DEBUG] Meetup ${meetup.id} has valid coordinates: ${lat}, ${lng}`);
        }
        return hasValidCoords; // Filter out meetups without valid coordinates
      })
      // Calculate distance and add it to each meetup
      .map(meetup => {
        let lat, lng;
        
        // Extract coordinates from location object/string
        if (typeof meetup.location === 'string') {
          // PostGIS hex format (like 0101000020E61000000100009F1F425DC060D625CF8B444040)
          if (meetup.location.startsWith('01')) {
            try {
              const point = fromPostGISPoint(meetup.location);
              if (point && point.lat && point.lng) {
                lat = point.lat;
                lng = point.lng;
              }
            } catch (err) {
              console.error(`Error parsing PostGIS point for meetup ${meetup.id}:`, err);
            }
          }
          // Standard WKT format (like POINT(lng lat))
          else if (meetup.location.startsWith('POINT')) {
            const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              lng = parseFloat(match[1]);
              lat = parseFloat(match[2]);
            }
          }
        } else if (typeof meetup.location === 'object') {
          lat = meetup.location.lat || meetup.location.latitude;
          lng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
        }
        
        // Calculate distance using Haversine formula
        const distanceKm = calculateDistance(
          location.lat, 
          location.lng, 
          lat, 
          lng
        );
        
        // Convert to meters
        const distance = distanceKm * 1000;
        
        console.log(`[DEBUG] Meetup ${meetup.id} distance: ${distance}m (${distanceKm}km) from ${location.lat},${location.lng} to ${lat},${lng}`);
        
        return {
          ...meetup,
          distance_meters: distance,
          location: { lat, lng } // Normalize location format
        };
      })
      // Filter by distance
      .filter(meetup => {
        const isNearby = meetup.distance_meters <= distanceMeters;
        if (!isNearby) {
          console.log(`[DEBUG] Meetup ${meetup.id} filtered out - too far: ${meetup.distance_meters}m > ${distanceMeters}m`);
        }
        return isNearby;
      })
      // Sort by distance (closest first)
      .sort((a, b) => a.distance_meters - b.distance_meters)
      // Apply limit
      .slice(0, limit);

    console.log(`Found ${filteredMeetups.length} nearby meetups after client-side filtering`);
    return filteredMeetups;
  } catch (error) {
    console.error('Error in searchNearbyMeetups:', error);
    throw error;
  }
}

/**
 * Check if a meetup is expired
 */
export async function isMeetupExpired(meetupId) {
  try {
    const { data, error } = await supabase.rpc('is_meetup_expired', {
      p_meetup_id: meetupId
    });

    if (error) {
      console.error('Error checking if meetup is expired:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    console.error('Error in isMeetupExpired:', error);
    throw error;
  }
}