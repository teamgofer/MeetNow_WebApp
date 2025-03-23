-- Direct execution test script for the dynamic property values
-- Run this directly in the SQL editor or psql console

-- Start a transaction so we can rollback if needed
BEGIN;

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
  
  -- Chicago (The Loop) - medium-high density urban area
  ('Test Dynamic Chicago', 'micro_location',
   'Chicago', 
   ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-87.6298, 41.8781)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id),
   
  -- Denver - medium density urban area
  ('Test Dynamic Denver', 'micro_location',
   'Denver', 
   ST_SetSRID(ST_MakePoint(-104.9903, 39.7392), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-104.9903, 39.7392)::geometry, 0.001), 4326)::geography,
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

-- Update all properties with dynamic values
SELECT id, name, 
       (public.calculate_dynamic_property_value(id)->>'current_value')::INTEGER as new_value,
       (public.calculate_dynamic_property_value(id)->>'factors')::JSONB->'overall' as overall_factor
FROM public.virtual_properties
WHERE name LIKE 'Test Dynamic %';

-- Show the final state of properties with their factors
SELECT 
  p.name, 
  p.city, 
  p.base_value, 
  p.current_value,
  (p.current_value::NUMERIC / p.base_value)::NUMERIC(4,2) as value_multiplier,
  f.external_data_sources->'density'->'factor' as density_factor,
  f.external_data_sources->'pointsOfInterest'->'factor' as poi_factor,
  f.external_data_sources->'trending'->'factor' as trending_factor
FROM 
  public.virtual_properties p
LEFT JOIN 
  public.property_value_factors f 
  ON p.id = f.property_id AND f.factor_type = 'external_metrics'
WHERE 
  p.name LIKE 'Test Dynamic %'
ORDER BY 
  p.current_value DESC;

-- Check the API cache
SELECT 
  left(cache_key, 50) as cache_key, 
  source, 
  expires_at
FROM 
  public.external_api_cache
ORDER BY 
  created_at DESC
LIMIT 10;

-- Only commit if you want to keep the test data
-- COMMIT;
-- Or rollback to clean up
-- ROLLBACK; 