/**
 * Schema Check Script - Checks database schema after migration
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('\n🔍 CHECKING DATABASE SCHEMA\n')
  
  try {
    // Check if credits table exists
    console.log('Checking credits table...')
    let { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .limit(1)
    
    if (creditsError && creditsError.code === '42P01') {
      console.log('✅ Credits table no longer exists (expected)')
    } else {
      console.log('❌ Credits table still exists or unexpected error')
      console.log(creditsError || creditsData)
    }
    
    // Check if credits_history table exists
    console.log('\nChecking credits_history table...')
    let { data: historyData, error: historyError } = await supabase
      .from('credits_history')
      .select('*')
      .limit(1)
    
    if (!historyError) {
      console.log('✅ Credits history table exists')
    } else {
      console.log('❌ Credits history table does not exist')
      console.log(historyError)
    }
    
    // Check table schemas
    console.log('\nChecking meetup_history table schema...')
    const { data: meetupHistorySchema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'meetup_history' })
      
    if (schemaError) {
      console.log('❌ Error fetching schema information')
      console.log(schemaError)
    } else {
      console.log('Table schema:', meetupHistorySchema)
    }
    
    // Test credit function
    console.log('\nTesting add_user_credits function...')
    
    // Get a test user
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, credits')
      .limit(1)
      .single()
      
    if (userError) {
      console.log('❌ Could not find test user')
      console.log(userError)
      return
    }
    
    const testUserId = userData.id
    const originalCredits = userData.credits || 0
    console.log(`Found test user: ${testUserId} with ${originalCredits} credits`)
    
    // Add credits
    console.log('Adding 50 credits...')
    const { data: addResult, error: addError } = await supabase
      .rpc('add_user_credits', {
        user_id: testUserId,
        credit_amount: 50
      })
      
    if (addError) {
      console.log('❌ Error adding credits')
      console.log(addError)
    } else {
      console.log('✅ Credits added successfully')
      
      // Check updated value
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', testUserId)
        .single()
        
      console.log(`User now has ${updatedUser.credits} credits (was ${originalCredits})`)
      
      // Reset credits
      await supabase
        .from('profiles')
        .update({ credits: originalCredits })
        .eq('id', testUserId)
        
      console.log(`Reset credits to original value: ${originalCredits}`)
    }
  } catch (err) {
    console.error('Error checking schema:', err)
  }
}

// Create helper function for schema info
async function setupHelperFunction() {
  try {
    // SQL to create a function that returns table schema
    const createFunction = `
    CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result jsonb;
    BEGIN
      SELECT jsonb_agg(
        jsonb_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'udt_name', udt_name
        )
      )
      INTO result
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1;
      
      RETURN result;
    END;
    $$;
    `
    
    // Execute using raw SQL
    const { error } = await supabase.rpc('pgdumpify', { sql_string: createFunction })
    
    if (error) {
      console.log('Could not create helper function, will try alternate approach')
      console.log(error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error setting up helper:', err)
    return false
  }
}

async function main() {
  // Try to set up helper function but continue even if it fails
  const helperResult = await setupHelperFunction()
  if (!helperResult) {
    console.log('Will proceed without schema helper function')
  }
  
  // Run the schema checks
  await checkSchema()
}

main() 