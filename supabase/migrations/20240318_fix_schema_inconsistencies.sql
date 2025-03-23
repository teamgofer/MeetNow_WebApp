-- Migration to fix schema inconsistencies
-- 1. Standardize on profiles.credits instead of credits.balance (if credits table exists)
-- 2. Convert meetup_history.location from geometry to geography

-- Begin transaction
BEGIN;

-- 1. Handle credits table removal if it exists
DO $$
BEGIN
  -- Check if credits table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credits') THEN
    -- Sync values to profiles table
    UPDATE profiles p
    SET credits = c.balance
    FROM credits c
    WHERE p.id = c.user_id
      AND p.credits != c.balance;
    
    -- Drop the credits table after syncing
    DROP TABLE credits;
    
    RAISE NOTICE 'Credits table found and dropped after syncing values to profiles.';
  ELSE
    RAISE NOTICE 'Credits table not found. Skipping credits consolidation.';
  END IF;
END $$;

-- Create a trigger to maintain credits history if needed
CREATE TABLE IF NOT EXISTS credits_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function to log credits changes
CREATE OR REPLACE FUNCTION log_credits_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.credits IS DISTINCT FROM NEW.credits THEN
    INSERT INTO credits_history(user_id, previous_balance, new_balance)
    VALUES(NEW.id, COALESCE(OLD.credits, 0), NEW.credits);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS on_credits_change ON profiles;
CREATE TRIGGER on_credits_change
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.credits IS DISTINCT FROM NEW.credits)
EXECUTE FUNCTION log_credits_change();

-- Update specific credit-related functions
-- This avoids issues with PostGIS aggregate functions
DO $$
DECLARE
  function_name TEXT;
  function_def TEXT;
BEGIN
  -- List of known functions that reference credits.balance
  -- Add any additional functions that need updating here
  FOR function_name IN (
    SELECT unnest(ARRAY['add_user_credits', 'get_user_credits', 'use_credits_for_meetup', 'calculate_required_credits'])
  )
  LOOP
    -- Check if the function exists
    IF EXISTS (
      SELECT 1 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = function_name
    ) THEN
      -- Get the function definition
      SELECT pg_get_functiondef(p.oid)
      INTO function_def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = function_name;

      -- Only update if the function actually references credits
      IF function_def LIKE '%credits.balance%' OR
         function_def LIKE '%FROM credits%' THEN
        -- Replace references to credits.balance with profiles.credits
        function_def := REPLACE(function_def, 
          'credits.balance', 
          'profiles.credits');
        function_def := REPLACE(function_def, 
          'SELECT balance FROM credits WHERE user_id = ', 
          'SELECT credits FROM profiles WHERE id = ');
        function_def := REPLACE(function_def, 
          'UPDATE credits SET balance = ', 
          'UPDATE profiles SET credits = ');
        
        -- Log what we're changing
        RAISE NOTICE 'Updating function %', function_name;
        
        -- Execute the updated function definition
        EXECUTE function_def;
      END IF;
    END IF;
  END LOOP;
END $$;

-- 2. Convert meetup_history.location from geometry to geography
-- First check if the table and column exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetup_history' 
    AND column_name = 'location'
  ) THEN
    -- Check if it's not already geography type
    IF (
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetup_history' 
      AND column_name = 'location'
    ) != 'USER-DEFINED' OR (
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetup_history' 
      AND column_name = 'location'
    ) != 'geography' THEN
      -- Create a new column with the correct type
      EXECUTE 'ALTER TABLE meetup_history ADD COLUMN location_geo geography';
      
      -- Convert existing geometry data to geography
      EXECUTE 'UPDATE meetup_history SET location_geo = location::geography';
      
      -- Drop the original column
      EXECUTE 'ALTER TABLE meetup_history DROP COLUMN location';
      
      -- Rename the new column
      EXECUTE 'ALTER TABLE meetup_history RENAME COLUMN location_geo TO location';
      
      -- Create a spatial index
      EXECUTE 'DROP INDEX IF EXISTS meetup_history_location_idx';
      EXECUTE 'CREATE INDEX meetup_history_location_idx ON meetup_history USING GIST (location)';
      
      RAISE NOTICE 'Converted meetup_history.location from geometry to geography type.';
    ELSE
      RAISE NOTICE 'meetup_history.location is already geography type. No conversion needed.';
    END IF;
  ELSE
    RAISE NOTICE 'meetup_history table or location column not found. Skipping type conversion.';
  END IF;
END $$;

-- Update the cleanup_expired_meetups function to use geography
CREATE OR REPLACE FUNCTION public.cleanup_expired_meetups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if meetup_history table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meetup_history') THEN
    -- Archive expired meetups to history table
    INSERT INTO meetup_history (id, created_at, expires_at, title, description, location, user_id, image_url, address)
    SELECT 
      id, 
      created_at, 
      (starts_at + (duration_minutes || ' minutes')::interval) AS expires_at, 
      title, 
      description, 
      location, -- Now this is already geography type
      user_id, 
      image_url, 
      address
    FROM meetups
    WHERE (starts_at + (duration_minutes || ' minutes')::interval) < NOW() 
      AND status = 'active';
  END IF;
  
  -- Mark as expired/inactive in the main table
  UPDATE meetups
  SET status = 'expired'
  WHERE (starts_at + (duration_minutes || ' minutes')::interval) < NOW() 
    AND status = 'active';
  
  -- Log the cleanup
  RAISE NOTICE 'Expired meetups cleanup completed at %', NOW();
END;
$$;

-- Add constraints to make required foreign keys non-nullable
-- Only do this after confirming no NULL values exist
DO $$
BEGIN
  -- Check if itineraries table exists and if the column has any NULL values
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itineraries') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'itineraries' AND column_name = 'meetup_id') THEN
    -- Check if there are any NULL meetup_id values in itineraries
    IF NOT EXISTS (SELECT 1 FROM itineraries WHERE meetup_id IS NULL) THEN
      ALTER TABLE itineraries ALTER COLUMN meetup_id SET NOT NULL;
      RAISE NOTICE 'Set NOT NULL constraint on itineraries.meetup_id';
    ELSE
      RAISE NOTICE 'Found NULL values in itineraries.meetup_id. Constraint not applied.';
    END IF;
  ELSE
    RAISE NOTICE 'itineraries table or meetup_id column not found. Skipping constraint addition.';
  END IF;
  
  -- For user_id in meetups, we need to be more careful since this could affect core functionality
  -- Commenting out for now, should be verified manually
  /*
  IF NOT EXISTS (SELECT 1 FROM meetups WHERE user_id IS NULL) THEN
    ALTER TABLE meetups ALTER COLUMN user_id SET NOT NULL;
  END IF;
  */
END $$;

-- Commit all changes
COMMIT;