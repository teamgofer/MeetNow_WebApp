-- This migration creates another test user directly in the database
-- with a different email address to verify it appears in the Auth UI

DO $$
DECLARE
  new_test_user_id UUID;
  test_user_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Generate a random UUID for the new user
  new_test_user_id := gen_random_uuid();
  
  -- Check if a user with the email already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = 'display_test@example.com'
  ) INTO test_user_exists;

  IF NOT test_user_exists THEN
    -- Insert test user into auth.users with all required fields based on the schema
    INSERT INTO auth.users (
      id,
      instance_id,  -- Use the existing instance_id from another user
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      is_sso_user,
      is_anonymous
    ) 
    SELECT
      new_test_user_id,
      instance_id,
      'display_test@example.com',
      '$2a$10$AbCDeFgHiJkLmNoPqRsTuVwXyZ',  -- Dummy hashed password
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Display Test User"}',
      false,
      false,
      false
    FROM auth.users
    LIMIT 1;  -- Just to get a valid instance_id
    
    RAISE NOTICE 'New test user created with ID: %', new_test_user_id;
    
    -- Create the user profile with credits
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
      new_test_user_id,
      'displaytest',
      'Display Test User',
      NULL,
      'This is a display test user to verify Auth UI integration.',
      false,
      200,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile created with 200 credits';
  ELSE
    -- If user already exists, get their ID
    SELECT id INTO new_test_user_id
    FROM auth.users
    WHERE email = 'display_test@example.com';
    
    RAISE NOTICE 'User display_test@example.com already exists with ID: %', new_test_user_id;
    
    -- Update profile credits
    UPDATE public.profiles
    SET
      credits = 200,
      updated_at = NOW()
    WHERE id = new_test_user_id;
    
    RAISE NOTICE 'Updated user credits to 200';
  END IF;
  
  -- Output the credentials for reference
  RAISE NOTICE '----- TEST USER CREDENTIALS -----';
  RAISE NOTICE 'Email: display_test@example.com';
  RAISE NOTICE 'Password: password123 (Note: direct login may not work as password is dummy)';
  RAISE NOTICE 'User ID: %', new_test_user_id;
  RAISE NOTICE '--------------------------------';
END
$$; 