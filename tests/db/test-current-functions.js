// Test script for current database functions
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

// Test the most recent function signatures
async function testCurrentFunctions() {
  try {
    console.log('Testing current database functions');
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Step 1: Create a meetup with the current function signature
    console.log('\n--- Testing create_meetup with latest signature ---');
    const lat = 37.7749;
    const lng = -122.4194;
    
    const { data: meetup, error: meetupError } = await supabase.rpc('create_meetup', {
      p_title: 'Test Meetup',
      p_description: 'Testing meetup creation with current signature',
      p_address: '123 Test St, San Francisco, CA',
      p_lat: lat,
      p_lng: lng,
      p_image: null,
      p_user_id: null, // Anonymous user
      p_duration_minutes: 60
    });
    
    if (meetupError) {
      console.error('Error creating meetup:', meetupError);
    } else {
      console.log('Successfully created meetup:', meetup);
    }
    
    // Step 2: Search for nearby meetups
    console.log('\n--- Testing search_nearby_meetups ---');
    const { data: nearbyMeetups, error: searchError } = await supabase.rpc('search_nearby_meetups', {
      p_lat: lat,
      p_lng: lng,
      p_distance_meters: 10000,
      p_limit: 10
    });
    
    if (searchError) {
      console.error('Error searching for nearby meetups:', searchError);
    } else {
      console.log(`Found ${nearbyMeetups?.length || 0} nearby meetups:`, nearbyMeetups || 'None');
    }
    
    // Step 3: Test a simpler search query directly
    console.log('\n--- Testing simple search query ---');
    const { data: meetups, error: queryError } = await supabase
      .from('meetups')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.error('Error querying meetups:', queryError);
    } else {
      console.log(`Found ${meetups?.length || 0} meetups in direct query:`, 
        meetups?.map(m => `${m.title} (${m.id})`) || 'None');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run all tests
testCurrentFunctions(); 