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

-- 4. Test if credits can be added to a profile
-- First get a test user
WITH test_user AS (
  SELECT id, credits
  FROM profiles
  LIMIT 1
)
SELECT id, credits FROM test_user;

-- 5. Update a test user's credits
-- Replace 'user-id-here' with an actual user ID from the previous query
UPDATE profiles
SET credits = credits + 10
WHERE id = 'user-id-here'
RETURNING id, credits AS new_credits;

-- 6. Check if credits history was recorded
-- Replace 'user-id-here' with the same user ID used above
SELECT *
FROM credits_history
WHERE user_id = 'user-id-here'
ORDER BY changed_at DESC
LIMIT 1;

-- 7. Reset credits to original value
-- Replace 'user-id-here' with the same user ID
-- Replace 999 with the original credit value
UPDATE profiles
SET credits = 999
WHERE id = 'user-id-here'; 