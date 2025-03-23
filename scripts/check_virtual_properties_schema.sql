-- Script to check the schema of the virtual_properties table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'virtual_properties'
ORDER BY 
    ordinal_position; 