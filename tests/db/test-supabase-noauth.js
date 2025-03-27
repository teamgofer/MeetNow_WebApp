// No-auth test script for Supabase functions
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.development
const envFile = fs.readFileSync('.env.development', 'utf8');
const env = dotenv.parse(envFile);

// Create Supabase client
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function for no-auth approach
async function testNoAuthFunction() {
  console.log('Testing no-auth create_test_meetup function...');
  console.log('Using Supabase URL:', supabaseUrl);
  
  const locationObj = {
    lat: 37.7749,
    lng: -122.4194
  };
  
  try {
    // Call the extremely simplified function with minimal parameters
    const { data, error } = await supabase
      .rpc('create_test_meetup', {
        title: 'Super Simple Test',
        location_json: locationObj
      });
        
    if (error) {
      console.error('Error with create_test_meetup:', error);
      return;
    }

    console.log('Successfully created meetup with create_test_meetup:', data);
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testNoAuthFunction(); 