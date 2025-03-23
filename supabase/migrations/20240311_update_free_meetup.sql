-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_free_meetup(jsonb, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_free_meetup(json, text, text);

-- Create the updated function
CREATE OR REPLACE FUNCTION public.create_free_meetup(
  p_location jsonb,
  p_address text,
  p_title text default 'Instant Meetup',
  p_description text default null,
  p_image text default null,
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
    status,
    is_free_meetup
  ) VALUES (
    v_user_id,
    p_title,
    p_description,
    ST_SetSRID(ST_MakePoint(
      (p_location->>'lng')::float,
      (p_location->>'lat')::float
    ), 4326)::geography,
    p_address,
    p_image,
    10,
    v_expires_at,
    p_status,
    true
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_free_meetup(jsonb, text, text, text, text, text) TO anon, authenticated; 