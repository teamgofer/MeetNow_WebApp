-- Diagnostic script to check the current database schema state

-- Check if extensions exist
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('postgis', 'uuid-ossp', 'pg_cron');

-- Check if schemas exist
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('public', 'auth', 'storage', 'cron');

-- Check if public tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'meetups', 'meetup_participants');

-- Check if auth.users exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'auth' 
  AND table_name = 'users'
);

-- Check if custom enum type exists
SELECT typname, typcategory
FROM pg_type
WHERE typname = 'meetup_status';

-- Check if the meetups table has the correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'meetups';

-- Check if postgis column exists
SELECT f_geometry_column, type, srid
FROM public.geometry_columns
WHERE f_table_name = 'meetups'
UNION ALL
SELECT f_geography_column, type, srid
FROM public.geography_columns
WHERE f_table_name = 'meetups';

-- Check if indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('meetups', 'meetup_participants', 'profiles')
AND schemaname = 'public';

-- Check if functions exist
SELECT proname, proargnames, proargtypes
FROM pg_proc
WHERE proname IN ('nearby_meetups', 'create_meetup', 'handle_new_participant', 'cleanup_expired_meetups');

-- Check if triggers exist
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname IN ('on_participant_added', 'on_participant_left');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'meetups', 'meetup_participants')
AND schemaname = 'public';

-- Check if policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'meetups', 'meetup_participants')
AND schemaname = 'public';

-- Check if cronjobs exist - safely check if cron.job table exists first
DO $$
BEGIN
  -- Check if the cron.job table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'cron' AND table_name = 'job'
  ) THEN
    -- If it exists, execute the query
    PERFORM 
      jobname, 
      schedule,
      command,
      active
    FROM cron.job
    WHERE jobname = 'cleanup-expired-meetups';
  ELSE
    -- If it doesn't exist, provide a message
    RAISE NOTICE 'pg_cron extension is not fully set up - cron.job table not found';
  END IF;
END
$$; 