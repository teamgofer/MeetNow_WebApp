-- Drop the existing create_free_meetup function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text, text, integer);

-- First drop existing constraints and triggers
ALTER TABLE public.meetups 
DROP CONSTRAINT IF EXISTS meetups_user_id_fkey,
DROP CONSTRAINT IF EXISTS meetups_status_check;

-- Remove triggers that might cause recursion
DROP TRIGGER IF EXISTS set_updated_at ON public.meetups;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Make user_id nullable and recreate foreign key
ALTER TABLE public.meetups 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.meetups 
ADD CONSTRAINT meetups_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add check constraint for status
ALTER TABLE public.meetups
ADD CONSTRAINT meetups_status_check 
CHECK (status IN ('active', 'expired', 'cancelled'));

-- Ensure all necessary columns exist in the meetups table
ALTER TABLE public.meetups 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Instant Meetup',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326) NOT NULL,
ADD COLUMN IF NOT EXISTS address TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_participants INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_free_meetup BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add view for compatibility
CREATE OR REPLACE VIEW meetups_with_expiry AS
SELECT 
    *,
    starts_at + (duration_minutes * interval '1 minute') AS expires_at
FROM public.meetups;

-- Create or replace the create_free_meetup function with duration-based design
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
    -- Direct SQL query without PL/pgSQL blocks that might cause recursion
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
            created_at,
            updated_at
        ) VALUES (
            auth.uid(),
            p_title,
            p_description,
            ST_SetSRID(ST_MakePoint(
                (p_location->>'lng')::float,
                (p_location->>'lat')::float
            ), 4326)::geography,
            p_address,
            p_image,
            10,
            CURRENT_TIMESTAMP,
            p_duration_minutes,
            p_status,
            true,
            1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING 
            id,
            user_id,
            title,
            description,
            ST_AsGeoJSON(location)::jsonb as location_geojson,
            address,
            image_url,
            created_at,
            updated_at,
            max_participants,
            current_participants,
            starts_at,
            duration_minutes,
            status
    )
    SELECT 
        jsonb_build_object(
            'id', id,
            'user_id', user_id,
            'title', title,
            'description', description,
            'location', jsonb_build_object(
                'lat', (location_geojson->>'coordinates')::jsonb->1,
                'lng', (location_geojson->>'coordinates')::jsonb->0
            ),
            'address', address,
            'image_url', image_url,
            'created_at', created_at,
            'updated_at', updated_at,
            'max_participants', max_participants,
            'current_participants', current_participants,
            'starts_at', starts_at,
            'duration_minutes', duration_minutes,
            'expires_at', starts_at + (duration_minutes * interval '1 minute'),
            'status', status
        )
    FROM inserted;
$$;

-- Function to check if a meetup is expired
CREATE OR REPLACE FUNCTION public.is_meetup_expired(meetup_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        CASE 
            WHEN status = 'cancelled' THEN true
            WHEN status = 'expired' THEN true
            WHEN CURRENT_TIMESTAMP > (starts_at + (duration_minutes * interval '1 minute')) THEN true
            ELSE false
        END
    FROM public.meetups
    WHERE id = meetup_id;
$$;

-- Function to get active meetups (not expired and not cancelled)
CREATE OR REPLACE FUNCTION public.get_active_meetups()
RETURNS SETOF meetups_with_expiry
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM meetups_with_expiry
    WHERE 
        status = 'active' AND
        CURRENT_TIMESTAMP <= (starts_at + (duration_minutes * interval '1 minute'));
$$;

-- Create backward-compatible version of the function
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_title text DEFAULT 'Instant Meetup',
    p_description text DEFAULT null,
    p_image text DEFAULT null,
    p_status text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Call the new function with default duration (60 minutes)
    SELECT public.create_free_meetup(
        p_location,
        p_address,
        p_title,
        p_description,
        p_image,
        p_status,
        60
    );
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_meetup_expired(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_meetups() TO anon, authenticated;

-- Grant execute for backward compatibility (function with default duration)
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text, text) TO anon, authenticated; 