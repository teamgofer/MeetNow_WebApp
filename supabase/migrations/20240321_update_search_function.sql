-- Update the search function to work with our unified schema
DROP FUNCTION IF EXISTS search_nearby_free_meetups(double precision, double precision, integer, integer);

-- Create updated function that uses the is_free_meetup flag
CREATE OR REPLACE FUNCTION search_nearby_free_meetups(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    max_results integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    location jsonb,
    address text,
    image_url text,
    status text,
    max_participants integer,
    current_participants integer,
    created_at timestamptz,
    expires_at timestamptz,
    starts_at timestamptz,
    duration_minutes integer,
    is_free_meetup boolean,
    distance_meters float
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        m.id,
        m.title,
        m.description,
        jsonb_build_object(
            'lat', ST_Y(m.location::geometry),
            'lng', ST_X(m.location::geometry)
        ) as location,
        m.address,
        m.image_url,
        m.status::text,
        m.max_participants,
        m.current_participants,
        m.created_at,
        m.expires_at,
        m.starts_at,
        m.duration_minutes,
        m.is_free_meetup,
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM public.meetups_with_expiry m
    WHERE status = 'active'
    AND expires_at > now()
    AND (m.is_free_meetup = true) -- Only return free meetups
    AND ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY ST_Distance(
        m.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )
    LIMIT max_results;
$$;

-- Create a new function to search ALL nearby meetups (both free and paid)
CREATE OR REPLACE FUNCTION search_nearby_meetups(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    max_results integer DEFAULT 50,
    include_free boolean DEFAULT true,
    include_paid boolean DEFAULT true
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    location jsonb,
    address text,
    image_url text,
    status text,
    max_participants integer,
    current_participants integer,
    created_at timestamptz,
    expires_at timestamptz,
    starts_at timestamptz,
    duration_minutes integer,
    is_free_meetup boolean,
    distance_meters float
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        m.id,
        m.title,
        m.description,
        jsonb_build_object(
            'lat', ST_Y(m.location::geometry),
            'lng', ST_X(m.location::geometry)
        ) as location,
        m.address,
        m.image_url,
        m.status::text,
        m.max_participants,
        m.current_participants,
        m.created_at,
        m.expires_at,
        m.starts_at,
        m.duration_minutes,
        m.is_free_meetup,
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM public.meetups_with_expiry m
    WHERE status = 'active'
    AND expires_at > now()
    AND (
        (include_free = true AND m.is_free_meetup = true) OR
        (include_paid = true AND (m.is_free_meetup = false OR m.is_free_meetup IS NULL))
    )
    AND ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY ST_Distance(
        m.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )
    LIMIT max_results;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_nearby_free_meetups(double precision, double precision, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_nearby_meetups(double precision, double precision, integer, integer, boolean, boolean) TO anon, authenticated; 