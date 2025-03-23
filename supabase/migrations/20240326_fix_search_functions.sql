-- Fix search functions to ensure they properly use the meetups_with_expiry view

-- Drop existing functions that need to be updated
DROP FUNCTION IF EXISTS search_nearby_meetups;
DROP FUNCTION IF EXISTS search_nearby_free_meetups;
DROP FUNCTION IF EXISTS is_meetup_expired;

-- Function to search for meetups within a radius (using the view with expires_at)
CREATE OR REPLACE FUNCTION search_nearby_meetups(
  lat double precision,
  lng double precision,
  radius_meters double precision DEFAULT 5000,
  max_results integer DEFAULT 50,
  min_duration_minutes integer DEFAULT NULL,
  max_duration_minutes integer DEFAULT NULL,
  include_expired boolean DEFAULT false
) RETURNS SETOF meetups_with_expiry AS $$
DECLARE
  user_location geometry;
BEGIN
  -- Create a point from the provided coordinates
  user_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
  
  RETURN QUERY
  SELECT m.*
  FROM meetups_with_expiry m
  WHERE 
    -- Only return active meetups
    m.status = 'active'
    -- Filter for meetup duration if specified
    AND (min_duration_minutes IS NULL OR m.duration_minutes >= min_duration_minutes)
    AND (max_duration_minutes IS NULL OR m.duration_minutes <= max_duration_minutes)
    -- Filter for expired meetups if specified
    AND (include_expired OR m.expires_at > NOW())
    -- Calculate distance in meters and filter by radius
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(
        (m.location->>'lng')::float, 
        (m.location->>'lat')::float
      ), 4326)::geography,
      user_location::geography,
      radius_meters
    )
  ORDER BY 
    -- Order by distance (closest first)
    ST_Distance(
      ST_SetSRID(ST_MakePoint(
        (m.location->>'lng')::float, 
        (m.location->>'lat')::float
      ), 4326)::geography,
      user_location::geography
    ) ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search for free meetups within a radius
CREATE OR REPLACE FUNCTION search_nearby_free_meetups(
  lat double precision,
  lng double precision,
  radius_meters double precision DEFAULT 5000,
  max_results integer DEFAULT 50,
  min_duration_minutes integer DEFAULT NULL,
  max_duration_minutes integer DEFAULT NULL,
  include_expired boolean DEFAULT false
) RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  title text,
  description text,
  status text,
  location jsonb,
  address text,
  image text,
  creator_id uuid,
  max_participants integer,
  current_participants integer,
  private boolean,
  starts_at timestamptz,
  duration_minutes integer,
  expires_at timestamptz,
  is_free_meetup boolean,
  distance_meters double precision
) AS $$
DECLARE
  user_location geometry;
BEGIN
  -- Create a point from the provided coordinates
  user_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
  
  RETURN QUERY
  SELECT 
    m.*,
    -- Calculate distance in meters
    ST_Distance(
      ST_SetSRID(ST_MakePoint(
        (m.location->>'lng')::float, 
        (m.location->>'lat')::float
      ), 4326)::geography,
      user_location::geography
    ) AS distance_meters
  FROM search_nearby_meetups(
    lat, 
    lng, 
    radius_meters, 
    max_results,
    min_duration_minutes,
    max_duration_minutes,
    include_expired
  ) m
  WHERE m.is_free_meetup = TRUE
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a meetup is expired
CREATE OR REPLACE FUNCTION is_meetup_expired(meetup_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM meetups_with_expiry
    WHERE id = meetup_id AND expires_at < NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION search_nearby_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_nearby_free_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_meetup_expired TO anon, authenticated; 