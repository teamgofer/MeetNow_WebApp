import { SupabaseClient } from '@supabase/supabase-js';
declare global {
    interface ImportMetaEnv {
        VITE_SUPABASE_URL: string;
        VITE_SUPABASE_ANON_KEY: string;
    }
    interface Window {
        __SUPABASE_INSTANCE__?: SupabaseClient;
    }
}
export declare const getSupabase: () => Promise<SupabaseClient>;
export declare const cleanupSupabase: () => void;
export declare const createNewMeetup: ({ title, description, location, address, image, }: {
    title?: string;
    description?: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    image?: string;
}) => Promise<{
    success: true;
    meetup: any;
    error?: never;
} | {
    success: false;
    error: string;
    meetup?: never;
}>;
export declare const getNearbyMeetups: (lat: number, lng: number, radiusMeters?: number) => Promise<{
    success: true;
    meetups: any;
    error?: never;
} | {
    success: false;
    error: string;
    meetups?: never;
}>;
export declare const getMeetupById: (id: string) => Promise<{
    success: true;
    meetup: {
        id: any;
        location: any;
        address: any;
        created_at: any;
        expires_at: any;
        starts_at: any;
        duration_minutes: any;
        status: any;
    };
    error?: never;
} | {
    success: false;
    error: string;
    meetup?: never;
}>;
export declare const cancelMeetup: (id: string) => Promise<{
    success: true;
    meetup: {
        id: any;
        location: any;
        address: any;
        created_at: any;
        expires_at: any;
        starts_at: any;
        duration_minutes: any;
        status: any;
    };
    error?: never;
} | {
    success: false;
    error: string;
    meetup?: never;
}>;
export declare const database: {
    get: <T>(table: string, query?: {}) => Promise<T[]>;
    insert: <T>(table: string, data: Partial<T>) => Promise<T>;
    update: <T>(table: string, query: Record<string, any>, updates: Partial<T>) => Promise<T[]>;
    delete: (table: string, query: Record<string, any>) => Promise<boolean>;
    subscribe: <T>(table: string, callback: (payload: T) => void) => Promise<() => void>;
};
