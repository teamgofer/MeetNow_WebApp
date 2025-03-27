-- List all tables in the database schema
-- This will help identify if the table name is different

SELECT 
  table_name
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name; 