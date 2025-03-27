// Minimal test script for Supabase functions
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

// Test function to create a meetup with minimal parameters
async function testMinimalCreateMeetup() {
  console.log('Testing minimal create_meetup function...');
  console.log('Using Supabase URL:', supabaseUrl);
  
  const locationObj = {
    lat: 37.7749,
    lng: -122.4194
  };
  
  try {
    // Try create_free_meetup function with all required parameters (no optionals)
    console.log('Trying create_free_meetup function...');
    const { data, error } = await supabase
      .rpc('create_free_meetup', {
        p_location: locationObj,
        p_address: '123 Test St, San Francisco, CA',
        p_title: 'Test Free Meetup',
        p_description: 'Testing the create_free_meetup function',
        p_image: null
      });
        
    if (error) {
      console.error('Error creating meetup with create_free_meetup:', error);
      
      // If that fails, try direct create_meetup call
      console.log('Trying direct create_meetup function...');
      const { data: meetupData, error: meetupError } = await supabase
        .rpc('create_meetup', {
          p_title: 'Test Direct Meetup',
          p_description: 'Testing direct create_meetup function',
          p_address: '123 Test St, San Francisco, CA',
          p_image: null,
          p_status: 'active',
          p_is_free_meetup: true,
          p_duration_minutes: 60,
          p_max_participants: 10,
          p_location_json: locationObj
        });
        
      if (meetupError) {
        console.error('Error with direct create_meetup:', meetupError);
        return;
      }
      
      console.log('Successfully created meetup with direct create_meetup:', meetupData);
      return;
    }

    console.log('Successfully created meetup with create_free_meetup:', data);
  } catch (error) {
    console.error('Error testing meetup creation:', error);
  }
}

// Run the test
testMinimalCreateMeetup(); 