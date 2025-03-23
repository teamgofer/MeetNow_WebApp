-- COMPLETELY CLEAN AND RECREATE FUNCTIONS (v3)
-- A simplified approach that avoids stack issues and function conflicts

-- First, drop ALL related objects including the view
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Drop ALL functions related to meetup creation more aggressively
DROP FUNCTION IF EXISTS public.create_meetup CASCADE;
DROP FUNCTION IF EXISTS public.create_free_meetup CASCADE;

-- Create a view for compatibility
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    id, title, description, location, address, image_url,
    user_id, created_at, starts_at, 
    duration_minutes,
    starts_at + (duration_minutes || ' minutes')::interval AS expires_at,
    status, is_free_meetup, max_participants, current_participants
FROM public.meetups;

-- Create a new, simplified create_meetup function
CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text DEFAULT 'Meetup',
    p_description text DEFAULT null,
    p_address text DEFAULT null,
    p_image text DEFAULT null,
    p_status text DEFAULT 'active',
    p_is_free_meetup boolean DEFAULT true,
    p_duration_minutes integer DEFAULT 60,
    p_max_participants integer DEFAULT 10,
    p_location_json jsonb DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_location geography;
    v_inserted_id uuid;
    v_start_time timestamptz;
    v_result jsonb;
BEGIN
    -- Set user ID based on authentication status
    v_user_id := auth.uid();
    
    -- Set the start time
    v_start_time := CURRENT_TIMESTAMP;
    
    -- Create the geography point directly from JSON
    IF p_location_json IS NOT NULL AND 
       p_location_json->>'lng' IS NOT NULL AND 
       p_location_json->>'lat' IS NOT NULL THEN
        v_location := ST_SetSRID(
            ST_MakePoint(
                (p_location_json->>'lng')::float8, 
                (p_location_json->>'lat')::float8
            ), 
            4326
        )::geography;
    ELSE
        v_location := NULL;
    END IF;
    
    -- Insert the meetup record
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
        COALESCE(p_title, 'Instant Meetup'),
        p_description,
        v_location,
        COALESCE(p_address, 'Unknown location'),
        p_image,
        COALESCE(p_max_participants, 10),
        v_start_time,
        COALESCE(p_duration_minutes, 60),
        COALESCE(p_status, 'active'),
        COALESCE(p_is_free_meetup, true),
        1
    )
    RETURNING id INTO v_inserted_id;
    
    -- Build the result JSON
    v_result := jsonb_build_object(
        'id', v_inserted_id,
        'title', COALESCE(p_title, 'Instant Meetup'),
        'address', COALESCE(p_address, 'Unknown location'),
        'created_at', v_start_time,
        'starts_at', v_start_time,
        'duration_minutes', COALESCE(p_duration_minutes, 60),
        'expires_at', v_start_time + (COALESCE(p_duration_minutes, 60) || ' minutes')::interval
    );
    
    RETURN v_result;
END;
$$;

-- Create a simplified wrapper for backward compatibility
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_image text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT public.create_meetup(
        p_title := p_title,
        p_description := p_description,
        p_address := p_address,
        p_image := p_image,
        p_status := 'active',
        p_is_free_meetup := TRUE,
        p_duration_minutes := 60,
        p_max_participants := 10,
        p_location_json := p_location
    );
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 