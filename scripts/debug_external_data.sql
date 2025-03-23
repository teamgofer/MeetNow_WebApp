-- Diagnostic script for external data calculations
BEGIN;

-- Check which functions exist
SELECT proname FROM pg_proc 
WHERE proname LIKE '%external%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Let's investigate what's happening with get_external_population_density
DO $$
DECLARE
  v_property RECORD;
  v_result JSONB;
BEGIN
  -- Define test coordinates for comparison
  FOR v_property IN 
    SELECT 
      'New York' as name, 
      40.7580 as lat, 
      -73.9855 as lng
    UNION ALL SELECT 
      'Los Angeles', 
      34.1184, 
      -118.3267
    UNION ALL SELECT 
      'Rural', 
      46.8797, 
      -110.3626
  LOOP
    -- Try to get population density data
    EXECUTE 'SELECT public.get_external_population_density($1, $2)' 
    INTO v_result
    USING v_property.lat, v_property.lng;
    
    RAISE NOTICE 'Location: %, Density data: %', v_property.name, v_result;
    
    -- See the raw density calculation
    IF v_result->>'source' = 'census_api_mock' THEN
      RAISE NOTICE 'Raw Calculation for %: 5000 + abs(sin(%) * cos(%) * 20000) = %', 
        v_property.name, 
        v_property.lat, 
        v_property.lng,
        5000 + abs(sin(v_property.lat) * cos(v_property.lng) * 20000);
    ELSIF v_result->>'source' = 'worldpop_api_mock' THEN
      RAISE NOTICE 'Raw Calculation for %: 2000 + abs(cos(%) * sin(%) * 10000) = %', 
        v_property.name, 
        v_property.lat, 
        v_property.lng,
        2000 + abs(cos(v_property.lat) * sin(v_property.lng) * 10000);
    END IF;
  END LOOP;
END $$;

-- Check for POI data
DO $$
DECLARE
  v_property RECORD;
  v_result JSONB;
BEGIN
  FOR v_property IN 
    SELECT 
      'New York' as name, 
      40.7580 as lat, 
      -73.9855 as lng
    UNION ALL SELECT 
      'Los Angeles', 
      34.1184, 
      -118.3267
    UNION ALL SELECT 
      'Rural', 
      46.8797, 
      -110.3626
  LOOP
    -- Try to get POI data
    EXECUTE 'SELECT public.get_external_points_of_interest($1, $2, 1000)' 
    INTO v_result
    USING v_property.lat, v_property.lng;
    
    RAISE NOTICE 'Location: %, POI data: %', v_property.name, v_result;
  END LOOP;
END $$;

-- Check for trending data
DO $$
DECLARE
  v_property RECORD;
  v_result JSONB;
BEGIN
  FOR v_property IN 
    SELECT 
      'New York' as name, 
      40.7580 as lat, 
      -73.9855 as lng
    UNION ALL SELECT 
      'Los Angeles', 
      34.1184, 
      -118.3267
    UNION ALL SELECT 
      'Rural', 
      46.8797, 
      -110.3626
  LOOP
    -- Try to get trending data
    EXECUTE 'SELECT public.get_external_trending_data($1, $2)' 
    INTO v_result
    USING v_property.lat, v_property.lng;
    
    RAISE NOTICE 'Location: %, Trending data: %', v_property.name, v_result;
  END LOOP;
END $$;

-- Let's look at the math in calculate_dynamic_property_value
SELECT 
  'New York' as location,
  -- Suppose density = 15000 - Check the normalization:
  0.8 + LEAST(1.2, 15000::FLOAT / 12500.0) as density_factor,
  -- Suppose POI importance = 0.9 - Check the normalization:
  0.8 + LEAST(0.7, 0.9::FLOAT * 0.7) as poi_factor,
  -- Suppose trending score = 16 - Check the normalization:
  0.9 + LEAST(0.4, 16::FLOAT / 50.0) as trending_factor
UNION ALL
SELECT 
  'Los Angeles',
  0.8 + LEAST(1.2, 8000::FLOAT / 12500.0),
  0.8 + LEAST(0.7, 0.7::FLOAT * 0.7),
  0.9 + LEAST(0.4, 14::FLOAT / 50.0);

-- Let's check the actual data in our tables
SELECT 
  id, name, city, base_value, current_value
FROM 
  public.virtual_properties
WHERE 
  name LIKE 'Test Dynamic %';

-- Check the actual external_api_cache for our test locations
SELECT 
  cache_key, 
  data->>'density' as density,
  data->>'source' as source,
  expires_at
FROM 
  public.external_api_cache
WHERE 
  cache_key LIKE 'population_density:%'
ORDER BY 
  created_at DESC;

-- Check the property_value_factors to see what's recorded
SELECT 
  p.name,
  p.city,
  f.factor_type,
  f.factor_value,
  f.external_data_sources
FROM 
  public.virtual_properties p
JOIN 
  public.property_value_factors f ON p.id = f.property_id
WHERE 
  p.name LIKE 'Test Dynamic %';

-- Roll back changes
ROLLBACK; 