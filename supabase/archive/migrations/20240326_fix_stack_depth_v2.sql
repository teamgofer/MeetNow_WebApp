-- Fix the stack depth limit error with an ultra-simplified version
-- First, drop any dependent objects
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;
DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb);

-- Create a bare-bones version without any complex processing
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
    -- Set simple defaults with minimal processing
    IF auth.role() = 'authenticated' THEN
        v_user_id := auth.uid();
    END IF;
    
    -- Check bare minimum requirements
    IF p_address IS NULL THEN
        RAISE EXCEPTION 'Address is required';
    END IF;
    
    IF p_location_json IS NULL OR (p_location_json->>'lat') IS NULL OR (p_location_json->>'lng') IS NULL THEN
        RAISE EXCEPTION 'Location with lat/lng is required';
    END IF;

    -- Directly construct location without nested functions
    -- Use explicit casts to avoid function nesting
    DECLARE
        v_lng float8 := (p_location_json->>'lng')::float8;
        v_lat float8 := (p_location_json->>'lat')::float8;
    BEGIN
        v_location := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography;
    END;
    
    -- Calculate expiry time directly
    v_expiry_time := v_start_time + ((COALESCE(p_duration_minutes, 60))::text || ' minutes')::interval;
    
    -- Direct insert with minimal processing
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
    
    -- Manually build return object without any queries or function calls
    v_result := jsonb_build_object(
        'id', v_inserted_id::text,
        'user_id', CASE WHEN v_user_id IS NULL THEN NULL ELSE v_user_id::text END,
        'title', COALESCE(p_title, 'Instant Meetup'),
        'description', p_description,
        'location', p_location_json,
        'address', p_address,
        'image_url', p_image,
        'created_at', v_start_time::text,
        'updated_at', v_start_time::text,
        'max_participants', COALESCE(p_max_participants, 10),
        'current_participants', 1,
        'starts_at', v_start_time::text,
        'duration_minutes', COALESCE(p_duration_minutes, 60),
        'expires_at', v_expiry_time::text,
        'status', COALESCE(p_status, 'active'),
        'is_free_meetup', COALESCE(p_is_free_meetup, true)
    );
    
    RETURN v_result;
END;
$$;

-- Create a very simple pass-through view
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT * FROM public.meetups;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated;

-- Just to make sure - drop any remaining old versions of create_free_meetup if they exist
DROP FUNCTION IF EXISTS public.create_free_meetup; 