-- USE STORED PROCEDURE INSTEAD
-- This approach uses a completely different PostgreSQL feature

-- Create a simple stored procedure instead of a function
CREATE OR REPLACE PROCEDURE public.insert_test_meetup(
    title text,
    description text,
    lat float8,
    lng float8
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_location geography;
    v_id uuid;
BEGIN
    -- Create the geography point
    v_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
    
    -- Insert the meetup
    INSERT INTO public.meetups (
        title,
        description,
        location,
        address,
        starts_at,
        duration_minutes,
        status,
        is_free_meetup,
        current_participants
    ) VALUES (
        title,
        description,
        v_location,
        'Test Address',
        CURRENT_TIMESTAMP,
        60,
        'active',
        true,
        1
    )
    RETURNING id INTO v_id;
    
    -- Return the result (procedures can't return values directly, but can log)
    RAISE NOTICE 'Created meetup with ID: %', v_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON PROCEDURE public.insert_test_meetup TO anon, authenticated; 