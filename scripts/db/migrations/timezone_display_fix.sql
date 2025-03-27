-- Timezone display fix for meetups
-- Shows meetups with their timestamps converted to your timezone

-- First, check your session's current timezone setting
SHOW timezone;

-- Create a view that displays meetups with timestamps in your local timezone
-- You can change 'America/Los_Angeles' to your actual timezone
CREATE OR REPLACE VIEW meetups_local_time AS
SELECT 
  id,
  title,
  description,
  address,
  status,
  starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' AS local_starts_at,
  duration_minutes,
  (starts_at + (duration_minutes * interval '1 minute')) 
    AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' AS local_expires_at,
  created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' AS local_created_at,
  user_id,
  CASE
    WHEN ((starts_at + (duration_minutes * interval '1 minute')) < current_timestamp) THEN 'expired'
    WHEN status = 'active' THEN 'active'
    ELSE status
  END AS calculated_status,
  is_free_meetup,
  image_url,
  max_participants,
  current_participants
FROM 
  meetups;

-- Test by viewing meetups with local times
SELECT 
  id,
  title,
  local_starts_at,
  duration_minutes,
  local_expires_at,
  calculated_status
FROM 
  meetups_local_time
ORDER BY 
  local_starts_at DESC
LIMIT 10;

-- Function to update a meetup's timestamp to ensure it's displayed correctly
CREATE OR REPLACE FUNCTION fix_meetup_timezone(meetup_id UUID, offset_hours INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update the starts_at time with the adjustment
  UPDATE meetups
  SET starts_at = starts_at + (offset_hours * interval '1 hour')
  WHERE id = meetup_id
  RETURNING 
    jsonb_build_object(
      'id', id,
      'title', title,
      'starts_at', starts_at,
      'adjusted_by', offset_hours || ' hours',
      'new_expiry', starts_at + (duration_minutes * interval '1 minute')
    ) INTO v_result;
    
  RETURN v_result;
END;
$$;

-- Grant access to the view and function
GRANT SELECT ON meetups_local_time TO authenticated, anon;
GRANT EXECUTE ON FUNCTION fix_meetup_timezone(UUID, INTEGER) TO authenticated; 