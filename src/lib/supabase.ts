import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    }
  }
  // Add global instance type
  interface Window {
    __SUPABASE_INSTANCE__?: SupabaseClient;
  }
}

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

let instance: SupabaseClient | null = null;
let isInitializing = false;
let initializationPromise: Promise<SupabaseClient> | null = null;

const createSupabaseClient = async (): Promise<SupabaseClient> => {
  if (instance) return instance;

  if (isInitializing) {
    if (!initializationPromise) {
      throw new Error('Initialization state is inconsistent');
    }
    return initializationPromise;
  }

  try {
    isInitializing = true;
    
    // Create the initialization promise
    initializationPromise = (async () => {
      // Create client with minimal configuration
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storageKey: 'meetnow-auth',
          storage: window?.localStorage,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'implicit'
        }
      });

      // Initialize auth and wait for it to complete
      await client.auth.initialize();
      console.debug('Supabase auth initialized');

      instance = client;
      return client;
    })();

    return await initializationPromise;
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};

// Export an async getter function
export const getSupabase = async (): Promise<SupabaseClient> => {
  if (!instance) {
    instance = await createSupabaseClient();
  }
  return instance;
};

// Cleanup function
export const cleanupSupabase = (): void => {
  if (instance) {
    try {
      // Remove all subscriptions and listeners
      instance.removeAllChannels();
      instance.auth.onAuthStateChange(() => {});
    } catch (err) {
      console.error('Error during Supabase cleanup:', err);
    }
    instance = null;
  }
};

// Helper function to create a new meetup
export const createNewMeetup = async ({ 
  location, 
  address 
}: { 
  location: { lat: number; lng: number }; 
  address: string;
}) => {
  try {
    const client = await getSupabase();
    const meetupData = {
      location,
      address,
      status: 'active' as const
    };

    const { data, error } = await client
      .from('free_meetups')
      .insert([meetupData])
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, meetup: data };
  } catch (error) {
    console.error('Error creating meetup:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to get nearby meetups
export const getNearbyMeetups = async () => {
  try {
    const client = await getSupabase();
    const { data, error } = await client
      .from('meetups_with_expiry')
      .select('id, location, address, created_at, expires_at, starts_at, duration_minutes, status')
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
    const client = await getSupabase();
    const { data, error } = await client
      .from('meetups_with_expiry')
      .select('id, location, address, created_at, expires_at, starts_at, duration_minutes, status')
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
    const client = await getSupabase();
    const { data, error } = await client
      .from('meetups')
      .update({ status: 'cancelled' })
      .eq('id', id);
      
    if (error) throw error;
    
    // Now get the updated data from the view
    const { data: updatedData, error: fetchError } = await client
      .from('meetups_with_expiry')
      .select('id, location, address, created_at, expires_at, starts_at, duration_minutes, status')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    return { success: true as const, meetup: updatedData };
  } catch (error) {
    console.error('Error in cancelMeetup:', error);
    return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Database helper functions
export const database = {
  get: async <T>(table: string, query = {}) => {
    const client = await getSupabase();
    const { data, error } = await client
      .from(table)
      .select('*')
      .match(query);
    
    if (error) throw error;
    return data as T[];
  },

  insert: async <T>(table: string, data: Partial<T>) => {
    const client = await getSupabase();
    const { data: result, error } = await client
      .from(table)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  },

  update: async <T>(table: string, query: Record<string, any>, updates: Partial<T>) => {
    const client = await getSupabase();
    const { data, error } = await client
      .from(table)
      .update(updates)
      .match(query)
      .select();
    
    if (error) throw error;
    return data as T[];
  },

  delete: async (table: string, query: Record<string, any>) => {
    const client = await getSupabase();
    const { error } = await client
      .from(table)
      .delete()
      .match(query);
    
    if (error) throw error;
    return true;
  },

  subscribe: async <T>(table: string, callback: (payload: T) => void) => {
    const client = await getSupabase();
    const subscription = client
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