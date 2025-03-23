-- Manual cleanup script for expired meetups
-- Use this if pg_cron is not available in your Supabase plan

-- Create the manual cleanup function if it doesn't exist
CREATE OR REPLACE FUNCTION public.manual_cleanup_expired_meetups()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_count integer;
BEGIN
    WITH updated AS (
        UPDATE public.meetups
        SET status = 'expired'
        WHERE status = 'active'
        AND expires_at <= now()
        RETURNING id
    )
    SELECT count(*) INTO cleanup_count FROM updated;
    
    RETURN 'Cleaned up ' || cleanup_count || ' expired meetups. Run this function regularly to keep your database clean.';
END;
$$;

-- Execute the function to clean up expired meetups right now
SELECT public.manual_cleanup_expired_meetups(); 