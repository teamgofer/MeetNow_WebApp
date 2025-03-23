-- This migration adds functions for credit management in the MeetNow app
-- Functions include: checking credit balance, using credits for meetups, and adding credits

-- Function to check user's credit balance
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credit_balance INTEGER;
BEGIN
  SELECT credits INTO credit_balance FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(credit_balance, 0);
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated;

-- Function to use credits for creating a meetup with extended duration
CREATE OR REPLACE FUNCTION public.use_credits_for_meetup(
  user_id UUID,
  credit_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credit balance
  SELECT credits INTO current_credits FROM profiles
  WHERE id = user_id;
  
  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < credit_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET 
    credits = credits - credit_amount,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Return success
  RETURN TRUE;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.use_credits_for_meetup TO authenticated;

-- Function to add credits to a user's account
CREATE OR REPLACE FUNCTION public.add_user_credits(
  user_id UUID,
  credit_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Add credits to the user's account
  UPDATE profiles
  SET 
    credits = COALESCE(credits, 0) + credit_amount,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING 1 INTO affected_rows;
  
  -- Check if update was successful
  RETURN affected_rows = 1;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_credits TO authenticated;

-- Function to calculate required credits based on meetup duration
CREATE OR REPLACE FUNCTION public.calculate_required_credits(
  requested_duration INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  free_duration INTEGER := 60; -- Free duration in minutes
  credits_per_hour INTEGER := 5; -- Credits per additional hour
  additional_minutes INTEGER;
  required_credits INTEGER;
BEGIN
  -- Calculate additional minutes beyond free duration
  additional_minutes := GREATEST(0, requested_duration - free_duration);
  
  -- Calculate required credits (rounded up to nearest hour)
  required_credits := CEILING(additional_minutes / 60.0 * credits_per_hour);
  
  RETURN required_credits;
END;
$$;

-- Grant execution permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.calculate_required_credits TO authenticated, anon; 