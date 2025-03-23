-- Fixed test script for dynamic property values
-- This script checks for available functions first

-- Start a transaction so we can rollback if needed
BEGIN;

-- Check which property valuation functions exist
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM 
  pg_proc 
WHERE 
  proname LIKE '%property%value%' AND
  pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Insert test properties
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get a valid user ID or create a placeholder
  SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    v_owner_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  -- Delete test properties if they exist
  DELETE FROM public.virtual_properties WHERE name LIKE 'Test Dynamic %';
  
  -- Insert test properties in various significant locations
  INSERT INTO public.virtual_properties 
  (name, property_type, city, center_point, geometry, base_value, current_value, owner_id)
  VALUES
  -- New York (Times Square) - very high density urban area
  ('Test Dynamic NYC', 'micro_location',
   'New York', 
   ST_SetSRID(ST_MakePoint(-73.9855, 40.7580), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-73.9855, 40.7580)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id),
  
  -- Los Angeles (Hollywood) - high density urban area
  ('Test Dynamic LA', 'micro_location',
   'Los Angeles', 
   ST_SetSRID(ST_MakePoint(-118.3267, 34.1184), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-118.3267, 34.1184)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id),
  
  -- Rural Montana - low density area
  ('Test Dynamic Rural', 'micro_location',
   'Rural', 
   ST_SetSRID(ST_MakePoint(-110.3626, 46.8797), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-110.3626, 46.8797)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id);
END $$;

-- Show the initial state of properties
SELECT id, name, city, base_value, current_value
FROM public.virtual_properties
WHERE name LIKE 'Test Dynamic %';

-- Test the external population density function
SELECT 
  p.name,
  p.city,
  ST_Y(p.center_point::geometry) AS lat,
  ST_X(p.center_point::geometry) AS lng
FROM 
  public.virtual_properties p
WHERE 
  name LIKE 'Test Dynamic %';

-- Try to call the get_external_population_density function directly if it exists
DO $$
DECLARE
  v_func_exists BOOLEAN;
  v_property RECORD;
  v_result JSONB;
BEGIN
  -- Check if the function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_external_population_density' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO v_func_exists;
  
  IF v_func_exists THEN
    -- Function exists, try to call it for each property
    FOR v_property IN 
      SELECT 
        id, 
        name,
        ST_Y(center_point::geometry) AS lat,
        ST_X(center_point::geometry) AS lng
      FROM public.virtual_properties
      WHERE name LIKE 'Test Dynamic %'
    LOOP
      EXECUTE 'SELECT public.get_external_population_density($1, $2)' 
      INTO v_result
      USING v_property.lat, v_property.lng;
      
      RAISE NOTICE 'Property % density data: %', v_property.name, v_result;
    END LOOP;
  ELSE
    RAISE NOTICE 'Function get_external_population_density does not exist';
  END IF;
END $$;

-- Check what tables and columns we have
SELECT 
  table_name,
  column_name,
  data_type
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name IN ('virtual_properties', 'property_value_factors', 'external_api_cache');

-- Try to update property values using whatever function is available
DO $$
DECLARE
  v_func_exists BOOLEAN;
  v_property RECORD;
  v_result JSONB;
BEGIN
  -- First check for calculate_dynamic_property_value
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_dynamic_property_value' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO v_func_exists;
  
  IF v_func_exists THEN
    -- Function exists, try to call it for each property
    FOR v_property IN 
      SELECT id, name FROM public.virtual_properties WHERE name LIKE 'Test Dynamic %'
    LOOP
      EXECUTE 'SELECT public.calculate_dynamic_property_value($1)' 
      INTO v_result
      USING v_property.id;
      
      RAISE NOTICE 'Updated property % with result: %', v_property.name, v_result;
    END LOOP;
  ELSE
    -- Try to use update_property_values_external_metrics if it exists
    SELECT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'update_property_values_external_metrics' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO v_func_exists;
    
    IF v_func_exists THEN
      EXECUTE 'SELECT public.update_property_values_external_metrics()' INTO v_result;
      RAISE NOTICE 'Updated all properties with result: %', v_result;
    ELSE
      -- If neither function exists, try update_all_property_values_external
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_all_property_values_external' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) INTO v_func_exists;
      
      IF v_func_exists THEN
        EXECUTE 'SELECT public.update_all_property_values_external()' INTO v_result;
        RAISE NOTICE 'Updated all properties with result: %', v_result;
      ELSE
        RAISE NOTICE 'No property update functions found';
      END IF;
    END IF;
  END IF;
END $$;

-- Show the final state of properties
SELECT 
  p.name, 
  p.city, 
  p.base_value, 
  p.current_value,
  (p.current_value::NUMERIC / p.base_value)::NUMERIC(4,2) as value_multiplier
FROM 
  public.virtual_properties p
WHERE 
  p.name LIKE 'Test Dynamic %'
ORDER BY 
  p.current_value DESC;

-- Check if we have property_value_factors with external_data_sources
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'property_value_factors' 
    AND column_name = 'external_data_sources'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    -- Show property factors if column exists
    RAISE NOTICE 'Showing property factors with external data sources:';
    -- Column exists, perform the query
    PERFORM p.name, p.city, f.factor_type, f.factor_value, f.external_data_sources
    FROM public.virtual_properties p
    JOIN public.property_value_factors f ON p.id = f.property_id
    WHERE p.name LIKE 'Test Dynamic %' AND f.external_data_sources IS NOT NULL;
  ELSE
    -- Show regular property factors
    RAISE NOTICE 'external_data_sources column does not exist in property_value_factors table';
    
    -- Show whatever factors we have
    PERFORM p.name, p.city, f.factor_type, f.factor_value
    FROM public.virtual_properties p
    JOIN public.property_value_factors f ON p.id = f.property_id
    WHERE p.name LIKE 'Test Dynamic %';
  END IF;
END $$;

-- Check if we have the external API cache table and some data
DO $$
DECLARE
  v_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    -- Show cache entries if table exists
    RAISE NOTICE 'Showing external API cache entries:';
    PERFORM cache_key, source, expires_at
    FROM public.external_api_cache
    ORDER BY created_at DESC
    LIMIT 10;
  ELSE
    RAISE NOTICE 'external_api_cache table does not exist';
  END IF;
END $$;

-- Only commit if you want to keep the test data
-- COMMIT;
-- Or rollback to clean up
ROLLBACK; 