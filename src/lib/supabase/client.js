import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl ?? !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    db: {
        schema: 'public',
    },
});
export const handleSupabaseError = (error) => {
    console.error('Supabase error:', error);
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
export const isSupabaseError = (error, code) => {
    return error?.code === code;
};
//# sourceMappingURL=client.js.map