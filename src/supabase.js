import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 10) + '...',  // Only log part of the URL for security
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test database connection on initialization
(async () => {
  try {
    const { data, error } = await supabase
      .from('free_meetups')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  } catch (err) {
    console.error('Supabase initialization error:', err);
  }
})();

// Helper function to create a new meetup
export const createNewMeetup = async ({ location, address }) => {
  try {
    console.log('Creating new meetup with data:', { location, address });

    // Validate location data
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid location data:', location);
      throw new Error('Invalid location data: must include lat and lng as numbers');
    }

    const meetupData = {
      location,
      address,
      status: 'active'
    };

    console.log('Sending data to Supabase:', meetupData);

    const { data, error } = await supabase
      .from('free_meetups')
      .insert([meetupData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
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
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

// Helper function to get nearby active meetups
export const getNearbyMeetups = async () => {
  try {
    console.log('Fetching nearby meetups...');
    
    const { data, error } = await supabase
      .from('free_meetups')
      .select('id, location, address, created_at, expires_at, status')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    console.log('Found nearby meetups:', data?.length || 0);
    return { success: true, meetups: data };
  } catch (error) {
    console.error('Error in getNearbyMeetups:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

// Helper function to get a meetup by UUID
export const getMeetupById = async (id) => {
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
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

// Helper function to cancel a meetup
export const cancelMeetup = async (id) => {
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
      hint: error.hint
    });
    return { success: false, error: error.message };
  }
};

export default supabase;

// Supabase helper functions
export const database = {
  // Get data from a table
  get: async (table, query = {}) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(query);
    
    if (error) throw error;
    return data;
  },

  // Insert data into a table
  insert: async (table, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // Update data in a table
  update: async (table, query, updates) => {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .match(query)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Delete data from a table
  delete: async (table, query) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .match(query);
    
    if (error) throw error;
    return true;
  },

  // Get real-time updates
  subscribe: (table, callback) => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: table },
        payload => callback(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};