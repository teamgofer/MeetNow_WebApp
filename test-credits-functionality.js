/**
 * Test Credits Functionality
 * This script tests the credit system for extended meetup durations
 * using the test user account that was created directly in the database
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

// Test user credentials - this is the test user we created in the database
const TEST_EMAIL = 'test@example.com';

/**
 * Test the credit functionality with the database test user
 */
async function testCreditsFunctionality() {
  console.log('=== TESTING CREDITS FUNCTIONALITY ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // 1. Get the test user details
    console.log('\n1. Getting test user details...');
    const { data: userQueryData, error: userQueryError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (userQueryError) {
      // If we can't directly query auth.users, try another approach
      console.log('Using alternative approach to get user data...');
      
      // Query profiles table to find users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', 'testuser')
        .single();
      
      if (profilesError) {
        console.error('Error finding test user:', profilesError.message);
        return;
      }
      
      console.log(`Found test user with ID: ${profilesData.id}`);
      var userId = profilesData.id;
    } else {
      console.log(`Found test user: ${userQueryData.email} with ID: ${userQueryData.id}`);
      var userId = userQueryData.id;
    }
    
    if (!userId) {
      console.error('Could not find the test user');
      return;
    }
    
    // 2. Check user's current credit balance
    console.log('\n2. Checking test user credit balance...');
    const { data: creditBalance, error: creditBalanceError } = await supabase
      .rpc('get_user_credits', { user_id: userId });
    
    if (creditBalanceError) {
      console.error('Error getting credit balance:', creditBalanceError.message);
      return;
    }
    
    console.log(`✅ Current credit balance: ${creditBalance}`);
    
    // 3. Calculate required credits for different durations
    console.log('\n3. Testing credit calculation for different durations...');
    const durations = [60, 120, 180, 240, 300]; // 1, 2, 3, 4, 5 hours
    
    for (const duration of durations) {
      const { data: requiredCredits, error: calcError } = await supabase
        .rpc('calculate_required_credits', { requested_duration: duration });
      
      if (calcError) {
        console.error(`Error calculating credits for ${duration} minutes:`, calcError.message);
        continue;
      }
      
      console.log(`✅ ${duration} minutes requires ${requiredCredits} credits`);
    }
    
    // 4. Test using credits for a meetup
    console.log('\n4. Testing credit usage for a 2-hour meetup...');
    const testDuration = 120; // 2 hours
    
    // First, get how many credits are needed
    const { data: requiredCredits, error: requiredError } = await supabase
      .rpc('calculate_required_credits', { requested_duration: testDuration });
    
    if (requiredError) {
      console.error('Error calculating required credits:', requiredError.message);
      return;
    }
    
    console.log(`Required credits for ${testDuration} minutes: ${requiredCredits}`);
    
    // Check if user has enough credits
    if (creditBalance < requiredCredits) {
      console.log(`❌ Insufficient credits: ${creditBalance} available, ${requiredCredits} required`);
      
      // Add more credits if needed
      const { data: addCreditsResult, error: addCreditsError } = await supabase
        .rpc('add_user_credits', { 
          user_id: userId, 
          credit_amount: 50 // Add 50 more credits
        });
      
      if (addCreditsError) {
        console.error('Error adding credits:', addCreditsError.message);
        return;
      }
      
      console.log('✅ Added 50 more credits to test user');
      
      // Get updated credit balance
      const { data: updatedBalance, error: updatedBalanceError } = await supabase
        .rpc('get_user_credits', { user_id: userId });
      
      if (updatedBalanceError) {
        console.error('Error getting updated credit balance:', updatedBalanceError.message);
        return;
      }
      
      console.log(`✅ Updated credit balance: ${updatedBalance}`);
    }
    
    // Use the credits
    const { data: useCreditsResult, error: useCreditsError } = await supabase
      .rpc('use_credits_for_meetup', { 
        user_id: userId, 
        credit_amount: requiredCredits 
      });
    
    if (useCreditsError) {
      console.error('Error using credits:', useCreditsError.message);
      return;
    }
    
    if (useCreditsResult === true) {
      console.log(`✅ Successfully used ${requiredCredits} credits`);
    } else {
      console.log(`❌ Failed to use credits: ${useCreditsResult}`);
    }
    
    // Check remaining balance
    const { data: newBalance, error: newBalanceError } = await supabase
      .rpc('get_user_credits', { user_id: userId });
    
    if (newBalanceError) {
      console.error('Error getting updated credit balance:', newBalanceError.message);
      return;
    }
    
    console.log(`✅ New credit balance: ${newBalance}`);
    
    // 5. Test the full user flow - create a meetup with extended duration
    console.log('\n5. Testing create meetup with extended duration...');
    
    try {
      // Create a mock meetup with a 3-hour duration
      const mockMeetupData = {
        title: 'Test Extended Duration Meetup',
        description: 'This is a test meetup with extended duration',
        address: 'Test Location',
        lat: 37.7749,
        lng: -122.4194,
        user_id: userId,
        duration: 180 // 3 hours
      };
      
      // Calculate credits needed
      const { data: meetupCreditsNeeded, error: meetupCreditsError } = await supabase
        .rpc('calculate_required_credits', { requested_duration: mockMeetupData.duration });
      
      if (meetupCreditsError) {
        console.error('Error calculating credits needed for meetup:', meetupCreditsError.message);
        return;
      }
      
      console.log(`Meetup requires ${meetupCreditsNeeded} credits`);
      
      // Check if we need to add more credits
      if (newBalance < meetupCreditsNeeded) {
        const { data: addMoreCredits, error: addMoreCreditsError } = await supabase
          .rpc('add_user_credits', { 
            user_id: userId, 
            credit_amount: 50 // Add 50 more credits
          });
        
        if (addMoreCreditsError) {
          console.error('Error adding more credits:', addMoreCreditsError.message);
          return;
        }
        
        console.log('✅ Added 50 more credits to ensure we have enough');
      }
      
      // Call the meetup creation function
      const { data: createMeetupResult, error: createMeetupError } = await supabase
        .rpc('create_meetup', {
          p_title: mockMeetupData.title,
          p_description: mockMeetupData.description,
          p_address: mockMeetupData.address,
          p_lat: mockMeetupData.lat,
          p_lng: mockMeetupData.lng,
          p_image: null,
          p_user_id: mockMeetupData.user_id,
          p_duration_minutes: mockMeetupData.duration
        });
      
      if (createMeetupError) {
        console.error('Error creating meetup:', createMeetupError.message);
        return;
      }
      
      console.log('✅ Successfully created extended duration meetup with ID:', createMeetupResult);
      
      // Check final credit balance
      const { data: finalBalance, error: finalBalanceError } = await supabase
        .rpc('get_user_credits', { user_id: userId });
      
      if (finalBalanceError) {
        console.error('Error getting final credit balance:', finalBalanceError.message);
        return;
      }
      
      console.log(`✅ Final credit balance after creating meetup: ${finalBalance}`);
      
    } catch (meetupError) {
      console.error('Error in meetup creation test:', meetupError.message);
    }
    
    console.log('\n=== CREDITS FUNCTIONALITY TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error.message);
  }
}

// Run the test
testCreditsFunctionality().catch(console.error); 