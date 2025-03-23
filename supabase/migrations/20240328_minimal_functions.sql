-- ABSOLUTE MINIMAL FUNCTIONS
-- This is the simplest possible implementation to avoid all potential issues

-- Drop the view first
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Use direct drop statements for common function signatures
DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text) CASCADE;

-- Create very simple functions that avoid complex features
CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text,
    p_description text,
    p_address text,
    p_image text,
    p_status text,
    p_is_free_meetup boolean,
    p_duration_minutes integer,
    p_max_participants integer,
    p_location_json jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH inserted AS (
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
            auth.uid(),
            p_title,
            p_description,
            ST_SetSRID(ST_MakePoint(
                (p_location_json->>'lng')::float8, 
                (p_location_json->>'lat')::float8
            ), 4326)::geography,
            p_address,
            p_image,
            p_max_participants,
            CURRENT_TIMESTAMP,
            p_duration_minutes,
            p_status,
            p_is_free_meetup,
            1
        )
        RETURNING id, created_at
    )
    SELECT jsonb_build_object(
        'id', id,
        'created_at', created_at
    )
    FROM inserted;
$$;

-- Very simple wrapper with no optional parameters
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text,
    p_description text,
    p_image text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT public.create_meetup(
        p_title,          -- title
        p_description,    -- description
        p_address,        -- address
        p_image,          -- image
        'active',         -- status
        TRUE,             -- is_free_meetup
        60,               -- duration_minutes
        10,               -- max_participants
        p_location        -- location_json
    );
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup TO anon, authenticated; 