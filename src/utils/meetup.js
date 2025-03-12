import { database } from '../supabase';
import supabase from '../supabase';

export const createMeetup = async (meetupData) => {
  try {
    console.log('Creating meetup with data:', meetupData);

    if (!meetupData || !meetupData.location || typeof meetupData.location.lat !== 'number' || typeof meetupData.location.lng !== 'number') {
      console.error('Invalid location data:', meetupData?.location);
      throw new Error('Invalid location coordinates');
    }

    // Set start time to now and end time to 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const newMeetup = {
      location: meetupData.location,
      address: meetupData.address || null,
      place_name: meetupData.place_name || null,
      availability: 'Available now for 1 hour',
      user_profile: meetupData.userProfile || { bio: 'Anonymous User' },
      description: meetupData.description || null,
      start_time: now.toISOString(),
      end_time: oneHourLater.toISOString(),
      status: 'active',
      boost: false
    };

    console.log('Attempting to insert meetup:', newMeetup);

    const { data: result, error } = await supabase
      .from('meetups')
      .insert(newMeetup)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Meetup created successfully:', result);
    return { 
      success: true, 
      meetupId: result.id,
      startTime: now,
      endTime: oneHourLater
    };
  } catch (error) {
    console.error('Error creating meetup:', error);
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
    const result = await database.update('meetups', 
      { id: meetupId },
      { 
        boost: true,
        boost_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      }
    );

    return { success: true, meetup: result };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error.message };
  }
};

// New function to join a meetup
export const joinMeetup = async (meetupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Get the current meetup data
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('*')
      .eq('id', meetupId)
      .single();

    if (meetupError || !meetup) {
      throw new Error('Meetup not found');
    }

    // Check if meetup is still active
    if (meetup.status !== 'active') {
      throw new Error('This meetup is no longer active');
    }

    // Check if user is already a participant
    const participants = meetup.participants || [];
    if (participants.includes(user.id)) {
      throw new Error('You are already participating in this meetup');
    }

    // Check max participants limit
    if (meetup.max_participants && participants.length >= meetup.max_participants) {
      throw new Error('This meetup is full');
    }

    // Add user to participants
    const updatedParticipants = [...participants, user.id];
    const result = await database.update('meetups',
      { id: meetupId },
      { participants: updatedParticipants }
    );

    return { success: true, meetup: result };
  } catch (error) {
    console.error('Error joining meetup:', error);
    return { success: false, error: error.message };
  }
};

// New function to leave a meetup
export const leaveMeetup = async (meetupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Authentication required');

    // Get the current meetup data
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('*')
      .eq('id', meetupId)
      .single();

    if (meetupError || !meetup) {
      throw new Error('Meetup not found');
    }

    // Remove user from participants
    const participants = meetup.participants || [];
    const updatedParticipants = participants.filter(id => id !== user.id);
    
    const result = await database.update('meetups',
      { id: meetupId },
      { participants: updatedParticipants }
    );

    return { success: true, meetup: result };
  } catch (error) {
    console.error('Error leaving meetup:', error);
    return { success: false, error: error.message };
  }
};

export const createFreeMeetup = async (meetupData) => {
  try {
    console.log('Creating free meetup with data:', meetupData);
    
    if (!meetupData || !meetupData.location || typeof meetupData.location.lat !== 'number' || typeof meetupData.location.lng !== 'number') {
      console.error('Invalid location data:', meetupData?.location);
      throw new Error('Invalid location coordinates');
    }

    // Get timezone from coordinates using TimeZoneDB
    const timezoneResponse = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=${import.meta.env.VITE_TIMEZONEDB_KEY}&format=json&by=position&lat=${meetupData.location.lat}&lng=${meetupData.location.lng}`
    );
    
    if (!timezoneResponse.ok) {
      console.error('TimeZoneDB response not ok:', await timezoneResponse.text());
      throw new Error('Failed to fetch timezone information');
    }

    const tzData = await timezoneResponse.json();
    console.log('TimeZoneDB response:', tzData);
    
    if (tzData.status !== 'OK') {
      console.error('TimeZoneDB API error:', tzData);
      throw new Error('TimeZoneDB API error: ' + tzData.message);
    }
    
    // Calculate local time at the meetup location
    const now = new Date();
    const gmtOffset = tzData.gmtOffset; // Offset in seconds
    const localTimestamp = now.getTime() + (now.getTimezoneOffset() * 60 + gmtOffset) * 1000;
    const localTime = new Date(localTimestamp);
    
    // Set expiration to 1 hour from local time
    const expirationTime = new Date(localTimestamp + 60 * 60 * 1000);

    // Handle image upload if provided
    let imageUrl = null;
    if (meetupData.image) {
      const { data: imageData, error: uploadError } = await supabase.storage
        .from('meetup-images')
        .upload(`${now.getTime()}-${meetupData.image.name}`, meetupData.image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('meetup-images')
        .getPublicUrl(imageData.path);
      
      imageUrl = publicUrl;
    }

    const newMeetup = {
      location: meetupData.location,
      address: meetupData.address || null,
      title: meetupData.title || 'Instant Meetup',
      description: meetupData.description || null,
      image_url: imageUrl,
      created_at: localTime.toISOString(),
      expires_at: expirationTime.toISOString(),
      timezone: {
        id: tzData.zoneName,
        name: tzData.abbreviation,
        offset: gmtOffset,
        dstOffset: tzData.dst ? 3600 : 0
      },
      status: 'active'
    };

    console.log('Attempting to insert free meetup:', newMeetup);

    const { data: result, error } = await supabase
      .from('free_meetups')
      .insert(newMeetup)
      .select('*, timezone')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Free meetup created successfully:', result);
    return { 
      success: true, 
      meetupId: result.id,
      meetup: result
    };
  } catch (error) {
    console.error('Error creating free meetup:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

export const cancelFreeMeetup = async (meetupId) => {
  try {
    const { data: result, error } = await supabase
      .from('free_meetups')
      .update({ status: 'cancelled' })
      .eq('id', meetupId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, meetup: result };
  } catch (error) {
    console.error('Error cancelling free meetup:', error);
    return { success: false, error: error.message };
  }
};

export const getNearbyFreeMeetups = async (userLocation, radiusKm = 0.5) => {
  try {
    console.log('Fetching meetups within', radiusKm * 1000, 'meters of', userLocation);
    
    const { data: meetups, error } = await supabase
      .from('free_meetups')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Filter and calculate distances
    const nearbyMeetups = meetups
      .map(meetup => {
        try {
          // Extract lat/lng from the location object
          const meetupLat = meetup.location?.lat;
          const meetupLng = meetup.location?.lng;
          
          if (typeof meetupLat !== 'number' || typeof meetupLng !== 'number') {
            console.error('Invalid meetup location:', meetup.location);
            return null;
          }

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            meetupLat,
            meetupLng
          );

          return { 
            ...meetup, 
            distance,
            distanceInMeters: distance * 1000 // Add distance in meters for easier filtering
          };
        } catch (err) {
          console.error('Error calculating distance for meetup:', meetup.id, err);
          return null;
        }
      })
      .filter(meetup => meetup !== null && meetup.distanceInMeters <= radiusKm * 1000)
      .sort((a, b) => a.distanceInMeters - b.distanceInMeters);

    console.log('Found nearby meetups:', nearbyMeetups.length, 'within', radiusKm * 1000, 'meters');
    return { success: true, meetups: nearbyMeetups };
  } catch (error) {
    console.error('Error fetching nearby free meetups:', error);
    return { success: false, error: error.message };
  }
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