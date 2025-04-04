import { createClient } from '@supabase/supabase-js';
import { processPostGISMeetups, calculateDistance } from './geo-utils';
const DEBUG_SUPABASE = true;
const getGlobalInstance = () => {
    if (typeof window !== 'undefined' && window.__SUPABASE_INSTANCE__) {
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] Using existing global instance');
        return window.__SUPABASE_INSTANCE__;
    }
    return null;
};
const setGlobalInstance = (instance) => {
    if (typeof window !== 'undefined') {
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] Setting global instance');
        window.__SUPABASE_INSTANCE__ = instance;
    }
};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.');
}
let instance = null;
let isInitializing = false;
let initializationPromise = null;
const createSupabaseClient = async () => {
    instance = instance || getGlobalInstance();
    if (instance)
        return instance;
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
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] Starting initialization');
        initializationPromise = (async () => {
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
            await client.auth.initialize();
            if (DEBUG_SUPABASE)
                console.debug('[Supabase] Auth initialized');
            instance = client;
            setGlobalInstance(client);
            if (DEBUG_SUPABASE)
                console.debug('[Supabase] Client fully initialized');
            return client;
        })();
        return await initializationPromise;
    }
    finally {
        isInitializing = false;
        initializationPromise = null;
    }
};
export const getSupabase = async () => {
    instance = instance || getGlobalInstance();
    if (!instance) {
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] No instance found, creating new client');
        instance = await createSupabaseClient();
    }
    else {
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] Using existing client instance');
    }
    return instance;
};
export const cleanupSupabase = () => {
    instance = instance || getGlobalInstance();
    if (instance) {
        if (DEBUG_SUPABASE)
            console.debug('[Supabase] Running cleanup');
        try {
            instance.removeAllChannels();
            instance.auth.onAuthStateChange(() => { });
        }
        catch (err) {
            console.error('[Supabase] Error during cleanup:', err);
        }
        instance = null;
        if (typeof window !== 'undefined') {
            window.__SUPABASE_INSTANCE__ = undefined;
        }
    }
};
export const createNewMeetup = async ({ title, description, location, address, image, }) => {
    try {
        const client = await getSupabase();
        const rpcParams = {
            p_title: title || 'Instant Meetup',
            p_description: description || null,
            p_address: address,
            p_lat: location.lat,
            p_lng: location.lng,
            p_image: image || null,
            p_user_id: null,
            p_duration_minutes: 60,
        };
        const { data, error } = await client.rpc('create_meetup', rpcParams);
        if (error)
            throw error;
        return { success: true, meetup: data };
    }
    catch (error) {
        console.error('Error creating meetup:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
export const getNearbyMeetups = async (lat, lng, radiusMeters = 5000) => {
    try {
        const client = await getSupabase();
        console.log(`Fetching nearby meetups at (${lat}, ${lng}) with radius ${radiusMeters}m`);
        const { data, error } = await client
            .from('meetups_with_expiry')
            .select('*')
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());
        if (error) {
            console.error('Database error when fetching meetups:', error);
            throw error;
        }
        console.log(`Found ${data?.length || 0} active meetups in database`);
        if (!data || data.length === 0) {
            console.log('No active meetups found in database');
            return { success: true, meetups: [] };
        }
        const processedMeetups = processPostGISMeetups(data);
        const meetupsWithDistance = processedMeetups
            .map((meetup) => {
            const meetupLat = meetup.location?.lat || 0;
            const meetupLng = meetup.location?.lng || 0;
            const distanceKm = calculateDistance(lat, lng, meetupLat, meetupLng);
            return {
                ...meetup,
                distance: distanceKm,
            };
        })
            .filter((meetup) => meetup.distance * 1000 <= radiusMeters)
            .sort((a, b) => a.distance - b.distance);
        console.log(`Returning ${meetupsWithDistance.length} nearby meetups after distance filtering`);
        return { success: true, meetups: meetupsWithDistance };
    }
    catch (error) {
        console.error('Error in getNearbyMeetups:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
export const getMeetupById = async (id) => {
    try {
        const client = await getSupabase();
        const { data, error } = await client
            .from('meetups_with_expiry')
            .select('id, location, address, created_at, expires_at, starts_at, duration_minutes, status')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return { success: true, meetup: data };
    }
    catch (error) {
        console.error('Error in getMeetupById:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
export const cancelMeetup = async (id) => {
    try {
        const client = await getSupabase();
        const { data, error } = await client
            .from('meetups')
            .update({ status: 'cancelled' })
            .eq('id', id);
        if (error)
            throw error;
        const { data: updatedData, error: fetchError } = await client
            .from('meetups_with_expiry')
            .select('id, location, address, created_at, expires_at, starts_at, duration_minutes, status')
            .eq('id', id)
            .single();
        if (fetchError)
            throw fetchError;
        return { success: true, meetup: updatedData };
    }
    catch (error) {
        console.error('Error in cancelMeetup:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
export const database = {
    get: async (table, query = {}) => {
        const client = await getSupabase();
        const { data, error } = await client.from(table).select('*').match(query);
        if (error)
            throw error;
        return data;
    },
    insert: async (table, data) => {
        const client = await getSupabase();
        const { data: result, error } = await client.from(table).insert([data]).select().single();
        if (error)
            throw error;
        return result;
    },
    update: async (table, query, updates) => {
        const client = await getSupabase();
        const { data, error } = await client.from(table).update(updates).match(query).select();
        if (error)
            throw error;
        return data;
    },
    delete: async (table, query) => {
        const client = await getSupabase();
        const { error } = await client.from(table).delete().match(query);
        if (error)
            throw error;
        return true;
    },
    subscribe: async (table, callback) => {
        const client = await getSupabase();
        const subscription = client
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload => callback(payload))
            .subscribe();
        return () => {
            subscription.unsubscribe();
        };
    },
};
//# sourceMappingURL=supabase.js.map