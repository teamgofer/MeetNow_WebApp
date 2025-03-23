-- Compatibility Indexes
-- This script creates additional indexes to support efficient queries against the free_meetups view

-- Ensure we have the right indexes for querying by status and expiration date
CREATE INDEX IF NOT EXISTS meetups_status_expires_at_idx 
ON public.meetups (status, expires_at);

-- Index for creator_id lookups
CREATE INDEX IF NOT EXISTS meetups_creator_id_idx 
ON public.meetups (creator_id);

-- Status-specific index
CREATE INDEX IF NOT EXISTS meetups_active_status_idx
ON public.meetups (status) 
WHERE status = 'active';

-- Location + Status compound index for spatial queries that filter by status
CREATE INDEX IF NOT EXISTS meetups_location_status_idx
ON public.meetups USING GIST (location)
WHERE status = 'active';

-- Function to search for meetups within a radius
-- This is a convenience function for when PostGIS spatial queries are too complex
CREATE OR REPLACE FUNCTION search_nearby_free_meetups(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    max_results integer DEFAULT 50
)
RETURNS SETOF public.free_meetups
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.free_meetups
    WHERE status = 'active'
    AND expires_at > now()
    AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )
    LIMIT max_results;
$$;

-- Query optimization note for future reference:
COMMENT ON FUNCTION search_nearby_free_meetups IS 'Optimized function for finding nearby meetups using the free_meetups view'; 