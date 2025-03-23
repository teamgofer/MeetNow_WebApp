-- Fix meetup timestamp calculation based on actual table structure
-- Execute this in the Supabase SQL Editor

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS create_meetup(text, text, text, double precision, double precision, text, uuid, integer);
DROP FUNCTION IF EXISTS create_free_meetup(text, text, text, double precision, double precision, text, integer);
DROP FUNCTION IF EXISTS fix_meetup_expiry_times();

-- Update the create_meetup function to handle timestamps correctly on the server side
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
  v_starts_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Calculate starts_at time using server's current timestamp
  v_starts_at := current_timestamp;
  
  -- Debug logging
  RAISE NOTICE 'Creating meetup with duration % minutes, starts at %', 
    p_duration_minutes, v_starts_at;
  
  -- Insert the meetup
  INSERT INTO meetups (
    title, 
    description, 
    address, 
    location, 
    image_url, 
    user_id,
    status,
    starts_at,
    duration_minutes,
    max_participants,
    current_participants,
    is_free_meetup
  )
  VALUES (
    p_title, 
    p_description, 
    p_address, 
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    p_image, 
    p_user_id,
    'active',
    v_starts_at,
    p_duration_minutes,
    50, -- Default max participants
    0,  -- Initial participants count
    p_duration_minutes <= 60 -- Free if <= 60 minutes
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
    'starts_at', starts_at,
    'expiry_calculation', (starts_at + (duration_minutes * interval '1 minute')),
    'user_id', user_id,
    'image_url', image_url
  ) INTO v_result
  FROM meetups
  WHERE id = v_id;
  
  RETURN v_result;
END;
$$;

-- Create the create_free_meetup function
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

-- Function to fix meetups with incorrect timestamps
CREATE FUNCTION fix_meetup_timestamps()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  -- Find meetups where starts_at is not in UTC or has timezone issues
  -- We'll update those to set starts_at to current_timestamp
  -- Only fixing active meetups to avoid disrupting historical data
  UPDATE meetups
  SET starts_at = current_timestamp
  WHERE 
    status = 'active'
    -- Only fix meetups that started more than a day in the future or past
    -- This likely indicates a timezone/date error
    AND (
      starts_at > current_timestamp + interval '1 day'
      OR starts_at < current_timestamp - interval '1 day'
    );
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  RAISE NOTICE 'Fixed timestamps for % active meetups', fixed_count;
  RETURN fixed_count;
END;
$$;

-- Now create the view that correctly calculates expiry time if it doesn't exist
-- This will replace meetups_with_expiry if it already exists
CREATE OR REPLACE VIEW meetups_with_expiry AS
SELECT 
  m.*,
  (m.starts_at + (m.duration_minutes * interval '1 minute')) AS expires_at,
  CASE
    WHEN (m.starts_at + (m.duration_minutes * interval '1 minute')) < current_timestamp THEN 'expired'
    WHEN m.status = 'active' THEN 'active'
    ELSE m.status
  END AS calculated_status
FROM 
  meetups m;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_meetup(text, text, text, double precision, double precision, text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION create_free_meetup(text, text, text, double precision, double precision, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fix_meetup_timestamps() TO authenticated;
GRANT SELECT ON meetups_with_expiry TO anon, authenticated; 