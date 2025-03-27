-- RLS Policies to secure admin operations
-- Execute these in Supabase SQL Editor

-- Check if credits_history table exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credits_history') THEN
    CREATE TABLE public.credits_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(id),
      admin_id UUID NOT NULL REFERENCES public.profiles(id),
      amount INTEGER NOT NULL,
      operation TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
    
    -- Add RLS to credits_history
    ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;
    
    -- Only admins can view credits history
    CREATE POLICY "Admins can view all credits history" 
    ON public.credits_history FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    
    -- Users can view their own credits history
    CREATE POLICY "Users can view their own credits history" 
    ON public.credits_history FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop the policy that allows admins to update any profile
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can update any profile'
  ) THEN
    DROP POLICY "Admins can update any profile" ON profiles;
  END IF;
  
  -- Drop the policy that limits non-admins
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Non-admins cannot modify admin status'
  ) THEN
    DROP POLICY "Non-admins cannot modify admin status" ON profiles;
  END IF;
END
$$;

-- Create TWO separate policies instead of one with OLD/NEW references
-- This approach is more compatible with Supabase

-- 1. Policy that gives full update access to admins
CREATE POLICY "Admins can update any profile" 
ON profiles 
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- 2. Policy that allows non-admins to update any field EXCEPT is_admin
CREATE POLICY "Non-admins cannot modify admin status" 
ON profiles 
FOR UPDATE
USING (
  -- User is updating their own profile
  auth.uid() = id
)
WITH CHECK (
  -- They cannot change the is_admin field
  -- This is checked by a trigger instead (see below)
  auth.uid() = id
);

-- Create a trigger to prevent non-admins from modifying is_admin
DO $$
BEGIN
  -- First drop the trigger if it exists
  DROP TRIGGER IF EXISTS prevent_admin_status_change ON profiles;
  
  -- Create function to check admin status modifications
  CREATE OR REPLACE FUNCTION prevent_admin_status_change()
  RETURNS TRIGGER AS $func$
  DECLARE
    current_user_is_admin BOOLEAN;
  BEGIN
    -- Check if updating user is an admin
    SELECT is_admin INTO current_user_is_admin 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- If is_admin field is being changed and user is not an admin, prevent it
    IF OLD.is_admin IS DISTINCT FROM NEW.is_admin AND current_user_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Only administrators can modify admin status';
    END IF;
    
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;
  
  -- Create the trigger
  CREATE TRIGGER prevent_admin_status_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_status_change();
END
$$;

-- Function to add credits to a user (already uses OR REPLACE which is idempotent)
CREATE OR REPLACE FUNCTION add_user_credits(user_id UUID, amount INTEGER)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_is_admin BOOLEAN;
  current_credits INTEGER;
BEGIN
  -- Check if caller is admin
  SELECT is_admin INTO caller_is_admin 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF caller_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only administrators can add credits to users';
  END IF;
  
  -- Validate amount
  IF amount <= 0 OR amount > 1000 THEN
    RAISE EXCEPTION 'Credits amount must be between 1 and 1000';
  END IF;

  -- Update credits
  SELECT COALESCE(credits, 0) INTO current_credits 
  FROM profiles 
  WHERE id = user_id;
  
  -- Handle NULL credits by defaulting to 0
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + amount
  WHERE id = user_id;
  
  -- Log transaction
  INSERT INTO credits_history (user_id, admin_id, amount, operation, created_at)
  VALUES (user_id, auth.uid(), amount, 'add', now());
  
  RETURN current_credits + amount;
END;
$$; 