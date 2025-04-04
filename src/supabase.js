import { createClient } from '@supabase/supabase-js';

import { checkEnvironment } from './utils/env-check';

// Check environment variables first
checkEnvironment();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl?.includes('supabase.co')) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

if (!supabaseAnonKey?.startsWith('eyJ')) {
  throw new Error('Invalid Supabase anonymous key format');
}

// Debug logging for environment variables
console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  url: supabaseUrl,
});

// Create the Supabase client with retries
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-client-info': 'meetnow-webapp' },
    },
  });
};

const supabase = createSupabaseClient();

// Test database connection with retries
let isSupabaseInitialized = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const testConnection = async () => {
  try {
    if (isSupabaseInitialized) return true;

    console.log('Testing connection to:', supabaseUrl);

    const { data, error } = await supabase.from('meetups').select('id').limit(1);

    if (error) {
      console.error('Supabase connection test failed:', {
        error,
        url: supabaseUrl,
        retryCount,
      });

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying connection (${retryCount}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return testConnection();
      }
      return false;
    }

    console.log('Supabase connection test successful');
    isSupabaseInitialized = true;
    window.dispatchEvent(
      new CustomEvent('supabase-ready', {
        detail: { timestamp: Date.now() },
      })
    );
    return true;
  } catch (err) {
    console.error('Supabase initialization error:', {
      error: err,
      url: supabaseUrl,
      retryCount,
    });
    return false;
  }
};

// Initialize connection immediately and handle errors
(async () => {
  try {
    const success = await testConnection();
    if (!success) {
      console.error('Failed to initialize Supabase after retries');
    }
  } catch (err) {
    console.error('Fatal error initializing Supabase:', err);
  }
})();

// Helper function to check if Supabase is ready
export const isSupabaseReady = () => isSupabaseInitialized;

// Helper function to create a new meetup
export const createNewMeetup = async ({ location, address }) => {
  try {
    console.log('Creating new meetup with data:', { location, address });

    // Validate location data
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid location data:', location);
      throw new Error('Invalid location data: must include lat and lng as numbers');
    }

    // Format location as GeoJSON Point
    const formattedLocation = {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    };

    // Calculate starts_at and expires_at
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Prepare the meetup data matching the table schema
    const meetupData = {
      title: 'Instant Meetup',
      description: null,
      location: formattedLocation,
      address: address,
      image_url: null,
      starts_at: now.toISOString(),
      expires_at: oneHourLater.toISOString(),
      is_free_meetup: true,
      status: 'active',
    };

    console.log('Creating meetup with data:', meetupData);

    // Insert directly into the meetups table
    const { data, error } = await supabase.from('meetups').insert([meetupData]).select().single();

    if (error) {
      console.error('Error creating meetup:', error);
      throw error;
    }

    console.log('Meetup created successfully:', data);
    return { success: true, meetup: data };
  } catch (error) {
    console.error('Error creating meetup:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }
};

// Helper function to get nearby active meetups
export const getNearbyMeetups = async (latitude, longitude, radius = 5000) => {
  try {
    console.log('Fetching nearby meetups...');

    // Use client-side spatial filtering when coordinates are provided
    if (latitude && longitude) {
      console.log(
        `Using client-side spatial filtering at (${latitude}, ${longitude}) with radius ${radius}m`
      );

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

      console.log(`Found ${data.length} active meetups, filtering by distance...`);

      // Process and filter meetups on the client side
      const filteredMeetups = data
        // Only process meetups with valid locations
        .filter(meetup => {
          // Extract location coordinates
          let meetupLat, meetupLng;

          if (meetup.location) {
            // Handle different location formats
            if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
              const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) {
                meetupLng = parseFloat(match[1]);
                meetupLat = parseFloat(match[2]);
              }
            } else if (typeof meetup.location === 'object') {
              meetupLat = meetup.location.lat || meetup.location.latitude;
              meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
            }
          }

          return meetupLat && meetupLng; // Filter out meetups without valid coordinates
        })
        // Calculate distance and add it to each meetup
        .map(meetup => {
          let meetupLat, meetupLng;

          // Extract coordinates from location object/string
          if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
            const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              meetupLng = parseFloat(match[1]);
              meetupLat = parseFloat(match[2]);
            }
          } else if (typeof meetup.location === 'object') {
            meetupLat = meetup.location.lat || meetup.location.latitude;
            meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
          }

          // Calculate distance using Haversine formula
          const distanceKm = calculateDistance(latitude, longitude, meetupLat, meetupLng);

          // Convert to meters
          const distance = distanceKm * 1000;

          return {
            ...meetup,
            distance_meters: distance,
            location: { lat: meetupLat, lng: meetupLng }, // Normalize location format
          };
        })
        // Filter by distance
        .filter(meetup => meetup.distance_meters <= radius)
        // Sort by distance (closest first)
        .sort((a, b) => a.distance_meters - b.distance_meters)
        // Limit to a reasonable number
        .slice(0, 50);

      console.log(`Found ${filteredMeetups.length} nearby meetups after client-side filtering`);
      return { success: true, meetups: filteredMeetups };
    }

    // Fallback to simple query if no coordinates
    const { data, error } = await supabase
      .from('meetups_with_expiry')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .limit(50);

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    console.log('Found meetups:', data.length || 0);
    return { success: true, meetups: data };
  } catch (error) {
    console.error('Error in getNearbyMeetups:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }
};

// Haversine formula for calculating distance between two points on Earth
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Helper function to get a meetup by UUID
export const getMeetupById = async id => {
  try {
    console.log('Fetching meetup by ID:', id);

    const { data, error } = await supabase
      .from('free_meetups')
      .select('id, location, address, created_at, expires_at, status')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching meetup:', error);
      throw error;
    }

    console.log('Found meetup:', data);
    return { success: true, meetup: data };
  } catch (error) {
    console.error('Error in getMeetupById:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }
};

// Helper function to cancel a meetup
export const cancelMeetup = async id => {
  try {
    console.log('Cancelling meetup:', id);

    const { data, error } = await supabase
      .from('free_meetups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('id, location, address, created_at, expires_at, status')
      .single();

    if (error) {
      console.error('Error cancelling meetup:', error);
      throw error;
    }

    console.log('Meetup cancelled successfully:', data);
    return { success: true, meetup: data };
  } catch (error) {
    console.error('Error in cancelMeetup:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }
};

// Function to get the Supabase client
export const getSupabaseClient = () => {
  return supabase;
};

// Export the Supabase client as default
export default supabase;

// Supabase helper functions
export const database = {
  // Get data from a table
  get: async (table, query = {}) => {
    const { data, error } = await supabase.from(table).select('*').match(query);

    if (error) throw error;
    return data;
  },

  // Insert data into a table
  insert: async (table, data) => {
    const { data: result, error } = await supabase.from(table).insert([data]).select().single();

    if (error) throw error;
    return result;
  },

  // Update data in a table
  update: async (table, query, updates) => {
    const { data, error } = await supabase.from(table).update(updates).match(query).select();

    if (error) throw error;
    return data;
  },

  // Delete data from a table
  delete: async (table, query) => {
    const { error } = await supabase.from(table).delete().match(query);

    if (error) throw error;
    return true;
  },

  // Get real-time updates
  subscribe: (table, callback) => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload =>
        callback(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
