// Test script for new database schema
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

// Test the full flow of the new functions
async function testNewDatabaseFunctions() {
  try {
    console.log('Testing new database schema functions');
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Step 1: Create a free meetup
    console.log('\n--- Testing create_free_meetup ---');
    const location = {
      lat: 37.7749,
      lng: -122.4194
    };
    
    const { data: freeMeetup, error: freeError } = await supabase.rpc('create_free_meetup', {
      p_title: 'Free Test Meetup',
      p_description: 'Testing free meetup creation',
      p_address: '123 Test St, San Francisco, CA',
      p_lat: location.lat,
      p_lng: location.lng
    });
    
    if (freeError) {
      console.error('Error creating free meetup:', freeError);
    } else {
      console.log('Successfully created free meetup:', freeMeetup);
    }
    
    // Step 2: Create a paid meetup
    console.log('\n--- Testing create_meetup ---');
    const { data: paidMeetup, error: paidError } = await supabase.rpc('create_meetup', {
      p_title: 'Paid Test Meetup',
      p_description: 'Testing paid meetup creation',
      p_address: '456 Example Ave, San Francisco, CA',
      p_image: null,
      p_lat: location.lat + 0.01,
      p_lng: location.lng + 0.01,
      p_duration_minutes: 120,
      p_is_free_meetup: false
    });
    
    if (paidError) {
      console.error('Error creating paid meetup:', paidError);
    } else {
      console.log('Successfully created paid meetup:', paidMeetup);
    }
    
    // Step 3: Search for nearby meetups
    console.log('\n--- Testing search_nearby_meetups ---');
    const { data: nearbyMeetups, error: searchError } = await supabase.rpc('search_nearby_meetups', {
      p_lat: location.lat,
      p_lng: location.lng,
      p_distance_meters: 10000,
      p_limit: 10
    });
    
    if (searchError) {
      console.error('Error searching for nearby meetups:', searchError);
    } else {
      console.log(`Found ${nearbyMeetups?.length || 0} nearby meetups:`, 
        nearbyMeetups?.map(m => `${m.title} (${m.id})`) || 'None');
    }
    
    // Step 4: Search for free meetups only
    console.log('\n--- Testing search_nearby_free_meetups ---');
    const { data: nearbyFreeMeetups, error: freeSearchError } = await supabase.rpc('search_nearby_free_meetups', {
      p_lat: location.lat,
      p_lng: location.lng,
      p_distance_meters: 10000,
      p_limit: 10
    });
    
    if (freeSearchError) {
      console.error('Error searching for free meetups:', freeSearchError);
    } else {
      console.log(`Found ${nearbyFreeMeetups?.length || 0} nearby free meetups:`, 
        nearbyFreeMeetups?.map(m => `${m.title} (${m.id})`) || 'None');
    }
    
    // Step 5: Check if meetup is expired (should be false for new meetups)
    if (freeMeetup?.id) {
      console.log('\n--- Testing is_meetup_expired ---');
      const { data: isExpired, error: expiredError } = await supabase.rpc('is_meetup_expired', {
        p_meetup_id: freeMeetup.id
      });
      
      if (expiredError) {
        console.error('Error checking if meetup is expired:', expiredError);
      } else {
        console.log(`Meetup expired status: ${isExpired}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run all tests
testNewDatabaseFunctions(); 