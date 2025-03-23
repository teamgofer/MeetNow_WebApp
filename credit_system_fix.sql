-- Create the credit system functions for premium meetups
-- Execute this in the Supabase SQL Editor

-- Function to calculate required credits based on meetup duration
CREATE OR REPLACE FUNCTION calculate_required_credits(requested_duration INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_duration INT := 60; -- Base duration in minutes (1 hour)
  credits_per_hour INT := 5; -- Credits per additional hour
  additional_hours FLOAT;
BEGIN
  -- If duration is less than or equal to base duration, no credits required
  IF requested_duration <= base_duration THEN
    RETURN 0;
  END IF;
  
  -- Calculate additional hours beyond the base duration
  additional_hours := (requested_duration - base_duration) / 60.0;
  
  -- Round up to the nearest hour and multiply by credits per hour
  RETURN CEILING(additional_hours) * credits_per_hour;
END;
$$;

-- Function to get user credits
CREATE OR REPLACE FUNCTION get_user_credits(user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_credits INT;
BEGIN
  -- Get the user's credits
  SELECT credits INTO user_credits
  FROM profiles
  WHERE id = user_id;
  
  -- Return credits (defaults to 0 if null)
  RETURN COALESCE(user_credits, 0);
END;
$$;

-- Function to use credits for a meetup
CREATE OR REPLACE FUNCTION use_credits_for_meetup(user_id UUID, credit_amount INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INT;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = user_id;
  
  -- Ensure user has enough credits
  IF COALESCE(current_credits, 0) < credit_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', credit_amount, COALESCE(current_credits, 0);
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET credits = COALESCE(credits, 0) - credit_amount
  WHERE id = user_id;
  
  -- Log the transaction
  INSERT INTO credits_history (user_id, amount, operation, notes)
  VALUES (user_id, credit_amount, 'use', 'Used for premium meetup');
  
  RETURN TRUE;
END;
$$;

-- Makes the functions executable by authenticated users
GRANT EXECUTE ON FUNCTION calculate_required_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION use_credits_for_meetup TO authenticated; 