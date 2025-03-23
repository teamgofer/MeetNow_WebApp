/**
 * Create Test User Script
 * This script creates a test user using Supabase's auth flow
 * and sets up their profile with initial credits
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.development file
const envFile = '.env.development';
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// Check if environment variables are loaded
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Error: Supabase environment variables are not set.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env.development file.');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_USERNAME = 'testuser';

/**
 * Create a test user through proper Supabase auth flow
 */
async function createTestUser() {
  console.log('=== CREATING TEST USER ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // First check if the user already exists by trying to sign in
    console.log(`\nChecking if user ${TEST_EMAIL} already exists...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!signInError && signInData?.user) {
      console.log(`✅ User ${TEST_EMAIL} already exists, signed in successfully.`);
      console.log(`User ID: ${signInData.user.id}`);
      
      // Check and update the profile
      await updateUserProfile(signInData.user.id);
      return;
    } else {
      console.log(`User ${TEST_EMAIL} does not exist or credentials are invalid.`);
      console.log(`Attempting to create new user...`);
      
      // Create a new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            full_name: 'Test User',
          }
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError.message);
        return;
      }

      console.log(`✅ User created successfully.`);
      console.log(`User ID: ${signUpData.user.id}`);
      
      // The profile should be created by the trigger function, but we'll update it
      await updateUserProfile(signUpData.user.id);
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

/**
 * Update the user's profile with test data and credits
 */
async function updateUserProfile(userId) {
  try {
    console.log(`\nUpdating profile for user ${userId}...`);
    
    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.log('Profile not found, creating a new one...');
      
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: TEST_USERNAME,
            display_name: 'Test User',
            bio: 'This is a test user account for development purposes.',
            is_admin: false,
            credits: 50
          }
        ])
        .select();
        
      if (createError) {
        console.error('Error creating profile:', createError.message);
        return;
      }
      
      console.log('✅ Profile created successfully with 50 credits.');
    } else {
      console.log('Profile found, updating credits...');
      
      // Update the existing profile
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: TEST_USERNAME,
          display_name: 'Test User',
          bio: 'This is a test user account for development purposes.',
          credits: 50,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select();
        
      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return;
      }
      
      console.log('✅ Profile updated successfully with 50 credits.');
    }
    
    // Verify profile and credits
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('username, credits')
      .eq('id', userId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying profile:', verifyError.message);
      return;
    }
    
    console.log(`✅ Verified profile for ${verifyData.username} with ${verifyData.credits} credits.`);
    console.log('\n=== TEST USER CREATION COMPLETE ===');
    
  } catch (error) {
    console.error('Error updating profile:', error.message);
  }
}

// Run the user creation function
createTestUser().catch(console.error); 