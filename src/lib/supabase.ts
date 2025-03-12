import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to create a new meetup
export const createNewMeetup = async ({ 
  location, 
  address 
}: { 
  location: { lat: number; lng: number }; 
  address: string;
}) => {
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
      status: 'active' as const
    };

    const { data, error } = await supabase
      .from('free_meetups')
      .insert([meetupData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return { success: true as const, meetup: data };
  } catch (error) {
    console.error('Error creating meetup:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to get nearby active meetups
export const getNearbyMeetups = async () => {
  try {
    const { data, error } = await supabase
      .from('free_meetups')
      .select('id, location, address, created_at, expires_at, status')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return { success: true as const, meetups: data };
  } catch (error) {
    console.error('Error in getNearbyMeetups:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to get a meetup by UUID
export const getMeetupById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('free_meetups')
      .select('id, location, address, created_at, expires_at, status')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true as const, meetup: data };
  } catch (error) {
    console.error('Error in getMeetupById:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to cancel a meetup
export const cancelMeetup = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('free_meetups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('id, location, address, created_at, expires_at, status')
      .single();

    if (error) throw error;

    return { success: true as const, meetup: data };
  } catch (error) {
    console.error('Error in cancelMeetup:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Supabase helper functions with TypeScript types
export const database = {
  // Get data from a table
  get: async <T>(table: string, query = {}) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(query);
    
    if (error) throw error;
    return data as T[];
  },

  // Insert data into a table
  insert: async <T>(table: string, data: Partial<T>) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  },

  // Update data in a table
  update: async <T>(table: string, query: Record<string, any>, updates: Partial<T>) => {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .match(query)
      .select();
    
    if (error) throw error;
    return data as T[];
  },

  // Delete data from a table
  delete: async (table: string, query: Record<string, any>) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .match(query);
    
    if (error) throw error;
    return true;
  },

  // Get real-time updates
  subscribe: <T>(table: string, callback: (payload: T) => void) => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: table },
        payload => callback(payload as T)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}; 