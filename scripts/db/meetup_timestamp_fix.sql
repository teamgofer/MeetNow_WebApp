-- Fix meetup timestamp and expiry calculation
-- Execute this in the Supabase SQL Editor

-- Drop existing functions first to allow changing return types
-- Use IF EXISTS to make this script idempotent
DROP FUNCTION IF EXISTS create_meetup(text, text, text, double precision, double precision, text, uuid, integer);
DROP FUNCTION IF EXISTS create_free_meetup(text, text, text, double precision, double precision, text, integer);

-- Update the create_meetup function to handle timestamps properly on the server side
CREATE FUNCTION create_meetup(
  p_title TEXT, 
  p_description TEXT, 
  p_address TEXT, 
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION, 
  p_image TEXT,
  p_user_id UUID,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Calculate expiry time ON THE SERVER using current_timestamp
  -- This ensures consistent time handling regardless of client
  v_expires_at := current_timestamp + (p_duration_minutes * interval '1 minute');
  
  -- Debug logging
  RAISE NOTICE 'Creating meetup with duration % minutes, expires at %', 
    p_duration_minutes, v_expires_at;
  
  -- Insert the meetup
  INSERT INTO meetups (
    title, 
    description, 
    address, 
    location, -- Using PostGIS point
    image_url, 
    created_by,
    status,
    expires_at,
    duration_minutes
  )
  VALUES (
    p_title, 
    p_description, 
    p_address, 
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), -- Create PostGIS point
    p_image, 
    p_user_id,
    'active',
    v_expires_at,
    p_duration_minutes
  )
  RETURNING id INTO v_id;
  
  -- Return the created meetup info with full details
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'address', address,
    'lat', ST_Y(location::geometry),
    'lng', ST_X(location::geometry),
    'status', status,
    'duration_minutes', duration_minutes,
    'created_at', created_at,
    'expires_at', expires_at,
    'created_by', created_by,
    'image_url', image_url
  ) INTO v_result
  FROM meetups
  WHERE id = v_id;
  
  RETURN v_result;
END;
$$;

-- Create the create_free_meetup function
-- This allows anonymous users to create meetups without authentication
CREATE FUNCTION create_free_meetup(
  p_title TEXT, 
  p_description TEXT, 
  p_address TEXT, 
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION, 
  p_image TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user ID if authenticated
  v_user_id := auth.uid();
  
  -- Call the main create_meetup function
  v_result := create_meetup(
    p_title, 
    p_description, 
    p_address, 
    p_lat, 
    p_lng, 
    p_image,
    v_user_id,
    p_duration_minutes
  );
  
  RETURN v_result;
END;
$$;

-- Function to update expiry times for existing meetups
-- Run this once to fix existing meetups
DROP FUNCTION IF EXISTS fix_meetup_expiry_times();

CREATE FUNCTION fix_meetup_expiry_times()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  -- Update existing meetups with incorrect expiry times
  -- We calculate: created_at + duration_minutes
  UPDATE meetups
  SET expires_at = created_at + (duration_minutes * interval '1 minute')
  WHERE 
    -- Only fix active meetups
    status = 'active'
    -- Only fix meetups where expiry time is significantly different 
    -- than what it should be (more than 5 minutes off)
    AND ABS(EXTRACT(EPOCH FROM (expires_at - (created_at + (duration_minutes * interval '1 minute')))) / 60) > 5;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RETURN fixed_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_meetup(text, text, text, double precision, double precision, text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION create_free_meetup(text, text, text, double precision, double precision, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fix_meetup_expiry_times() TO authenticated; 