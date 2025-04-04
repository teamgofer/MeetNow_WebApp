import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl ?? !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if a Supabase error is a specific type
export const isSupabaseError = (error: any, code: string) => {
  return error?.code === code;
};
