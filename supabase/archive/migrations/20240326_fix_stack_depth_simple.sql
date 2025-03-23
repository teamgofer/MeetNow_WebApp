-- Drop existing views first
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Drop functions with proper syntax (without DEFAULT values)
DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_free_meetup(text, text, jsonb, text, text);

-- Create simple function with pure SQL
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
            current_participants,
            expires_at
        ) VALUES (
            CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END,
            COALESCE(p_title, 'Instant Meetup'),
            p_description,
            ST_SetSRID(ST_MakePoint(
                CASE WHEN p_location_json->>'lng' IS NOT NULL THEN (p_location_json->>'lng')::float8 ELSE 0 END,
                CASE WHEN p_location_json->>'lat' IS NOT NULL THEN (p_location_json->>'lat')::float8 ELSE 0 END
            ), 4326)::geography,
            COALESCE(p_address, 'Unknown location'),
            p_image,
            COALESCE(p_max_participants, 10),
            CURRENT_TIMESTAMP,
            COALESCE(p_duration_minutes, 60),
            COALESCE(p_status, 'active'),
            COALESCE(p_is_free_meetup, true),
            1,
            CURRENT_TIMESTAMP + (COALESCE(p_duration_minutes, 60) * interval '1 minute')
        )
        RETURNING *
    )
    SELECT jsonb_build_object(
        'id', i.id,
        'title', i.title,
        'location', p_location_json,
        'address', i.address,
        'created_at', i.created_at,
        'starts_at', i.starts_at,
        'duration_minutes', i.duration_minutes,
        'expires_at', i.expires_at
    )
    FROM inserted i;
$$;

-- Create simple wrapper with pure SQL
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

-- Create a simple pass-through view
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT * FROM public.meetups;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 