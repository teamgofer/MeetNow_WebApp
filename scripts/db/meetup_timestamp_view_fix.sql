-- Script to fix only the view issue
-- Execute this separately first to fix the view

-- First check the view structure
SELECT 
  column_name,
  ordinal_position
FROM 
  information_schema.columns 
WHERE 
  table_name = 'meetups_with_expiry'
ORDER BY 
  ordinal_position;

-- Drop the view with CASCADE to ensure it's really removed
DROP VIEW IF EXISTS meetups_with_expiry CASCADE;

-- Create a completely new view with a different name to avoid any conflicts
CREATE VIEW meetups_expiry_view AS
SELECT 
  m.*,
  (m.starts_at + (m.duration_minutes * interval '1 minute')) AS expires_at,
  CASE
    WHEN (m.starts_at + (m.duration_minutes * interval '1 minute')) < current_timestamp THEN 'expired'
    WHEN m.status = 'active' THEN 'active'
    ELSE m.status
  END AS calculated_status
FROM 
  meetups m;

-- Grant permissions on the new view
GRANT SELECT ON meetups_expiry_view TO anon, authenticated; 