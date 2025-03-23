-- Update create_meetup function to match the actual database schema

DROP FUNCTION IF EXISTS public.create_meetup;

CREATE OR REPLACE FUNCTION public.create_meetup(
  p_title text,
  p_description text,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_image text,
  p_user_id uuid,
  p_duration_minutes integer DEFAULT 60
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_meetup_id uuid;
  required_credits integer;
  user_credits integer;
  free_duration integer := 60; -- 1 hour is free
  location_point geography; -- Use geography type matching schema
BEGIN
  -- Validate input
  IF p_lat IS NULL OR p_lng IS NULL OR p_address IS NULL THEN
    RAISE EXCEPTION 'Location and address are required';
  END IF;
  
  IF p_title IS NULL OR p_title = '' THEN
    p_title := 'Instant Meetup';
  END IF;
  
  IF p_duration_minutes IS NULL OR p_duration_minutes < 60 THEN
    p_duration_minutes := 60; -- Default to 1 hour minimum
  END IF;
  
  -- Create PostGIS point from lat/lng as geography type
  location_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  
  -- Anonymous users (NULL user_id) can only create 1-hour meetups
  IF p_user_id IS NULL THEN
    IF p_duration_minutes > free_duration THEN
      RAISE EXCEPTION 'Anonymous users can only create 1-hour meetups';
    END IF;
  ELSE
    -- Registered user with extended duration - check credits
    IF p_duration_minutes > free_duration THEN
      -- Calculate required credits
      SELECT calculate_required_credits(p_duration_minutes) INTO required_credits;
      
      -- Check user's credits
      SELECT credits INTO user_credits
      FROM public.profiles
      WHERE id = p_user_id;
      
      IF user_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
      END IF;
      
      IF user_credits < required_credits THEN
        RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', required_credits, user_credits;
      END IF;
      
      -- Deduct credits
      UPDATE public.profiles
      SET 
        credits = credits - required_credits,
        updated_at = NOW()
      WHERE id = p_user_id;
    END IF;
  END IF;
  
  -- Insert the meetup with all fields matching the schema
  INSERT INTO public.meetups (
    title,
    description,
    address,
    location,      -- Geography type
    image_url,
    user_id,
    starts_at,     -- Instead of expires_at
    duration_minutes,
    status,
    is_free_meetup, -- Added this field
    max_participants, -- Use default value
    current_participants, -- Use default value
    created_at
  )
  VALUES (
    p_title,
    p_description,
    p_address,
    location_point,
    p_image,
    p_user_id,
    NOW(),        -- Starts now
    p_duration_minutes,
    'active',
    (p_duration_minutes <= free_duration), -- is_free_meetup is true for meetups under 60 minutes
    10,           -- Default max_participants
    1,            -- Default current_participants (the creator)
    NOW()
  )
  RETURNING id INTO new_meetup_id;
  
  -- If the user is not NULL, add them as a participant
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.meetup_participants (
      meetup_id,
      user_id,
      joined_at
    ) VALUES (
      new_meetup_id,
      p_user_id,
      NOW()
    );
  END IF;
  
  RETURN new_meetup_id;
END;
$$; 