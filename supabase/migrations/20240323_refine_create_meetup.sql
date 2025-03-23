-- Refined create_meetup function with better handling of required fields and validation
DROP FUNCTION IF EXISTS public.create_meetup(
    text, text, text, text, text, text, 
    boolean, integer, integer, jsonb
);

CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text DEFAULT 'Meetup',
    p_description text DEFAULT null,
    p_location text DEFAULT null, -- PostGIS encoded string
    p_address text DEFAULT null,
    p_image text DEFAULT null,
    p_status text DEFAULT 'active',
    p_is_free_meetup boolean DEFAULT true,
    p_duration_minutes integer DEFAULT 60,
    p_max_participants integer DEFAULT 10,
    p_location_json jsonb DEFAULT null -- Fallback for backward compatibility
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_location geography;
    v_inserted_id uuid;
    v_result jsonb;
    v_title text;
    v_description text;
    v_image text;
    v_max_participants integer;
    v_duration_minutes integer;
BEGIN
    -- Set appropriate default values based on meetup type
    v_title := COALESCE(p_title, CASE WHEN p_is_free_meetup THEN 'Instant Meetup' ELSE 'Scheduled Meetup' END);
    v_description := p_description;
    v_image := p_image;
    
    -- Set appropriate defaults for different meetup types
    IF p_is_free_meetup THEN
        -- For free meetups (mostly anonymous), use simplified defaults
        v_max_participants := COALESCE(p_max_participants, 10);
        v_duration_minutes := COALESCE(p_duration_minutes, 60);
        
        -- Allow anonymous users for free meetups
        v_user_id := CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END;
    ELSE
        -- For paid meetups (authenticated users only), use more customizable defaults
        v_max_participants := COALESCE(p_max_participants, 20);
        v_duration_minutes := COALESCE(p_duration_minutes, 120);
        
        -- Require authentication for paid meetups
        IF auth.role() != 'authenticated' THEN
            RAISE EXCEPTION 'Authentication required for creating non-free meetups';
        END IF;
        v_user_id := auth.uid();
    END IF;
    
    -- Validate required fields
    IF p_address IS NULL THEN
        RAISE EXCEPTION 'Address is required for all meetups';
    END IF;
    
    -- Convert location to geography - handle both text and jsonb formats
    IF p_location IS NOT NULL THEN
        -- The function is being called with a correctly formatted PostGIS string
        v_location := p_location::geography;
    ELSIF p_location_json IS NOT NULL THEN
        -- Legacy format from JSON {lat, lng}
        v_location := ST_SetSRID(ST_MakePoint(
            (p_location_json->>'lng')::float,
            (p_location_json->>'lat')::float
        ), 4326)::geography;
    ELSE
        RAISE EXCEPTION 'Location is required';
    END IF;
    
    -- Insert the meetup
    INSERT INTO public.meetups (
        user_id,
        title,
        description,
        location,
        address,
        image_url,
        max_participants,
        starts_at,
        duration_minutes,
        status,
        is_free_meetup,
        current_participants
    ) VALUES (
        v_user_id,
        v_title,
        v_description,
        v_location,
        p_address,
        v_image,
        v_max_participants,
        CURRENT_TIMESTAMP,
        v_duration_minutes,
        p_status,
        p_is_free_meetup,
        1
    )
    RETURNING id INTO v_inserted_id;
    
    -- Retrieve the inserted record
    SELECT 
        jsonb_build_object(
            'id', m.id,
            'user_id', m.user_id,
            'title', m.title,
            'description', m.description,
            'location', jsonb_build_object(
                'lat', ST_Y(m.location::geometry),
                'lng', ST_X(m.location::geometry)
            ),
            'address', m.address,
            'image_url', m.image_url,
            'created_at', m.created_at,
            'updated_at', m.updated_at,
            'max_participants', m.max_participants,
            'current_participants', m.current_participants,
            'starts_at', m.starts_at,
            'duration_minutes', m.duration_minutes,
            'expires_at', m.starts_at + (m.duration_minutes * interval '1 minute'),
            'status', m.status,
            'is_free_meetup', m.is_free_meetup
        ) INTO v_result
    FROM public.meetups m
    WHERE m.id = v_inserted_id;
    
    RETURN v_result;
END;
$$;

-- Add an index on the location column for faster spatial queries
CREATE INDEX IF NOT EXISTS idx_meetups_location
ON public.meetups USING GIST (location);

-- Add an index on the is_free_meetup column for faster filtering
CREATE INDEX IF NOT EXISTS idx_meetups_is_free
ON public.meetups (is_free_meetup);

-- Add an index on the status column for faster filtering
CREATE INDEX IF NOT EXISTS idx_meetups_status
ON public.meetups (status);

-- Add an index on the combination of relevant search fields
CREATE INDEX IF NOT EXISTS idx_meetups_search
ON public.meetups (status, is_free_meetup);

-- Add a view that pre-calculates the expires_at time
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    *,
    starts_at + (duration_minutes * interval '1 minute') AS expires_at
FROM public.meetups;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated; 