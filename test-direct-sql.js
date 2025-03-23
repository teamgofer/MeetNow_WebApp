// Test script for direct SQL approach
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

// Test function for direct SQL insert
async function testDirectInsert() {
  console.log('Testing direct SQL insert...');
  console.log('Using Supabase URL:', supabaseUrl);
  
  const locationObj = {
    lat: 37.7749,
    lng: -122.4194
  };
  
  try {
    // For PostGIS geography, we need to use raw SQL
    // Direct SQL insert using PostGIS functions for geographic point
    const { data, error } = await supabase.rpc('insert_meetup_raw', {
      p_title: 'Direct SQL Test',
      p_description: 'Testing direct SQL approach',
      p_address: '123 Test St, San Francisco, CA',
      p_lat: locationObj.lat,
      p_lng: locationObj.lng
    });
    
    if (error) {
      console.error('Error with raw SQL approach:', error);
      
      // Try an alternative approach with direct SQL
      console.log('Trying direct table insert without PostGIS...');
      const { data: insertData, error: insertError } = await supabase
        .from('meetups')
        .insert({
          title: 'Basic Test Meetup',
          description: 'Testing basic insert',
          address: '123 Test St, San Francisco, CA',
          // Skip the location field for now
          starts_at: new Date().toISOString(),
          duration_minutes: 60,
          status: 'active',
          is_free_meetup: true,
          max_participants: 10,
          current_participants: 1
        })
        .select('id, title, created_at')
        .single();
      
      if (insertError) {
        console.error('Error with basic insert:', insertError);
        return;
      }
      
      console.log('Successfully created basic meetup:', insertData);
      return;
    }

    console.log('Successfully created meetup with raw SQL:', data);
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testDirectInsert(); 