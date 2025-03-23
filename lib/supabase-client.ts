import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions for property system
export type PropertyWithFactors = {
  id: string;
  name: string;
  description: string;
  property_type: string;
  city: string;
  center_point: any; // Geography type
  geometry: any; // Geography type
  base_value: number;
  current_value: number;
  status: string;
  created_at: string;
  property_value_factors?: {
    factor_type: string;
    factor_value: number;
    population_density_factor?: number;
  }[];
}; 