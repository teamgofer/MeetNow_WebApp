-- This migration creates a test user directly in the database
-- Note: This is for testing purposes only and bypasses normal auth flow

-- 1. Create a test user in auth.users
DO $$
DECLARE
  test_user_id UUID;
  test_user_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Check if a test user already exists with the email 'test@example.com'
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = 'test@example.com'
  ) INTO test_user_exists;

  IF NOT test_user_exists THEN
    -- Insert a test user into auth.users
    -- Note: The password hash is for 'password123' but auth is bypassed anyway
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      confirmation_token
    ) VALUES (
      gen_random_uuid(),
      'test@example.com',
      '$2a$10$AbCDeFgHiJkLmNoPqRsTuVwXyZ',
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Test User"}',
      ''
    ) RETURNING id INTO test_user_id;

    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- Check if profile exists (it probably was created by the trigger)
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = test_user_id
    ) INTO profile_exists;
    
    IF profile_exists THEN
      -- Update the user's profile
      UPDATE public.profiles
      SET 
        username = 'testuser',
        display_name = 'Test User',
        bio = 'This is a test user account for development purposes.',
        credits = 50,
        updated_at = NOW()
      WHERE id = test_user_id;
      
      RAISE NOTICE 'Profile updated with 50 credits';
    ELSE
      -- Insert a new profile if somehow the trigger didn't create one
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_admin,
        credits,
        created_at,
        updated_at
      ) VALUES (
        test_user_id,
        'testuser',
        'Test User',
        NULL,
        'This is a test user account for development purposes.',
        false,
        50, -- Give them 50 credits to start with
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'New profile created with 50 credits';
    END IF;
  ELSE
    -- If test user exists, get their ID and update their profile
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com';
    
    -- Check if profile exists
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = test_user_id
    ) INTO profile_exists;
    
    IF profile_exists THEN
      -- Update the user's profile
      UPDATE public.profiles
      SET 
        username = 'testuser',
        display_name = 'Test User',
        bio = 'This is a test user account for development purposes.',
        credits = 50,
        updated_at = NOW()
      WHERE id = test_user_id;
      
      RAISE NOTICE 'Existing user profile updated with 50 credits';
    ELSE
      -- Create a profile if it doesn't exist
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_admin,
        credits,
        created_at,
        updated_at
      ) VALUES (
        test_user_id,
        'testuser',
        'Test User',
        NULL,
        'This is a test user account for development purposes.',
        false,
        50,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created missing profile for existing user with 50 credits';
    END IF;
  END IF;
END
$$; 