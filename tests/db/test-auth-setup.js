/**
 * Test Auth Setup
 * This script tests the authentication setup and credit functions
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

/**
 * Test function to verify auth setup
 */
async function testAuthSetup() {
  console.log('=== TESTING AUTH SETUP ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // 1. Test anonymous access to public data
    console.log('\n1. Testing anonymous access to public data...');
    const { data: publicData, error: publicError } = await supabase
      .from('meetups')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (publicError) {
      console.error('Error accessing public meetups:', publicError.message);
    } else {
      console.log('✅ Successfully accessed public meetups as anonymous user');
      console.log(`Found ${publicData.length} active meetups`);
    }

    // 2. Test credit calculation function
    console.log('\n2. Testing credit calculation function...');
    const { data: creditCalc, error: creditCalcError } = await supabase
      .rpc('calculate_required_credits', { requested_duration: 120 });
    
    if (creditCalcError) {
      console.error('Error calculating credits:', creditCalcError.message);
    } else {
      console.log('✅ Successfully calculated credits for 120 minute meetup');
      console.log(`Credits required: ${creditCalc}`);
    }

    // 3. Try to sign up a test user (this will likely fail due to email confirmation,
    // but we can check if the function executes without permission errors)
    console.log('\n3. Testing user signup (will likely not complete)...');
    const testEmail = `test_${Math.floor(Math.random() * 10000)}@example.com`;
    const testPassword = 'Password123!';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signupError) {
      if (signupError.message.includes('confirmation')) {
        console.log('✅ Signup process executed (requires email confirmation)');
      } else {
        console.error('Error during signup:', signupError.message);
      }
    } else {
      console.log('✅ Signup initiated - check if profile was created');
      console.log('User ID:', signupData.user.id);
      
      // Check if profile was created
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single();
      
      if (profileError) {
        console.error('Error checking for profile:', profileError.message);
      } else {
        console.log('✅ Profile was successfully created by trigger');
        console.log('Profile:', profileData);
      }
    }

    console.log('\n=== AUTH SETUP TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error.message);
  }
}

// Run the test
testAuthSetup().catch(console.error); 