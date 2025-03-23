-- Fix the create_meetup function to match the exact parameter names and order expected by our code

-- Create the function with simplified syntax to avoid errors
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
BEGIN
  -- Validate input
  IF p_lat IS NULL OR p_lng IS NULL OR p_address IS NULL THEN
    RAISE EXCEPTION 'Location and address are required';
  END IF;
  
  IF p_duration_minutes IS NULL OR p_duration_minutes < 60 THEN
    p_duration_minutes := 60; -- Default to 1 hour minimum
  END IF;
  
  -- If duration is more than free allowance and user is authenticated,
  -- calculate and check credits
  IF p_duration_minutes > free_duration AND p_user_id IS NOT NULL THEN
    -- Calculate required credits
    SELECT calculate_required_credits(p_duration_minutes) INTO required_credits;
    
    -- Check user's credits
    SELECT credits INTO user_credits
    FROM public.profiles
    WHERE id = p_user_id;
    
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
  
  -- Insert the meetup
  INSERT INTO public.meetups (
    title,
    description,
    address,
    lat,
    lng,
    image_url,
    user_id,
    expires_at,
    duration_minutes
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
    p_duration_minutes
  )
  RETURNING id INTO new_meetup_id;
  
  RETURN new_meetup_id;
END;
$$; 