-- CLEAN SLATE MIGRATION
-- Complete setup of meetups functionality with improved design

-- Create the meetups table with appropriate constraints
CREATE TABLE public.meetups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    title text NOT NULL DEFAULT 'Meetup',
    description text,
    -- Make location nullable to allow more flexibility
    location geography(Point, 4326),
    address text NOT NULL DEFAULT 'Unknown location',
    image_url text,
    max_participants integer NOT NULL DEFAULT 10,
    current_participants integer NOT NULL DEFAULT 1,
    starts_at timestamptz NOT NULL DEFAULT now(),
    duration_minutes integer NOT NULL DEFAULT 60,
    status text NOT NULL DEFAULT 'active',
    is_free_meetup boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes to improve query performance
CREATE INDEX meetups_location_idx ON public.meetups USING GIST (location);
CREATE INDEX meetups_user_id_idx ON public.meetups (user_id);
CREATE INDEX meetups_status_idx ON public.meetups (status);
CREATE INDEX meetups_is_free_meetup_idx ON public.meetups (is_free_meetup);
CREATE INDEX meetups_starts_at_idx ON public.meetups (starts_at);

-- Create a view that includes the calculated expiry time
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT 
    id, title, description, location, address, image_url,
    user_id, created_at, starts_at, duration_minutes,
    starts_at + (duration_minutes || ' minutes')::interval AS expires_at,
    status, is_free_meetup, max_participants, current_participants
FROM public.meetups;

-- Simple, efficient function to create meetups without complex features
CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text,
    p_description text,
    p_address text,
    p_image text,
    p_lat float8,
    p_lng float8,
    p_duration_minutes integer,
    p_is_free_meetup boolean
)
RETURNS json
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
            duration_minutes,
            is_free_meetup
        ) VALUES (
            auth.uid(),
            p_title,
            p_description,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_address,
            p_image,
            p_duration_minutes,
            p_is_free_meetup
        )
        RETURNING id, created_at, title, starts_at, duration_minutes
    )
    SELECT json_build_object(
        'id', id,
        'title', title,
        'created_at', created_at,
        'starts_at', starts_at,
        'duration_minutes', duration_minutes,
        'expires_at', starts_at + (duration_minutes || ' minutes')::interval
    )
    FROM inserted;
$$;

-- Simplified function for free meetups
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_title text,
    p_description text,
    p_address text,
    p_lat float8,
    p_lng float8
)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT public.create_meetup(
        p_title,
        p_description,
        p_address,
        NULL,
        p_lat,
        p_lng,
        60,  -- Default 60 min for free meetups
        true -- Always free
    );
$$;

-- Function to search for nearby meetups using simple parameters
CREATE OR REPLACE FUNCTION public.search_nearby_meetups(
    p_lat float8,
    p_lng float8,
    p_distance_meters float8 DEFAULT 5000,
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.meetups_with_expiry
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.meetups_with_expiry
    WHERE status = 'active'
      AND expires_at > now()
      AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_distance_meters
      )
    ORDER BY 
      ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      )
    LIMIT p_limit;
$$;

-- Function to search specifically for free meetups
CREATE OR REPLACE FUNCTION public.search_nearby_free_meetups(
    p_lat float8,
    p_lng float8,
    p_distance_meters float8 DEFAULT 5000,
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.meetups_with_expiry
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.search_nearby_meetups(p_lat, p_lng, p_distance_meters, p_limit)
    WHERE is_free_meetup = true;
$$;

-- Function to check if a meetup is expired
CREATE OR REPLACE FUNCTION public.is_meetup_expired(
    p_meetup_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.meetups_with_expiry
        WHERE id = p_meetup_id AND expires_at < now()
    );
$$;

-- Set appropriate permissions
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public meetups are viewable by everyone" 
    ON public.meetups FOR SELECT 
    USING (status = 'active');

-- Allow users to update their own meetups
CREATE POLICY "Users can update their own meetups" 
    ON public.meetups FOR UPDATE 
    USING (user_id = auth.uid());

-- Allow users to delete their own meetups
CREATE POLICY "Users can delete their own meetups" 
    ON public.meetups FOR DELETE 
    USING (user_id = auth.uid());

-- Grant permissions for functions and views
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_meetup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_free_meetups TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_meetup_expired TO anon, authenticated; 