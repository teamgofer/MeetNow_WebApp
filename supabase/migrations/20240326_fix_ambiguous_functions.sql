-- Fix the ambiguous function issues
-- PostgreSQL requires explicit function signatures when dropping overloaded functions

-- First try to drop all possible versions of create_free_meetup with different parameter signatures
DO $$
BEGIN
    -- Drop all variations of create_free_meetup that might exist
    DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(text, text, jsonb, text, text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(text, text, jsonb, text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(text, text, text, text, text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(p_location jsonb, p_address text, p_title text, p_description text, p_image text);
    DROP FUNCTION IF EXISTS public.create_free_meetup(p_title text, p_description text, p_location jsonb, p_address text, p_image text);
    DROP FUNCTION IF EXISTS public.create_free_meetup();
EXCEPTION WHEN OTHERS THEN
    -- If any drop operation fails, continue with the next statement
    RAISE NOTICE 'Error while dropping: %', SQLERRM;
END
$$;

-- Drop the meetups_with_expiry view to avoid any dependency issues
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Drop the create_meetup function
DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb);

-- Create a simplified version without any complex processing
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
    v_user_id uuid := NULL;
    v_location geography;
    v_inserted_id uuid;
    v_result jsonb;
    v_start_time timestamptz := CURRENT_TIMESTAMP;
    v_expiry_time timestamptz;
BEGIN
    -- Set user ID if authenticated
    IF auth.role() = 'authenticated' THEN
        v_user_id := auth.uid();
    END IF;
    
    -- Validate required fields
    IF p_address IS NULL THEN
        RAISE EXCEPTION 'Address is required';
    END IF;
    
    IF p_location_json IS NULL OR (p_location_json->>'lat') IS NULL OR (p_location_json->>'lng') IS NULL THEN
        RAISE EXCEPTION 'Location with lat/lng is required';
    END IF;

    -- Extract lat/lng directly
    v_location := ST_SetSRID(ST_MakePoint(
        (p_location_json->>'lng')::float8,
        (p_location_json->>'lat')::float8
    ), 4326)::geography;
    
    -- Calculate expiry time
    v_expiry_time := v_start_time + (p_duration_minutes * interval '1 minute');
    
    -- Insert meetup
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
        current_participants,
        expires_at
    ) VALUES (
        v_user_id,
        COALESCE(p_title, 'Instant Meetup'),
        p_description,
        v_location,
        p_address,
        p_image,
        COALESCE(p_max_participants, 10),
        v_start_time,
        COALESCE(p_duration_minutes, 60),
        COALESCE(p_status, 'active'),
        COALESCE(p_is_free_meetup, true),
        1,
        v_expiry_time
    )
    RETURNING id INTO v_inserted_id;
    
    -- Build result JSON manually
    v_result := jsonb_build_object(
        'id', v_inserted_id,
        'user_id', v_user_id,
        'title', COALESCE(p_title, 'Instant Meetup'),
        'description', p_description,
        'location', p_location_json,
        'address', p_address,
        'image_url', p_image,
        'created_at', v_start_time,
        'updated_at', v_start_time,
        'max_participants', COALESCE(p_max_participants, 10),
        'current_participants', 1,
        'starts_at', v_start_time,
        'duration_minutes', COALESCE(p_duration_minutes, 60),
        'expires_at', v_expiry_time,
        'status', COALESCE(p_status, 'active'),
        'is_free_meetup', COALESCE(p_is_free_meetup, true)
    );
    
    RETURN v_result;
END;
$$;

-- Create a simple backward compatibility wrapper for the create_free_meetup function
-- This will prevent any future "function not found" errors
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_image text DEFAULT NULL,
    p_status text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple wrapper that calls the unified create_meetup function
    RETURN public.create_meetup(
        p_title := p_title,
        p_description := p_description,
        p_address := p_address,
        p_image := p_image,
        p_status := p_status,
        p_is_free_meetup := true,
        p_location_json := p_location
    );
END;
$$;

-- Create a simple pass-through view
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT * FROM public.meetups;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text, text) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 