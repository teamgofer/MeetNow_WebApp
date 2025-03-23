-- CREATE RAW SQL FUNCTION
-- This function uses explicit SQL with minimal complexity

-- Create a function for direct raw SQL insert
CREATE OR REPLACE FUNCTION public.insert_meetup_raw(
    p_title text,
    p_description text,
    p_address text,
    p_lat float8,
    p_lng float8
)
RETURNS json
LANGUAGE sql
AS $$
    WITH inserted AS (
        INSERT INTO public.meetups (
            title,
            description,
            address,
            location,
            starts_at,
            duration_minutes,
            status,
            is_free_meetup,
            current_participants
        ) VALUES (
            p_title,
            p_description,
            p_address,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            CURRENT_TIMESTAMP,
            60,
            'active',
            true,
            1
        )
        RETURNING id, created_at
    )
    SELECT json_build_object(
        'id', id,
        'created_at', created_at
    )
    FROM inserted;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_meetup_raw TO anon, authenticated; 