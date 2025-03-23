-- Allow anonymous meetups without requiring profiles

-- First, modify the meetups table to allow NULL user_id
ALTER TABLE public.meetups ALTER COLUMN user_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
ALTER TABLE public.meetups DROP CONSTRAINT IF EXISTS meetups_user_id_fkey;
ALTER TABLE public.meetups ADD CONSTRAINT meetups_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Now update the create_meetup function to handle NULL user_id properly
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
  
  -- Insert the meetup with all required fields
  INSERT INTO public.meetups (
    title,
    description,
    address,
    lat,
    lng,
    image_url,
    user_id,  -- This can now be NULL for anonymous meetups
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
    p_user_id,  -- Pass NULL directly for anonymous meetups
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