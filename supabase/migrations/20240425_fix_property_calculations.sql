-- Migration to fix property value calculations
-- This replaces the mock implementations with more accurate geographical data modeling

BEGIN;

-- Fix the population density function to be more accurate for real-world locations
CREATE OR REPLACE FUNCTION public.get_external_population_density(
  lat FLOAT,
  lng FLOAT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cache_key TEXT;
  v_cached_data JSONB;
  v_result JSONB;
BEGIN
  -- Generate cache key
  v_cache_key := 'population_density:' || lat::TEXT || ',' || lng::TEXT;
  
  -- Check if the external_api_cache table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) THEN
    -- Check cache first
    SELECT data INTO v_cached_data
    FROM public.external_api_cache
    WHERE cache_key = v_cache_key
    AND expires_at > now();
    
    -- If found in cache, update last accessed and return
    IF v_cached_data IS NOT NULL THEN
      UPDATE public.external_api_cache
      SET last_accessed = now()
      WHERE cache_key = v_cache_key;
      
      -- Log cache hit if the table exists
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'external_api_usage_logs'
      ) THEN
        INSERT INTO public.external_api_usage_logs
        (api_name, endpoint, cached)
        VALUES ('population_density', 'lookup', TRUE);
      END IF;
      
      RETURN v_cached_data;
    END IF;
  END IF;
  
  -- In production, this would make an external API call
  -- For now, we'll generate mock data based on coordinates
  -- with more realistic urban density patterns
  
  -- US coordinates (simplified bounding box)
  IF (lat BETWEEN 24.0 AND 50.0) AND (lng BETWEEN -125.0 AND -66.0) THEN
    -- New York area (around Manhattan)
    IF (lat BETWEEN 40.7 AND 40.9) AND (lng BETWEEN -74.1 AND -73.9) THEN
      v_result := jsonb_build_object(
        'density', 25000 + (random() * 5000),
        'source', 'census_api_mock',
        'confidence', 0.95,
        'timestamp', now()
      );
    -- Los Angeles area
    ELSIF (lat BETWEEN 33.9 AND 34.2) AND (lng BETWEEN -118.5 AND -118.2) THEN
      v_result := jsonb_build_object(
        'density', 8000 + (random() * 2000),
        'source', 'census_api_mock',
        'confidence', 0.9,
        'timestamp', now()
      );
    -- Chicago area
    ELSIF (lat BETWEEN 41.8 AND 42.0) AND (lng BETWEEN -87.8 AND -87.6) THEN
      v_result := jsonb_build_object(
        'density', 11000 + (random() * 2000),
        'source', 'census_api_mock',
        'confidence', 0.9,
        'timestamp', now()
      );
    -- Denver area
    ELSIF (lat BETWEEN 39.7 AND 39.8) AND (lng BETWEEN -105.1 AND -104.9) THEN
      v_result := jsonb_build_object(
        'density', 4000 + (random() * 1000),
        'source', 'census_api_mock',
        'confidence', 0.85,
        'timestamp', now()
      );
    -- Rural Montana or similar areas
    ELSIF (lat BETWEEN 45.0 AND 48.0) AND (lng BETWEEN -112.0 AND -108.0) THEN
      v_result := jsonb_build_object(
        'density', 10 + (random() * 50),
        'source', 'census_api_mock',
        'confidence', 0.8,
        'timestamp', now()
      );
    -- Other US areas - moderate density
    ELSE
      v_result := jsonb_build_object(
        'density', 1000 + (random() * 3000),
        'source', 'census_api_mock',
        'confidence', 0.7,
        'timestamp', now()
      );
    END IF;
  ELSE
    -- International population density
    v_result := jsonb_build_object(
      'density', 2000 + abs(cos(lat) * sin(lng) * 3000), -- reduced multiplication factor
      'source', 'worldpop_api_mock',
      'confidence', 0.6,
      'timestamp', now()
    );
  END IF;
  
  -- Cache result for 1 day if the cache table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) THEN
    INSERT INTO public.external_api_cache
    (cache_key, data, source, expires_at)
    VALUES
    (v_cache_key, v_result, v_result->>'source', now() + INTERVAL '1 day');
    
    -- Log external API call if the log table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'external_api_usage_logs'
    ) THEN
      INSERT INTO public.external_api_usage_logs
      (api_name, endpoint, request_params, cached)
      VALUES (
        'population_density', 
        'lookup', 
        jsonb_build_object('lat', lat, 'lng', lng),
        FALSE
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Cleanup the external API cache to force regeneration with new values
-- Only if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) THEN
    DELETE FROM public.external_api_cache WHERE cache_key LIKE 'population_density:%';
  END IF;
END $$;

-- Create a function to clear test properties and recreate them
CREATE OR REPLACE FUNCTION public.reset_test_properties()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  -- New York (Manhattan) - very high density urban area
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
  
  -- Chicago (Downtown) - high density urban area
  ('Test Dynamic Chicago', 'micro_location',
   'Chicago', 
   ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-87.6298, 41.8781)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id),
  
  -- Denver (Downtown) - medium density urban area
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
   
  RETURN 'Created 5 test properties';
END;
$$;

-- Make function available to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_test_properties TO authenticated;

-- Create a convenience function for running the test
CREATE OR REPLACE FUNCTION public.test_property_values()
RETURNS TABLE (
  property_name TEXT,
  city TEXT,
  base_value NUMERIC,
  current_value NUMERIC,
  value_multiplier NUMERIC,
  density NUMERIC,
  poi_factor NUMERIC,
  trending_factor NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean and create test properties
  PERFORM public.reset_test_properties();
  
  -- Update all property values
  PERFORM public.update_all_property_values_external();
  
  -- Return results in a nicely formatted table
  RETURN QUERY
  SELECT 
    p.name AS property_name,
    p.city,
    p.base_value::NUMERIC,
    p.current_value::NUMERIC,
    (p.current_value / p.base_value)::NUMERIC(5,2) AS value_multiplier,
    COALESCE((
      SELECT (pf.external_data_sources->>'density')::NUMERIC 
      FROM public.property_value_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_type = 'population_density'
      LIMIT 1
    ), 0) AS density,
    COALESCE((
      SELECT pf.factor_value::NUMERIC(5,2)
      FROM public.property_value_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_type = 'poi_proximity'
      LIMIT 1
    ), 0) AS poi_factor,
    COALESCE((
      SELECT pf.factor_value::NUMERIC(5,2)
      FROM public.property_value_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_type = 'trending_location'
      LIMIT 1
    ), 0) AS trending_factor
  FROM 
    public.virtual_properties p
  WHERE 
    p.name LIKE 'Test Dynamic %'
  ORDER BY 
    p.current_value DESC;
END;
$$;

-- Make function available to authenticated users
GRANT EXECUTE ON FUNCTION public.test_property_values TO authenticated;

COMMIT; 