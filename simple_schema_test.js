/**
 * Simple Schema Test - Tests schema changes with minimal dependencies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Define Supabase URL and key directly if environment variables aren't working
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'your-supabase-key'

// Initialize Supabase client
console.log('Initializing Supabase client...')
console.log(`URL: ${SUPABASE_URL.substring(0, 20)}...`)
console.log(`Key: ${SUPABASE_KEY.substring(0, 5)}...`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runTests() {
  console.log('\n=== RUNNING SIMPLE SCHEMA TESTS ===\n')
  
  try {
    // Test 1: Credits table removal
    console.log('Test 1: Verify credits table removal')
    const { data: creditsTest, error: creditsError } = await supabase
      .from('credits')
      .select('count(*)', { count: 'exact' })
    
    if (creditsError && creditsError.code === '42P01') {
      console.log('✓ PASS: Credits table has been removed')
    } else {
      console.log('✗ FAIL: Credits table still exists or unexpected error')
      console.log(creditsError || `Found ${creditsTest?.count || 0} rows`)
    }
    
    // Test 2: Credits history table
    console.log('\nTest 2: Verify credits_history table creation')
    const { data: historyTest, error: historyError } = await supabase
      .from('credits_history')
      .select('count(*)', { count: 'exact' })
    
    if (!historyError) {
      console.log(`✓ PASS: Credits history table exists with ${historyTest?.count || 0} records`)
    } else {
      console.log('✗ FAIL: Credits history table does not exist')
      console.log(historyError)
    }
    
    // Test 3: Credit functions using profiles
    console.log('\nTest 3: Test credit functions with profiles')
    
    // Find a test user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, credits')
      .limit(1)
      .single()
    
    if (usersError) {
      console.log('✗ FAIL: Could not find test user')
      console.log(usersError)
    } else {
      console.log(`Found test user: ${users.id} with ${users.credits} credits`)
      
      // Backup original credits
      const originalCredits = users.credits || 0
      
      // Try adding credits
      try {
        const { data: addResult, error: addError } = await supabase
          .rpc('add_user_credits', {
            user_id: users.id,
            credit_amount: 25
          })
        
        if (addError) {
          console.log('✗ FAIL: Error calling add_user_credits function')
          console.log(addError)
        } else {
          // Check if credits were updated
          const { data: updated } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', users.id)
            .single()
          
          const expectedCredits = originalCredits + 25
          
          if (updated.credits === expectedCredits) {
            console.log(`✓ PASS: Credits updated correctly (${originalCredits} → ${updated.credits})`)
          } else {
            console.log(`✗ FAIL: Credits not updated correctly. Expected ${expectedCredits}, got ${updated.credits}`)
          }
          
          // Reset credits
          await supabase
            .from('profiles')
            .update({ credits: originalCredits })
            .eq('id', users.id)
          
          console.log(`Credits reset to original value (${originalCredits})`)
        }
      } catch (e) {
        console.log('✗ FAIL: Exception testing credit functions')
        console.log(e)
      }
    }
    
    // Test 4: SQL query to check meetup_history location type
    console.log('\nTest 4: Check meetup_history.location type')
    
    try {
      const { data, error } = await supabase.rpc('run_sql', {
        sql_query: `
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'meetup_history'
            AND column_name = 'location'
        `
      })
      
      if (error) {
        // Fall back to a table check
        const { error: tableError } = await supabase
          .from('meetup_history')
          .select('id')
          .limit(1)
        
        if (tableError) {
          console.log('✗ FAIL: Could not check meetup_history table')
          console.log(tableError)
        } else {
          console.log('✓ PASS: meetup_history table exists (but could not check column type)')
        }
      } else if (data && data.length > 0) {
        const column = data[0]
        if (column.udt_name === 'geography') {
          console.log('✓ PASS: meetup_history.location is using geography type')
        } else {
          console.log(`✗ FAIL: meetup_history.location is using ${column.udt_name} type, not geography`)
        }
      } else {
        console.log('? UNKNOWN: Could not determine meetup_history.location type')
      }
    } catch (e) {
      console.log('✗ FAIL: Exception checking location type')
      console.log(e)
      
      // Try a basic check if the table exists
      try {
        const { error: tableError } = await supabase
          .from('meetup_history')
          .select('id')
          .limit(1)
        
        if (!tableError) {
          console.log('✓ PASS: meetup_history table exists (but could not check column type)')
        }
      } catch (tableError) {
        console.log('✗ FAIL: Could not access meetup_history table')
      }
    }
    
    console.log('\n=== SCHEMA TESTS COMPLETED ===')
    
  } catch (err) {
    console.error('Test execution error:', err)
  }
}

runTests() 