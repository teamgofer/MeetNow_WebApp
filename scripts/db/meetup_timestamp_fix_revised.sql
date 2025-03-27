-- Fix meetup timestamp and expiry calculation
-- Execute this in the Supabase SQL Editor

-- First, check the actual column name in the meetups table
-- Run this separately to check the structure
/*
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'meetups' 
AND (column_name LIKE '%expir%' OR column_name LIKE '%time%' OR column_name LIKE '%date%');
*/

-- Drop existing functions first to allow changing return types
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
  
  -- Check if expires_at or expiry_time exists
  v_expire_column TEXT;
BEGIN
  -- Calculate expiry time ON THE SERVER using current_timestamp
  v_expires_at := current_timestamp + (p_duration_minutes * interval '1 minute');
  
  -- Debug logging
  RAISE NOTICE 'Creating meetup with duration % minutes, expires at %', 
    p_duration_minutes, v_expires_at;
  
  -- Determine which column name is used for expiry time
  SELECT column_name INTO v_expire_column
  FROM information_schema.columns 
  WHERE table_name = 'meetups' 
  AND (column_name = 'expires_at' OR column_name = 'expiry_time' OR column_name = 'expiry_date');
  
  -- Insert the meetup - using dynamic SQL to handle different column names
  IF v_expire_column = 'expires_at' THEN
    INSERT INTO meetups (
      title, 
      description, 
      address, 
      location, 
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
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
      p_image, 
      p_user_id,
      'active',
      v_expires_at,
      p_duration_minutes
    )
    RETURNING id INTO v_id;
  ELSIF v_expire_column = 'expiry_time' THEN
    INSERT INTO meetups (
      title, 
      description, 
      address, 
      location, 
      image_url, 
      created_by,
      status,
      expiry_time,
      duration_minutes
    )
    VALUES (
      p_title, 
      p_description, 
      p_address, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
      p_image, 
      p_user_id,
      'active',
      v_expires_at,
      p_duration_minutes
    )
    RETURNING id INTO v_id;
  ELSIF v_expire_column = 'expiry_date' THEN
    INSERT INTO meetups (
      title, 
      description, 
      address, 
      location, 
      image_url, 
      created_by,
      status,
      expiry_date,
      duration_minutes
    )
    VALUES (
      p_title, 
      p_description, 
      p_address, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
      p_image, 
      p_user_id,
      'active',
      v_expires_at,
      p_duration_minutes
    )
    RETURNING id INTO v_id;
  ELSE
    RAISE EXCEPTION 'Could not determine expiry column name in meetups table';
  END IF;
  
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
    'expiry_column', v_expire_column,
    'expiry_time', CASE 
                     WHEN v_expire_column = 'expires_at' THEN expires_at::text
                     WHEN v_expire_column = 'expiry_time' THEN expiry_time::text
                     WHEN v_expire_column = 'expiry_date' THEN expiry_date::text
                     ELSE NULL
                   END,
    'created_by', created_by,
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

-- Function to update expiry times for existing meetups - adapted for different column names
DROP FUNCTION IF EXISTS fix_meetup_expiry_times();

CREATE FUNCTION fix_meetup_expiry_times()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count INTEGER := 0;
  v_expire_column TEXT;
  v_sql TEXT;
BEGIN
  -- Determine which column name is used for expiry time
  SELECT column_name INTO v_expire_column
  FROM information_schema.columns 
  WHERE table_name = 'meetups' 
  AND (column_name = 'expires_at' OR column_name = 'expiry_time' OR column_name = 'expiry_date');
  
  IF v_expire_column IS NULL THEN
    RAISE EXCEPTION 'Could not find expiry column in meetups table';
    RETURN 0;
  END IF;
  
  -- Build dynamic SQL for the update based on the actual column name
  v_sql := format('
    UPDATE meetups
    SET %I = created_at + (duration_minutes * interval ''1 minute'')
    WHERE 
      status = ''active''
      AND ABS(EXTRACT(EPOCH FROM (%I - (created_at + (duration_minutes * interval ''1 minute'')))) / 60) > 5',
    v_expire_column, v_expire_column);
  
  -- Execute the dynamic SQL
  EXECUTE v_sql;
  
  -- Get the number of rows updated
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  -- Return a message with the column name that was used
  RAISE NOTICE 'Updated % meetups using column %', fixed_count, v_expire_column;
  
  RETURN fixed_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_meetup(text, text, text, double precision, double precision, text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION create_free_meetup(text, text, text, double precision, double precision, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fix_meetup_expiry_times() TO authenticated; 