-- Create a unified create_meetup function that handles both free and paid meetups
DROP FUNCTION IF EXISTS public.create_meetup(
    text, text, text, text, text, text, 
    boolean, integer, integer, jsonb
);

CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text DEFAULT 'Meetup',
    p_description text DEFAULT null,
    p_location text DEFAULT null, -- This will actually be a PostGIS encoded string
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
BEGIN
    -- Get current user ID (nullable for anonymous free meetups)
    v_user_id := CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END;
    
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
        p_title,
        p_description,
        v_location,
        p_address,
        p_image,
        p_max_participants,
        CURRENT_TIMESTAMP,
        p_duration_minutes,
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

-- For backward compatibility: create_free_meetup function that uses create_meetup
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT 'Instant Meetup',
    p_description text DEFAULT null,
    p_image text DEFAULT null,
    p_status text DEFAULT 'active',
    p_duration_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Call the unified function with is_free_meetup = true
    SELECT public.create_meetup(
        p_title := p_title,
        p_description := p_description,
        p_address := p_address,
        p_image := p_image,
        p_status := p_status,
        p_is_free_meetup := true,
        p_duration_minutes := p_duration_minutes,
        p_location_json := p_location
    );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text, text, integer) TO anon, authenticated; 