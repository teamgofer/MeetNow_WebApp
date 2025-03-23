/**
 * Create New Test User Script
 * This script creates a test user through Supabase's auth system
 * that should properly appear in the auth UI dashboard
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

// New test user credentials with a standard format
const TEST_EMAIL = `john.doe.test@example.com`;
const TEST_PASSWORD = 'Password123!';  // More complex password with special character
const TEST_USERNAME = `johndoetest`;
const TEST_NAME = `John Doe (Test)`;

/**
 * Create a test user through proper Supabase auth flow
 */
async function createNewTestUser() {
  console.log('=== CREATING NEW TEST USER ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Creating user with email: ${TEST_EMAIL}`);
  
  try {
    // Create a new user via the sign up endpoint
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: TEST_NAME,
        }
      }
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError.message);
      return;
    }

    console.log(`✅ User created successfully.`);
    console.log(`User ID: ${signUpData.user.id}`);
    
    // The profile should be created by the trigger function, but we'll update it with credits
    await updateUserProfile(signUpData.user.id);
    
    // Now sign in with the user to verify it works
    console.log('\nAttempting to sign in with the new user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
    } else {
      console.log('✅ Successfully signed in with the new user');
      console.log(`Session established for: ${signInData.user.email}`);
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
            display_name: TEST_NAME,
            bio: 'This is a test user account for development purposes.',
            is_admin: false,
            credits: 100 // Give more credits for testing extended meetups
          }
        ])
        .select();
        
      if (createError) {
        console.error('Error creating profile:', createError.message);
        return;
      }
      
      console.log('✅ Profile created successfully with 100 credits.');
    } else {
      console.log('Profile found, updating credits...');
      
      // Update the existing profile
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: TEST_USERNAME,
          display_name: TEST_NAME,
          bio: 'This is a test user account for development purposes.',
          credits: 100,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select();
        
      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return;
      }
      
      console.log('✅ Profile updated successfully with 100 credits.');
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
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log('This user should now appear in your Supabase Auth UI.');
    
  } catch (error) {
    console.error('Error updating profile:', error.message);
  }
}

// Run the user creation function
createNewTestUser().catch(console.error); 