-- Location-based timezone handling for meetups
-- Derives timezone from meetup coordinates

-- First, we need a timezone lookup function that uses coordinates
-- This requires the PostGIS extension and timezone data

-- Check if we have the timezone lookup extension
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    RAISE NOTICE 'PostGIS extension needs to be installed for full geo-timezone functionality';
  END IF;
END $$;

-- Create a function to get timezone from coordinates
CREATE OR REPLACE FUNCTION get_timezone_from_coordinates(
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  timezone_result TEXT;
BEGIN
  -- Handle invalid coordinates by defaulting to Pacific Time
  IF lat IS NULL OR lng IS NULL OR lat < -90 OR lat > 90 OR lng < -180 OR lng > 180 THEN
    RETURN 'America/Los_Angeles';
  END IF;

  -- If PostGIS with timezone data is available, use direct spatial query
  -- This is a simplified example - actual implementation depends on available timezone data

  -- As a fallback, use approximate timezone mapping
  -- This is a simplified approach - in production you'd use a more complete mapping
  -- or call an external timezone API
  
  -- Mexico (added specific check for Mexico)
  IF (lat BETWEEN 14 AND 33) AND (lng BETWEEN -118 AND -86) THEN
    -- Most of Mexico is in America/Mexico_City timezone
    IF lng < -114 THEN
      -- Western Mexico (Baja California, etc.)
      RETURN 'America/Tijuana';
    ELSIF lng < -110 THEN
      -- Sonora
      RETURN 'America/Hermosillo';
    ELSIF lng < -107 THEN
      -- Chihuahua
      RETURN 'America/Chihuahua';
    ELSIF lng < -95 THEN
      -- Central Mexico
      RETURN 'America/Mexico_City';
    ELSE
      -- Eastern Mexico (Yucatan Peninsula)
      RETURN 'America/Cancun';
    END IF;
  -- North America approximations
  ELSIF (lat BETWEEN 25 AND 49) AND (lng BETWEEN -125 AND -65) THEN
    -- Western US
    IF lng < -115 THEN
      RETURN 'America/Los_Angeles';
    -- Mountain time
    ELSIF lng < -100 THEN
      RETURN 'America/Denver';
    -- Central time
    ELSIF lng < -85 THEN
      RETURN 'America/Chicago';
    -- Eastern time
    ELSE
      RETURN 'America/New_York';
    END IF;
  -- Europe approximations
  ELSIF (lat BETWEEN 35 AND 60) AND (lng BETWEEN -10 AND 30) THEN
    -- Western Europe
    IF lng < 0 THEN
      RETURN 'Europe/London';
    -- Central Europe
    ELSIF lng < 15 THEN
      RETURN 'Europe/Berlin';
    -- Eastern Europe
    ELSE
      RETURN 'Europe/Kiev';
    END IF;
  END IF;
  
  -- Default to Pacific Time if no mapping found (was UTC)
  RETURN 'America/Los_Angeles';
END;
$$;

-- Create a view of meetups with location-based timezones
CREATE OR REPLACE VIEW meetups_with_local_time AS
SELECT 
  m.*,
  get_timezone_from_coordinates(ST_Y(m.location::geometry), ST_X(m.location::geometry)) AS derived_timezone,
  
  -- Local start time based on location
  m.starts_at AT TIME ZONE 'UTC' AT TIME ZONE 
    get_timezone_from_coordinates(ST_Y(m.location::geometry), ST_X(m.location::geometry)) AS local_starts_at,
    
  -- Local expiry time based on location
  (m.starts_at + (m.duration_minutes * interval '1 minute')) AT TIME ZONE 'UTC' AT TIME ZONE 
    get_timezone_from_coordinates(ST_Y(m.location::geometry), ST_X(m.location::geometry)) AS local_expires_at,
    
  -- Current status calculation
  CASE
    WHEN (m.starts_at + (m.duration_minutes * interval '1 minute')) < current_timestamp THEN 'expired'
    WHEN m.status = 'active' THEN 'active'
    ELSE m.status
  END AS calculated_status
FROM 
  meetups m;

-- Create a function to create meetup with proper timestamp handling
CREATE OR REPLACE FUNCTION create_meetup(
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
  -- Calculate starts_at time using server's current timestamp in UTC
  -- This ensures consistent time storage regardless of client timezone
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
    starts_at,           -- Store UTC timestamp
    duration_minutes,    -- Store duration for expiry calculation
    max_participants,
    current_participants,
    is_free_meetup
  )
  VALUES (
    p_title, 
    p_description, 
    p_address,          -- Store the properly geocoded address from client
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    p_image, 
    p_user_id,
    'active',
    v_starts_at,        -- UTC timestamp from server
    p_duration_minutes,
    50, -- Default max participants
    0,  -- Initial participants count
    p_duration_minutes <= 60 -- Free if <= 60 minutes
  )
  RETURNING id INTO v_id;
  
  -- Return the created meetup info with expiry calculation
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'address', address,
    'lat', ST_Y(location::geometry),
    'lng', ST_X(location::geometry),
    'status', status,
    'duration_minutes', duration_minutes,
    'starts_at', starts_at,
    'expires_at', (starts_at + (duration_minutes * interval '1 minute')),
    'created_at', created_at,
    'user_id', user_id,
    'image_url', image_url
  ) INTO v_result
  FROM meetups
  WHERE id = v_id;
  
  RETURN v_result;
END;
$$;

-- Function for free meetups that gets the current user ID
CREATE OR REPLACE FUNCTION create_free_meetup(
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

-- Create a view of meetups with location-based calculated expiry
CREATE OR REPLACE VIEW meetups_with_expiry AS
SELECT 
  m.*,
  
  -- Calculate expiry time based on duration
  (m.starts_at + (m.duration_minutes * interval '1 minute')) AS expires_at,
  
  -- Calculated status based on current time and expiry
  CASE
    WHEN (m.starts_at + (m.duration_minutes * interval '1 minute')) < current_timestamp THEN 'expired'
    WHEN m.status = 'active' THEN 'active'
    ELSE m.status
  END AS calculated_status
FROM 
  meetups m;

-- Grant access to view and functions
GRANT SELECT ON meetups_with_local_time TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_timezone_from_coordinates(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_meetup(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_free_meetup(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, INTEGER) TO authenticated;

-- Example query to test
SELECT 
  id, 
  title, 
  ST_Y(location::geometry) AS lat,
  ST_X(location::geometry) AS lng,
  derived_timezone,
  starts_at,
  local_starts_at,
  local_expires_at
FROM 
  meetups_with_local_time
LIMIT 5; 