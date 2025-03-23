-- Compatibility Layer Script
-- This script creates views and functions to make the repaired schema
-- compatible with the frontend code that expects a different structure

-- First, create a view that maps 'free_meetups' to 'meetups'
DROP VIEW IF EXISTS public.free_meetups;

CREATE VIEW public.free_meetups AS
SELECT
    id,
    creator_id,
    title,
    description,
    jsonb_build_object(
        'lat', ST_Y(location::geometry),
        'lng', ST_X(location::geometry)
    ) as location,
    address,
    image_url,
    created_at,
    updated_at,
    max_participants,
    current_participants,
    expires_at,
    status,
    null as meetup_type,
    null as tags,
    address as place_name
FROM
    public.meetups;

-- Create a trigger to make the view updatable
CREATE OR REPLACE FUNCTION public.free_meetups_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.meetups (
        creator_id,
        title,
        description,
        location,
        address,
        image_url,
        max_participants,
        expires_at,
        status
    ) VALUES (
        COALESCE(NEW.creator_id, auth.uid()),
        COALESCE(NEW.title, 'Instant Meetup'),
        NEW.description,
        ST_SetSRID(ST_MakePoint(
            (NEW.location->>'lng')::float,
            (NEW.location->>'lat')::float
        ), 4326)::geography,
        NEW.address,
        NEW.image_url,
        COALESCE(NEW.max_participants, 10),
        COALESCE(NEW.expires_at, now() + interval '1 hour'),
        COALESCE(NEW.status, 'active')
    )
    RETURNING id, creator_id, title, description, 
        jsonb_build_object(
            'lat', ST_Y(location::geometry),
            'lng', ST_X(location::geometry)
        ) as location,
        address, image_url, created_at, updated_at, max_participants, current_participants, expires_at, status
    INTO NEW;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS free_meetups_insert_trigger ON public.free_meetups;

CREATE TRIGGER free_meetups_insert_trigger
INSTEAD OF INSERT ON public.free_meetups
FOR EACH ROW
EXECUTE FUNCTION public.free_meetups_insert();

-- Create update trigger for free_meetups view
CREATE OR REPLACE FUNCTION public.free_meetups_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.meetups SET
        title = COALESCE(NEW.title, OLD.title),
        description = COALESCE(NEW.description, OLD.description),
        address = COALESCE(NEW.address, OLD.address),
        image_url = COALESCE(NEW.image_url, OLD.image_url),
        status = COALESCE(NEW.status, OLD.status),
        max_participants = COALESCE(NEW.max_participants, OLD.max_participants),
        expires_at = COALESCE(NEW.expires_at, OLD.expires_at),
        location = CASE 
            WHEN NEW.location IS NOT NULL THEN
                ST_SetSRID(ST_MakePoint(
                    (NEW.location->>'lng')::float,
                    (NEW.location->>'lat')::float
                ), 4326)::geography
            ELSE OLD.location
        END
    WHERE id = OLD.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS free_meetups_update_trigger ON public.free_meetups;

CREATE TRIGGER free_meetups_update_trigger
INSTEAD OF UPDATE ON public.free_meetups
FOR EACH ROW
EXECUTE FUNCTION public.free_meetups_update();

-- Create RPC function for creating free meetups (compatibility with frontend code)
CREATE OR REPLACE FUNCTION public.create_free_meetup(
    p_location jsonb,
    p_address text,
    p_status text default 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_expires_at timestamptz;
    v_result record;
    v_meetup jsonb;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- Calculate expiration (1 hour from now)
    v_expires_at := now() + interval '1 hour';
    
    -- Insert the meetup
    INSERT INTO public.meetups (
        creator_id,
        title,
        description,
        location,
        address,
        image_url,
        max_participants,
        expires_at,
        status
    ) VALUES (
        v_user_id,
        'Instant Meetup',
        null,
        ST_SetSRID(ST_MakePoint(
            (p_location->>'lng')::float,
            (p_location->>'lat')::float
        ), 4326)::geography,
        p_address,
        null,
        10,
        v_expires_at,
        p_status
    )
    RETURNING 
        id,
        creator_id,
        title,
        description,
        jsonb_build_object(
            'lat', ST_Y(location::geometry),
            'lng', ST_X(location::geometry)
        ) as location,
        address,
        image_url,
        created_at,
        updated_at,
        max_participants,
        current_participants,
        expires_at,
        status
    INTO v_result;
    
    -- Convert to JSON
    v_meetup := row_to_json(v_result)::jsonb;
    
    RETURN v_meetup;
END;
$$;

-- For testing
COMMENT ON FUNCTION public.create_free_meetup IS 'Compatibility function for creating meetups with the old frontend code'; 