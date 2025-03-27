/**
 * Schema Test Script - Validates recent schema changes
 * Tests:
 * 1. Credits consolidation
 * 2. Geography/Geometry standardization
 * 3. Credits history tracking
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function runTests() {
  console.log('\n🔍 RUNNING SCHEMA CHANGE TESTS\n')
  
  try {
    // Test 1: Verify credits table is gone
    console.log('Test 1: Checking if credits table was removed...')
    const { data: tablesData } = await supabase.rpc('check_table_exists', { 
      table_name: 'credits'
    })
    
    if (!tablesData) {
      console.log('✅ PASSED: Credits table no longer exists')
    } else {
      console.log('❌ FAILED: Credits table still exists')
    }
    
    // Test 2: Verify credits_history table exists
    console.log('\nTest 2: Checking if credits_history table was created...')
    const { data: historyTableData } = await supabase.rpc('check_table_exists', { 
      table_name: 'credits_history' 
    })
    
    if (historyTableData) {
      console.log('✅ PASSED: Credits history table exists')
    } else {
      console.log('❌ FAILED: Credits history table missing')
    }
    
    // Test 3: Check meetup_history.location data type
    console.log('\nTest 3: Checking meetup_history.location type...')
    const { data: locationTypeData } = await supabase.rpc('get_column_type', {
      table_name: 'meetup_history',
      column_name: 'location'
    })
    
    if (locationTypeData && locationTypeData.toLowerCase().includes('geography')) {
      console.log('✅ PASSED: meetup_history.location is using geography type')
    } else {
      console.log('❌ FAILED: meetup_history.location is not using geography type')
      console.log(`Current type: ${locationTypeData || 'unknown'}`)
    }
    
    // Test 4: Verify if add_user_credits function works correctly
    console.log('\nTest 4: Testing credit functions with new schema...')
    
    // Get a test user ID (using the first user we find)
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, credits')
      .limit(1)
      .single()
      
    if (userError) {
      console.log('❌ FAILED: Could not find a test user')
      console.log(userError)
      return
    }
      
    const testUserId = userData.id
    const originalCredits = userData.credits || 0
    
    console.log(`  Found test user: ${testUserId}`)
    console.log(`  Original credits: ${originalCredits}`)
    
    // Add some credits
    const testCredits = 100
    const { data: addCreditsData, error: addCreditsError } = await supabase
      .rpc('add_user_credits', {
        user_id: testUserId,
        credit_amount: testCredits
      })
      
    if (addCreditsError) {
      console.log('❌ FAILED: Error calling add_user_credits function')
      console.log(addCreditsError)
      return
    }
    
    // Check the credits were added
    const { data: updatedUserData } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', testUserId)
      .single()
      
    if (updatedUserData.credits === originalCredits + testCredits) {
      console.log(`✅ PASSED: Credits added successfully (${originalCredits} → ${updatedUserData.credits})`)
    } else {
      console.log('❌ FAILED: Credits were not added correctly')
      console.log(`Expected: ${originalCredits + testCredits}, Got: ${updatedUserData.credits}`)
    }
    
    // Test 5: Verify credits history was recorded
    console.log('\nTest 5: Checking if credits history was recorded...')
    const { data: historyData, error: historyError } = await supabase
      .from('credits_history')
      .select('*')
      .eq('user_id', testUserId)
      .order('changed_at', { ascending: false })
      .limit(1)
    
    if (historyError) {
      console.log('❌ FAILED: Error querying credits_history')
      console.log(historyError)
      return
    }
    
    if (historyData && historyData.length > 0) {
      const latestChange = historyData[0]
      if (latestChange.previous_balance === originalCredits && 
          latestChange.new_balance === updatedUserData.credits) {
        console.log('✅ PASSED: Credits history recorded correctly')
      } else {
        console.log('❌ FAILED: Credits history values incorrect')
        console.log('History record:', latestChange)
      }
    } else {
      console.log('❌ FAILED: No credit history records found')
    }
    
    // Restore original credits to clean up after test
    await supabase
      .from('profiles')
      .update({ credits: originalCredits })
      .eq('id', testUserId)
    
    console.log('\n🏁 Schema validation tests completed.')
    
  } catch (err) {
    console.error('Error running tests:', err)
  }
}

// Create the helper functions if they don't exist
async function setupHelperFunctions() {
  // Function to check if a table exists
  const checkTableExistsFunc = `
  CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    table_exists boolean;
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = table_name
    ) INTO table_exists;
    
    RETURN table_exists;
  END;
  $$;
  `
  
  // Function to get a column's data type
  const getColumnTypeFunc = `
  CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    col_type text;
  BEGIN
    SELECT data_type || CASE 
      WHEN udt_name = 'geography' THEN ' (GEOGRAPHY)' 
      WHEN udt_name = 'geometry' THEN ' (GEOMETRY)' 
      ELSE '' 
    END
    INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2;
    
    RETURN col_type;
  END;
  $$;
  `
  
  // Create the helper functions
  await supabase.rpc('pgdumpify', { sql_string: checkTableExistsFunc })
  await supabase.rpc('pgdumpify', { sql_string: getColumnTypeFunc })
}

// Run the entire test
async function main() {
  try {
    // First set up helper functions
    await setupHelperFunctions()
    // Then run the tests
    await runTests()
  } catch (err) {
    console.error('Setup error:', err)
  }
}

main() 