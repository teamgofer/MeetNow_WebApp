-- Final fix for stack depth and function overload issues (v2)

-- Step 1: Drop ALL existing functions with similar names to avoid conflicts
DO $$
BEGIN
  -- Instead of generating signatures with defaults, just drop all versions manually
  -- For create_meetup
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup(text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_meetup() CASCADE;
  
  -- For create_free_meetup
  DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text) CASCADE;
  DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb) CASCADE;

  RAISE NOTICE 'Successfully dropped all function variations';
END
$$;

-- Drop related views that might depend on these functions
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Step 2: Create a completely rewritten create_meetup function with no recursion
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
    v_location geography;
    v_result jsonb;
BEGIN
    -- Simple variable assignments to avoid any function calls that could cause stack issues
    v_user_id := CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END;
    v_start_time := CURRENT_TIMESTAMP;
    v_expiry_time := v_start_time + make_interval(mins => COALESCE(p_duration_minutes, 60));
    
    -- Extract lat/lng with no recursive calls
    v_lng := CASE WHEN p_location_json->>'lng' IS NOT NULL THEN (p_location_json->>'lng')::float8 ELSE 0 END;
    v_lat := CASE WHEN p_location_json->>'lat' IS NOT NULL THEN (p_location_json->>'lat')::float8 ELSE 0 END;
    
    -- Create geography point directly
    v_location := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography;
    
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
    
    -- Create result JSON directly without any function calls
    v_result := jsonb_build_object(
        'id', v_inserted_id,
        'title', COALESCE(p_title, 'Instant Meetup'),
        'location', p_location_json,
        'address', COALESCE(p_address, 'Unknown location'),
        'created_at', v_start_time,
        'starts_at', v_start_time,
        'duration_minutes', COALESCE(p_duration_minutes, 60),
        'expires_at', v_expiry_time
    );
    
    RETURN v_result;
END;
$$;

-- Step 3: Create a simple wrapper with no recursion
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_image text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Call the create_meetup function with appropriate parameters
    SELECT create_meetup(
        p_title := p_title,
        p_description := p_description,
        p_address := p_address,
        p_image := p_image,
        p_status := 'active',
        p_is_free_meetup := TRUE,
        p_duration_minutes := 60,
        p_max_participants := 10,
        p_location_json := p_location
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Step 4: Create a simple view for compatibility
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    id, title, description, location, address, image_url,
    user_id, created_at, starts_at, duration_minutes, expires_at,
    status, is_free_meetup, max_participants, current_participants
FROM public.meetups;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 