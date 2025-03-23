-- Fix the stack depth limit error by optimizing the create_meetup function
-- Drop the current function
DROP FUNCTION IF EXISTS public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb);

-- Create a simplified version of the function without recursion or excessive nesting
CREATE OR REPLACE FUNCTION public.create_meetup(
    p_title text DEFAULT 'Meetup',
    p_description text DEFAULT null,
    p_address text DEFAULT null,
    p_image text DEFAULT null,
    p_status text DEFAULT 'active',
    p_is_free_meetup boolean DEFAULT true,
    p_duration_minutes integer DEFAULT 60,
    p_max_participants integer DEFAULT 10,
    p_location_json jsonb DEFAULT null -- Only use JSON format for location
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_location geography;
    v_inserted_id uuid;
    v_result jsonb;
    v_title text;
    v_description text;
    v_image text;
    v_max_participants integer;
    v_duration_minutes integer;
    v_start_time timestamptz;
    v_expiry_time timestamptz;
BEGIN
    -- Set appropriate default values based on meetup type
    v_title := COALESCE(p_title, CASE WHEN p_is_free_meetup THEN 'Instant Meetup' ELSE 'Scheduled Meetup' END);
    v_description := p_description;
    v_image := p_image;
    v_start_time := CURRENT_TIMESTAMP;
    
    -- Set appropriate defaults for different meetup types
    IF p_is_free_meetup THEN
        -- For free meetups (mostly anonymous), use simplified defaults
        v_max_participants := COALESCE(p_max_participants, 10);
        v_duration_minutes := COALESCE(p_duration_minutes, 60);
        
        -- Allow anonymous users for free meetups
        v_user_id := CASE WHEN auth.role() = 'authenticated' THEN auth.uid() ELSE NULL END;
    ELSE
        -- For paid meetups (authenticated users only), use more customizable defaults
        v_max_participants := COALESCE(p_max_participants, 20);
        v_duration_minutes := COALESCE(p_duration_minutes, 120);
        
        -- Require authentication for paid meetups
        IF auth.role() != 'authenticated' THEN
            RAISE EXCEPTION 'Authentication required for creating non-free meetups';
        END IF;
        v_user_id := auth.uid();
    END IF;
    
    -- Validate required fields
    IF p_address IS NULL THEN
        RAISE EXCEPTION 'Address is required for all meetups';
    END IF;
    
    -- Convert location from JSON to geography
    IF p_location_json IS NULL THEN
        RAISE EXCEPTION 'Location is required in JSON format {lat, lng}';
    END IF;
    
    -- Ensure we have lat and lng
    IF (p_location_json->>'lat') IS NULL OR (p_location_json->>'lng') IS NULL THEN
        RAISE EXCEPTION 'Location must include lat and lng properties';
    END IF;

    -- Convert to geography - avoid nesting calls that could increase stack depth
    v_location := ST_SetSRID(ST_MakePoint(
        (p_location_json->>'lng')::float,
        (p_location_json->>'lat')::float
    ), 4326)::geography;
    
    -- Calculate expiry time directly without using a view
    v_expiry_time := v_start_time + (v_duration_minutes * interval '1 minute');
    
    -- Insert the meetup - directly set expires_at
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
        expires_at  -- Directly use the field that's in the table
    ) VALUES (
        v_user_id,
        v_title,
        v_description,
        v_location,
        p_address,
        v_image,
        v_max_participants,
        v_start_time,
        v_duration_minutes,
        p_status,
        p_is_free_meetup,
        1,
        v_expiry_time  -- Set the value directly
    )
    RETURNING id INTO v_inserted_id;
    
    -- Build the result manually instead of using a separate query
    -- This avoids potential recursive calls that caused the stack depth error
    v_result := jsonb_build_object(
        'id', v_inserted_id,
        'user_id', v_user_id,
        'title', v_title,
        'description', v_description,
        'location', p_location_json, -- Use the original location JSON directly
        'address', p_address,
        'image_url', v_image,
        'created_at', v_start_time,
        'updated_at', v_start_time,
        'max_participants', v_max_participants,
        'current_participants', 1,
        'starts_at', v_start_time,
        'duration_minutes', v_duration_minutes,
        'expires_at', v_expiry_time, -- Include the expires_at field
        'status', p_status,
        'is_free_meetup', p_is_free_meetup
    );
    
    RETURN v_result;
END;
$$;

-- Drop meetups_with_expiry view if it exists to avoid any potential recursion
DROP VIEW IF EXISTS public.meetups_with_expiry CASCADE;

-- Create a regular view without any complex calculations
CREATE OR REPLACE VIEW public.meetups_with_expiry AS
SELECT * FROM public.meetups;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_meetup(text, text, text, text, text, boolean, integer, integer, jsonb) TO anon, authenticated;
GRANT SELECT ON public.meetups_with_expiry TO anon, authenticated; 