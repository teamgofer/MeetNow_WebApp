-- Enhanced search function for both free and paid meetups with better filtering options
DROP FUNCTION IF EXISTS public.search_nearby_meetups(double precision, double precision, integer, integer, boolean, boolean);

CREATE OR REPLACE FUNCTION public.search_nearby_meetups(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    max_results integer DEFAULT 50,
    include_free boolean DEFAULT true,
    include_paid boolean DEFAULT true,
    min_duration_minutes integer DEFAULT NULL,
    max_duration_minutes integer DEFAULT NULL,
    min_participants integer DEFAULT NULL,
    max_participants integer DEFAULT NULL
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
    user_id uuid,
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
        m.user_id,
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM public.meetups_with_expiry m
    WHERE 
        -- Basic filters
        status = 'active'
        AND expires_at > now()
        
        -- Meetup type filters (free/paid)
        AND (
            (include_free = true AND m.is_free_meetup = true) OR
            (include_paid = true AND (m.is_free_meetup = false OR m.is_free_meetup IS NULL))
        )
        
        -- Duration filters
        AND (min_duration_minutes IS NULL OR m.duration_minutes >= min_duration_minutes)
        AND (max_duration_minutes IS NULL OR m.duration_minutes <= max_duration_minutes)
        
        -- Participants filters
        AND (min_participants IS NULL OR m.current_participants >= min_participants)
        AND (max_participants IS NULL OR (m.max_participants IS NOT NULL AND m.max_participants <= max_participants))
        
        -- Distance filter using spatial index
        AND ST_DWithin(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY 
        -- Order by distance, closest first
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        )
    LIMIT max_results;
$$;

-- Update the free meetups search function to leverage the same improved filtering
DROP FUNCTION IF EXISTS public.search_nearby_free_meetups(double precision, double precision, integer, integer);

CREATE OR REPLACE FUNCTION public.search_nearby_free_meetups(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    max_results integer DEFAULT 50,
    min_duration_minutes integer DEFAULT NULL,
    max_duration_minutes integer DEFAULT NULL
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
    user_id uuid,
    distance_meters float
)
LANGUAGE sql
STABLE
AS $$
    -- Reuse the enhanced search function, only returning free meetups
    SELECT * FROM public.search_nearby_meetups(
        lat,
        lng,
        radius_meters,
        max_results,
        true,  -- include_free
        false, -- include_paid
        min_duration_minutes,
        max_duration_minutes,
        NULL,  -- min_participants
        NULL   -- max_participants
    );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_nearby_meetups(
    double precision, double precision, integer, integer, 
    boolean, boolean, integer, integer, integer, integer
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.search_nearby_free_meetups(
    double precision, double precision, integer, integer, integer, integer
) TO anon, authenticated; 