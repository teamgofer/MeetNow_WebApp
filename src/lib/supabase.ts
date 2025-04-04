import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { processPostGISMeetups, calculateDistance } from './geo-utils';

// Instead of redefining ImportMeta, extend the existing ImportMetaEnv
declare global {
  interface ImportMetaEnv {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  }
  // Add global instance type
  interface Window {
    __SUPABASE_INSTANCE__?: SupabaseClient;
  }
}

// Add debugging information
const DEBUG_SUPABASE = true;

// Use a global singleton instance if possible
const getGlobalInstance = (): SupabaseClient | null => {
  if (typeof window !== 'undefined' && window.__SUPABASE_INSTANCE__) {
    if (DEBUG_SUPABASE) console.debug('[Supabase] Using existing global instance');
    return window.__SUPABASE_INSTANCE__;
  }
  return null;
};

const setGlobalInstance = (instance: SupabaseClient): void => {
  if (typeof window !== 'undefined') {
    if (DEBUG_SUPABASE) console.debug('[Supabase] Setting global instance');
    window.__SUPABASE_INSTANCE__ = instance;
  }
};

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Type-safe instance variable
let instance: SupabaseClient | null = null;
let isInitializing = false;
let initializationPromise: Promise<SupabaseClient> | null = null;

const createSupabaseClient = async (): Promise<SupabaseClient> => {
  // First check if we already have an instance
  instance = instance || getGlobalInstance();
  if (instance) return instance;

  if (isInitializing) {
    if (!initializationPromise) {
      throw new Error('Initialization state is inconsistent');
    }
    if (DEBUG_SUPABASE)
      console.debug('[Supabase] Already initializing, returning existing promise');
    return initializationPromise;
  }

  try {
    isInitializing = true;
    if (DEBUG_SUPABASE) console.debug('[Supabase] Starting initialization');

    // Create the initialization promise
    initializationPromise = (async () => {
      // Create client with minimal configuration
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storageKey: 'meetnow-auth',
          storage: window.localStorage,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'implicit',
        },
      });

      // Initialize auth and wait for it to complete
      await client.auth.initialize();
      if (DEBUG_SUPABASE) console.debug('[Supabase] Auth initialized');

      instance = client;
      // Store in global context
      setGlobalInstance(client);
      if (DEBUG_SUPABASE) console.debug('[Supabase] Client fully initialized');
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
  // Check for existing instance first
  instance = instance || getGlobalInstance();
  if (!instance) {
    if (DEBUG_SUPABASE) console.debug('[Supabase] No instance found, creating new client');
    instance = await createSupabaseClient();
  } else {
    if (DEBUG_SUPABASE) console.debug('[Supabase] Using existing client instance');
  }
  return instance;
};

// Cleanup function
export const cleanupSupabase = (): void => {
  instance = instance || getGlobalInstance();
  if (instance) {
    if (DEBUG_SUPABASE) console.debug('[Supabase] Running cleanup');
    try {
      // Remove all subscriptions and listeners
      instance.removeAllChannels();
      instance.auth.onAuthStateChange(() => {});
    } catch (err) {
      console.error('[Supabase] Error during cleanup:', err);
    }
    // Clear the instance - set to null which is a valid type
    instance = null;
    // Clear the global instance
    if (typeof window !== 'undefined') {
      // Use type assertion to handle the undefined assignment
      (window as any).__SUPABASE_INSTANCE__ = undefined;
    }
  }
};

// Helper function to create a new meetup
export const createNewMeetup = async ({
  title,
  description,
  location,
  address,
  image,
}: {
  title?: string;
  description?: string;
  location: { lat: number; lng: number };
  address: string;
  image?: string; // Add image parameter
}) => {
  try {
    const client = await getSupabase();

    // Prepare parameters for the RPC function
    const rpcParams = {
      p_title: title || 'Instant Meetup',
      p_description: description || null,
      p_address: address,
      p_lat: location.lat,
      p_lng: location.lng,
      p_image: image || null, // Use the image path if provided
      p_user_id: null, // Anonymous user
      p_duration_minutes: 60, // 1 hour duration
    };

    // Call the RPC function that bypasses row-level security
    const { data, error } = await client.rpc('create_meetup', rpcParams);

    if (error) throw error;
    return { success: true as const, meetup: data };
  } catch (error) {
    console.error('Error creating meetup:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Helper function to get nearby meetups
export const getNearbyMeetups = async (lat: number, lng: number, radiusMeters: number = 5000) => {
  try {
    const client = await getSupabase();
    console.log(`Fetching nearby meetups at (${lat}, ${lng}) with radius ${radiusMeters}m`);

    // Use meetups_with_expiry view which has expires_at calculated
    const { data, error } = await client
      .from('meetups_with_expiry')
      .select('*') // Select all fields
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Database error when fetching meetups:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} active meetups in database`);

    if (!data || data.length === 0) {
      console.log('No active meetups found in database');
      return { success: true as const, meetups: [] };
    }

    // Process the meetups to convert PostGIS points to lat/lng format
    const processedMeetups = processPostGISMeetups(data);

    // Add distance to each meetup
    const meetupsWithDistance = processedMeetups
      .map((meetup: any) => {
        const meetupLat = meetup.location?.lat || 0;
        const meetupLng = meetup.location?.lng || 0;

        // Calculate distance using Haversine formula
        const distanceKm = calculateDistance(lat, lng, meetupLat, meetupLng);

        return {
          ...meetup,
          distance: distanceKm, // in kilometers
        };
      })
      // Filter by distance
      .filter((meetup: any) => meetup.distance * 1000 <= radiusMeters)
      // Sort by distance
      .sort((a: any, b: any) => a.distance - b.distance);

    console.log(`Returning ${meetupsWithDistance.length} nearby meetups after distance filtering`);

    return { success: true as const, meetups: meetupsWithDistance };
  } catch (error) {
    console.error('Error in getNearbyMeetups:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Database helper functions
export const database = {
  get: async <T>(table: string, query = {}) => {
    const client = await getSupabase();
    const { data, error } = await client.from(table).select('*').match(query);

    if (error) throw error;
    return data as T[];
  },

  insert: async <T>(table: string, data: Partial<T>) => {
    const client = await getSupabase();
    const { data: result, error } = await client.from(table).insert([data]).select().single();

    if (error) throw error;
    return result as T;
  },

  update: async <T>(table: string, query: Record<string, any>, updates: Partial<T>) => {
    const client = await getSupabase();
    const { data, error } = await client.from(table).update(updates).match(query).select();

    if (error) throw error;
    return data as T[];
  },

  delete: async (table: string, query: Record<string, any>) => {
    const client = await getSupabase();
    const { error } = await client.from(table).delete().match(query);

    if (error) throw error;
    return true;
  },

  subscribe: async <T>(table: string, callback: (payload: T) => void) => {
    const client = await getSupabase();
    const subscription = client
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload =>
        callback(payload as T)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
