-- AGGRESSIVE DROP AND RECREATE FUNCTIONS
-- This approach forcibly removes all variations of the functions

-- Use PL/pgSQL to find and drop ALL function variations
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- First, drop the view that might depend on these functions
    DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;
    
    -- Find and drop all variations of create_meetup
    FOR func_record IN 
        SELECT 
            'DROP FUNCTION ' || n.nspname || '.' || p.proname || '(' || 
            pg_catalog.pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_statement
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname IN ('create_meetup', 'create_free_meetup')
    LOOP
        EXECUTE func_record.drop_statement;
        RAISE NOTICE 'Dropped function: %', func_record.drop_statement;
    END LOOP;
END
$$;

-- Create a simple view for meetups with expiry calculated
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    id, title, description, location, address, image_url,
    user_id, created_at, starts_at, 
    duration_minutes,
    starts_at + (duration_minutes || ' minutes')::interval AS expires_at,
    status, is_free_meetup, max_participants, current_participants
FROM public.meetups;

-- Create a new, very simple create_meetup function with NO recursion
-- and minimal variable assignments to avoid stack depth issues
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
LANGUAGE sql  -- Using SQL language instead of PL/pgSQL to avoid stack depth issues
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
            CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END,
            COALESCE(p_title, 'Instant Meetup'),
            p_description,
            CASE 
                WHEN p_location_json IS NOT NULL AND 
                     p_location_json->>'lng' IS NOT NULL AND 
                     p_location_json->>'lat' IS NOT NULL 
                THEN ST_SetSRID(
                    ST_MakePoint(
                        (p_location_json->>'lng')::float8, 
                        (p_location_json->>'lat')::float8
                    ), 
                    4326
                )::geography
                ELSE NULL
            END,
            COALESCE(p_address, 'Unknown location'),
            p_image,
            COALESCE(p_max_participants, 10),
            CURRENT_TIMESTAMP,
            COALESCE(p_duration_minutes, 60),
            COALESCE(p_status, 'active'),
            COALESCE(p_is_free_meetup, true),
            1
        )
        RETURNING id, title, address, created_at, starts_at, duration_minutes
    )
    SELECT jsonb_build_object(
        'id', i.id,
        'title', i.title,
        'address', i.address,
        'created_at', i.created_at,
        'starts_at', i.starts_at,
        'duration_minutes', i.duration_minutes,
        'expires_at', i.starts_at + (i.duration_minutes || ' minutes')::interval,
        'location', p_location_json
    )
    FROM inserted i;
$$;

-- Create a single, simplified wrapper for backward compatibility
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_image text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql  -- Using SQL language for simplicity
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 