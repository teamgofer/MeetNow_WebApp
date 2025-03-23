-- Function to search for meetups within a radius
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
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM public.meetups_with_expiry m
    WHERE status = 'active'
    AND expires_at > now()
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION search_nearby_free_meetups(double precision, double precision, integer, integer) TO anon, authenticated; 