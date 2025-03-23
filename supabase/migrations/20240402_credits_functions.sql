-- This migration adds all the SQL functions needed for credit management
-- Including credit calculation, balance check, and credit usage

-- Function to calculate required credits for a meetup based on requested duration
CREATE OR REPLACE FUNCTION public.calculate_required_credits(requested_duration integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  free_duration integer := 60; -- 1 hour is free
  extra_minutes integer;
  credits_needed integer;
BEGIN
  -- If requested duration is within free limit, no credits needed
  IF requested_duration <= free_duration THEN
    RETURN 0;
  END IF;
  
  -- Calculate extra minutes beyond free duration
  extra_minutes := requested_duration - free_duration;
  
  -- Calculate credits needed:
  -- 1-2 hours (60-120 mins): 5 credits
  -- 2-3 hours (120-180 mins): 10 credits
  -- 3-4 hours (180-240 mins): 15 credits
  -- 4-5 hours (240-300 mins): 20 credits
  -- Anything over 5 hours: 25 credits
  
  CASE
    WHEN extra_minutes <= 60 THEN credits_needed := 5;
    WHEN extra_minutes <= 120 THEN credits_needed := 10;
    WHEN extra_minutes <= 180 THEN credits_needed := 15;
    WHEN extra_minutes <= 240 THEN credits_needed := 20;
    ELSE credits_needed := 25;
  END CASE;
  
  RETURN credits_needed;
END;
$$;

-- Function to get a user's current credit balance
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_credits integer;
BEGIN
  SELECT credits INTO user_credits
  FROM public.profiles
  WHERE id = user_id;
  
  -- Return 0 if user doesn't exist or has no credits
  RETURN COALESCE(user_credits, 0);
END;
$$;

-- Function to add credits to a user's account
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id uuid, credit_amount integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN false;
  END IF;
  
  -- Add credits to user's account
  UPDATE public.profiles
  SET 
    credits = COALESCE(credits, 0) + credit_amount,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Function to use credits for a meetup
CREATE OR REPLACE FUNCTION public.use_credits_for_meetup(user_id uuid, credit_amount integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_credits integer;
BEGIN
  -- Get user's current credits
  SELECT credits INTO user_credits
  FROM public.profiles
  WHERE id = user_id;
  
  -- Check if user exists and has enough credits
  IF user_credits IS NULL OR user_credits < credit_amount THEN
    RETURN false;
  END IF;
  
  -- Deduct credits from user's account
  UPDATE public.profiles
  SET 
    credits = credits - credit_amount,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- TODO: Could also log the credit usage in a dedicated table
  -- INSERT INTO credit_transactions (user_id, amount, transaction_type, created_at)
  -- VALUES (user_id, credit_amount, 'meetup_extension', NOW());
  
  RETURN true;
END;
$$;

-- Function to create a meetup with specified duration and handle credits
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
LANGUAGE plpgsql SECURITY DEFINER
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
    required_credits := public.calculate_required_credits(p_duration_minutes);
    
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
  
  -- Calculate expiry time (current time + duration in minutes)
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