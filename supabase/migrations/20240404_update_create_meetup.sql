-- Update the create_meetup function to ensure all schema fields are properly handled

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
AS $$
DECLARE
  new_meetup_id uuid;
  required_credits integer;
  user_credits integer;
  free_duration integer := 60; -- 1 hour is free
  anonymous_user_id uuid; -- For handling anonymous users
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
  
  -- Handle anonymous users - meetups.user_id is NOT NULL in the schema
  IF p_user_id IS NULL THEN
    -- For anonymous users, free meetups only
    IF p_duration_minutes > free_duration THEN
      RAISE EXCEPTION 'Anonymous users can only create 1-hour meetups';
    END IF;
    
    -- Get or create an anonymous user ID
    -- We'll use a consistent UUID for all anonymous users
    anonymous_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    
    -- Check if this anonymous ID exists in profiles table
    PERFORM 1 FROM public.profiles WHERE id = anonymous_user_id;
    
    -- If not, create it
    IF NOT FOUND THEN
      INSERT INTO public.profiles (
        id, 
        username, 
        display_name, 
        bio, 
        credits,
        created_at,
        updated_at
      ) VALUES (
        anonymous_user_id,
        'anonymous',
        'Anonymous User',
        'Anonymous user for unregistered meetups',
        0,
        NOW(),
        NOW()
      );
    END IF;
    
    -- Use the anonymous ID
    p_user_id := anonymous_user_id;
  ELSE
    -- Non-anonymous user with extended duration - check credits
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
  
  -- Insert the meetup with all required fields
  INSERT INTO public.meetups (
    title,
    description,
    address,
    lat,
    lng,
    image_url,
    user_id,
    expires_at,
    duration_minutes,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_title,
    p_description,
    p_address,
    p_lat,
    p_lng,
    p_image,
    p_user_id,
    NOW() + (p_duration_minutes * INTERVAL '1 minute'),
    p_duration_minutes,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_meetup_id;
  
  RETURN new_meetup_id;
END;
$$; 