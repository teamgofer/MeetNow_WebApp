-- Examine the meetups table structure
-- This will show ALL columns in the meetups table so we can find the expiry column

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_name = 'meetups'
ORDER BY 
  ordinal_position; 