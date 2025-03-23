-- Verify if the test user exists and show important details

-- Check auth.users table for our test user
SELECT 
  id,
  email,
  email_confirmed_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  is_anonymous,
  is_sso_user
FROM auth.users
WHERE email = 'display_test@example.com';

-- Check if the profile was created
SELECT *
FROM public.profiles
WHERE username = 'displaytest';

-- Check the count of all users in the auth.users table
SELECT COUNT(*) as total_users
FROM auth.users;

-- Check the structure of the identities table to understand required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'identities';

-- If the user exists but doesn't appear in the Auth UI, we need to insert into identities table
DO $$
DECLARE
  test_user_id UUID;
  identity_exists BOOLEAN;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'display_test@example.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found user with ID: %', test_user_id;
    
    -- Check if an identity already exists
    SELECT EXISTS (
      SELECT 1 FROM auth.identities
      WHERE user_id = test_user_id
    ) INTO identity_exists;
    
    -- If no identity exists, create one
    IF NOT identity_exists THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        test_user_id,
        jsonb_build_object('sub', test_user_id::text, 'email', 'display_test@example.com'),
        'email',
        'display_test@example.com', -- provider_id is typically the email for email provider
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created identity record for user with email display_test@example.com';
    ELSE
      RAISE NOTICE 'Identity record already exists for user';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found in auth.users table';
    
    -- Let's try to create the user again with a different approach
    INSERT INTO auth.users (
      id,
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
    ) VALUES (
      gen_random_uuid(),
      'display_test2@example.com',
      '$2a$10$AbCDeFgHiJkLmNoPqRsTuVwXyZ',  -- Dummy hashed password
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Display Test User 2"}',
      false,
      false,
      false
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created new test user with ID: %', test_user_id;
    
    -- Now create the identity record
    IF test_user_id IS NOT NULL THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        test_user_id,
        jsonb_build_object('sub', test_user_id::text, 'email', 'display_test2@example.com'),
        'email',
        'display_test2@example.com', -- provider_id is typically the email for email provider
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created identity record for new test user';
      
      -- Create profile
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        bio,
        credits,
        created_at,
        updated_at
      ) VALUES (
        test_user_id,
        'displaytest2',
        'Display Test User 2',
        'This is a test user account for development purposes.',
        200,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created profile with 200 credits for new test user';
    END IF;
  END IF;
END
$$; 