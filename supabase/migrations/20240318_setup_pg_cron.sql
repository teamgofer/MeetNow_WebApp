-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function to clean up expired meetups
CREATE OR REPLACE FUNCTION public.cleanup_expired_meetups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive expired meetups to a history table if needed
  INSERT INTO meetup_history (id, created_at, expires_at, title, description, location, user_id, image_url, address)
  SELECT id, created_at, expires_at, title, description, location, user_id, image_url, address
  FROM meetups
  WHERE expires_at < NOW() AND NOT archived;
  
  -- Mark as archived in the main table
  UPDATE meetups
  SET archived = true
  WHERE expires_at < NOW() AND NOT archived;
  
  -- Log the cleanup
  RAISE NOTICE 'Expired meetups cleanup completed at %', NOW();
END;
$$;

-- Ensure the meetup_history table exists
CREATE TABLE IF NOT EXISTS meetup_history (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location GEOMETRY(POINT, 4326) NOT NULL,
  user_id UUID,
  image_url TEXT,
  address TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function for refreshing user activity stats
CREATE OR REPLACE FUNCTION public.refresh_user_activity_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user activity statistics
  -- This is a placeholder - implement actual statistics calculation
  UPDATE user_profiles
  SET 
    meetups_attended = (
      SELECT COUNT(*) 
      FROM meetup_attendees 
      WHERE user_id = user_profiles.id AND created_at > NOW() - INTERVAL '30 days'
    ),
    meetups_created = (
      SELECT COUNT(*) 
      FROM meetups 
      WHERE user_id = user_profiles.id AND created_at > NOW() - INTERVAL '30 days'
    );
  
  RAISE NOTICE 'User activity stats refreshed at %', NOW();
END;
$$;

-- Schedule jobs
-- Run cleanup of expired meetups every hour
SELECT cron.schedule('0 * * * *', $$SELECT public.cleanup_expired_meetups()$$);

-- Run user activity stats refresh daily at 3 AM
SELECT cron.schedule('0 3 * * *', $$SELECT public.refresh_user_activity_stats()$$);

-- Add database maintenance job weekly (Sunday at 2 AM)
SELECT cron.schedule('0 2 * * 0', $$VACUUM ANALYZE$$);

-- List all scheduled jobs (informational)
-- SELECT * FROM cron.job; 