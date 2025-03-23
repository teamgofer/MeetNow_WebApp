-- Final fix for stack depth issues - completely eliminate all recursive paths

-- First, drop all database objects that might be causing recursion
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Drop all related functions
DO $$
DECLARE
  func_name text;
BEGIN
  -- Drop all functions with the name 'create_meetup'
  FOR func_name IN (
    SELECT p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_meetup'
  )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_name || ' CASCADE';
  END LOOP;

  -- Drop all functions with the name 'create_free_meetup'
  FOR func_name IN (
    SELECT p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_free_meetup'
  )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_name || ' CASCADE';
  END LOOP;
END
$$;

-- Create an extremely simplified version of create_meetup with minimal SQL
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
    v_lng float8;
    v_lat float8;
    v_inserted_id uuid;
    v_start_time timestamptz;
    v_expiry_time timestamptz;
BEGIN
    -- Get bare minimum info with no function calls
    v_user_id := CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END;
    v_start_time := CURRENT_TIMESTAMP;
    v_expiry_time := v_start_time + make_interval(mins => COALESCE(p_duration_minutes, 60));
    
    -- Extract lat/lng with no possible recursive calls
    v_lng := CASE WHEN p_location_json->>'lng' IS NOT NULL THEN (p_location_json->>'lng')::float8 ELSE 0 END;
    v_lat := CASE WHEN p_location_json->>'lat' IS NOT NULL THEN (p_location_json->>'lat')::float8 ELSE 0 END;
    
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
        ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography,
        COALESCE(p_address, 'Unknown location'),
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
    
    -- Return minimal data without any additional queries
    RETURN jsonb_build_object(
        'id', v_inserted_id,
        'title', COALESCE(p_title, 'Instant Meetup'),
        'location', p_location_json,
        'address', COALESCE(p_address, 'Unknown location'),
        'created_at', v_start_time,
        'starts_at', v_start_time,
        'duration_minutes', COALESCE(p_duration_minutes, 60),
        'expires_at', v_expiry_time
    );
END;
$$;

-- Create an extremely simplified wrapper for backward compatibility
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
        p_title,
        p_description,
        p_address,
        p_image,
        'active',
        TRUE,
        60,
        10,
        p_location
    );
$$;

-- Create a simple view
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    id, title, description, location, address, place_name, image_url, 
    created_by, created_at, starts_at, is_free_meetup, is_permanent, status,
    token_id, metadata, user_id, max_participants, current_participants, 
    updated_at, duration_minutes, expires_at
FROM 
    public.meetups;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 