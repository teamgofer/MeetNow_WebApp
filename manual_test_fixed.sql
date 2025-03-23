-- Manual test script for schema changes
-- Run this in the Supabase SQL Editor or via psql

-- 1. Check if credits table exists
SELECT EXISTS (
  SELECT 1
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'credits'
) AS credits_table_exists;

-- 2. Check if credits_history table exists
SELECT EXISTS (
  SELECT 1
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'credits_history'
) AS credits_history_table_exists;

-- 3. Check meetup_history.location type
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meetup_history'
  AND column_name = 'location';

-- 4. Find a test user and store their ID in a variable
WITH test_user AS (
  SELECT id, credits
  FROM profiles
  LIMIT 1
)
SELECT id, credits FROM test_user;

-- 5-7. Use CTE to get test user, update credits, check history, and reset
-- This eliminates the need to manually replace placeholders
DO $$
DECLARE
  test_user_id UUID;
  original_credits INT;
BEGIN
  -- Get a test user
  SELECT id, credits INTO test_user_id, original_credits
  FROM profiles
  LIMIT 1;
  
  -- Log the user we're testing with
  RAISE NOTICE 'Testing with user ID: % (original credits: %)', test_user_id, original_credits;
  
  -- Update credits
  UPDATE profiles
  SET credits = credits + 10
  WHERE id = test_user_id;
  
  -- Check if credits history was recorded
  RAISE NOTICE 'Checking credits history...';
  PERFORM id, previous_balance, new_balance, changed_at
  FROM credits_history
  WHERE user_id = test_user_id
  ORDER BY changed_at DESC
  LIMIT 1;
  
  -- Reset to original value
  RAISE NOTICE 'Resetting credits to original value: %', original_credits;
  UPDATE profiles
  SET credits = original_credits
  WHERE id = test_user_id;
END;
$$; 