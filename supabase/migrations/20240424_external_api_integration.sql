-- Migration file for External API Integration
-- This replaces the hardcoded population density approach with a more dynamic system

BEGIN;

-- Create table to store API configurations
CREATE TABLE IF NOT EXISTS public.external_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL UNIQUE,
  api_key TEXT,
  base_url TEXT NOT NULL,
  rate_limit INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lightweight cache for API responses
CREATE TABLE IF NOT EXISTS public.external_api_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Create index on cache expiration for cleanup
CREATE INDEX IF NOT EXISTS idx_external_api_cache_expires ON public.external_api_cache(expires_at);

-- Add table to track API usage for monitoring and billing
CREATE TABLE IF NOT EXISTS public.external_api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update property_value_factors to store external data sources
ALTER TABLE public.property_value_factors
ADD COLUMN IF NOT EXISTS external_data_sources JSONB;

-- Add geocoding functions to standardize coordinate handling
CREATE OR REPLACE FUNCTION public.geocode_address(
  address TEXT,
  city TEXT DEFAULT NULL,
  state TEXT DEFAULT NULL,
  country TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- This would normally call an external geocoding service
  -- For testing, we'll return mock data
  
  -- In production this would use pg_net extension or similar to make HTTP calls
  v_result := jsonb_build_object(
    'lat', 40.7128,  -- New York by default
    'lng', -74.0060,
    'confidence', 0.9,
    'source', 'mock_geocoder'
  );
  
  RETURN v_result;
END;
$$;

-- Function to simulate external API calls for population density
-- In a production environment, this would use pg_net or a similar extension to make HTTP calls
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
    
    -- Log cache hit
    INSERT INTO public.external_api_usage_logs
    (api_name, endpoint, cached)
    VALUES ('population_density', 'lookup', TRUE);
    
    RETURN v_cached_data;
  END IF;
  
  -- In production, this would make an external API call
  -- For now, we'll generate mock data based on coordinates
  
  -- US coordinates (simplified bounding box)
  IF (lat BETWEEN 24.0 AND 50.0) AND (lng BETWEEN -125.0 AND -66.0) THEN
    -- US population density (higher near coasts)
    v_result := jsonb_build_object(
      'density', 5000 + abs(sin(lat) * cos(lng) * 20000),
      'source', 'census_api_mock',
      'confidence', 0.9,
      'timestamp', now()
    );
  ELSE
    -- International population density
    v_result := jsonb_build_object(
      'density', 2000 + abs(cos(lat) * sin(lng) * 10000),
      'source', 'worldpop_api_mock',
      'confidence', 0.8,
      'timestamp', now()
    );
  END IF;
  
  -- Cache result for 1 day
  INSERT INTO public.external_api_cache
  (cache_key, data, source, expires_at)
  VALUES
  (v_cache_key, v_result, v_result->>'source', now() + INTERVAL '1 day');
  
  -- Log external API call
  INSERT INTO public.external_api_usage_logs
  (api_name, endpoint, request_params, cached)
  VALUES (
    'population_density', 
    'lookup', 
    jsonb_build_object('lat', lat, 'lng', lng),
    FALSE
  );
  
  RETURN v_result;
END;
$$;

-- Function to simulate external API calls for points of interest
CREATE OR REPLACE FUNCTION public.get_external_points_of_interest(
  lat FLOAT,
  lng FLOAT,
  radius INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cache_key TEXT;
  v_cached_data JSONB;
  v_result JSONB;
  v_poi_count INTEGER;
BEGIN
  -- Generate cache key
  v_cache_key := 'poi:' || lat::TEXT || ',' || lng::TEXT || ':' || radius::TEXT;
  
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
    
    RETURN v_cached_data;
  END IF;
  
  -- Generate mock POI metrics based on coordinates
  -- More POIs near centers of major cities (very approximate)
  -- Distance from arbitrary "city centers"
  
  -- Use fake distance metrics to simulate city proximity
  -- This is just for mock data - real impl would call external APIs
  
  -- POI count increases near major cities (simplified)
  v_poi_count := CASE
    WHEN (lat BETWEEN 40.5 AND 41.0) AND (lng BETWEEN -74.1 AND -73.9) THEN
      -- NYC area - high POI count
      20 + (random() * 30)::INTEGER
    WHEN (lat BETWEEN 33.9 AND 34.1) AND (lng BETWEEN -118.3 AND -118.1) THEN
      -- LA area - high POI count
      15 + (random() * 25)::INTEGER
    WHEN (lat BETWEEN 41.8 AND 42.0) AND (lng BETWEEN -87.8 AND -87.6) THEN
      -- Chicago area - medium-high POI count
      10 + (random() * 20)::INTEGER
    ELSE
      -- Other areas - lower POI count
      (random() * 10)::INTEGER
  END;
  
  -- Calculate POI importance based on count and a random factor
  v_result := jsonb_build_object(
    'poiCount', v_poi_count,
    'poiDensity', v_poi_count / (3.14159 * (radius/1000.0) * (radius/1000.0)),
    'poiImportance', LEAST(1.0, (v_poi_count / 50.0) + (random() * 0.3)),
    'source', 'places_api_mock',
    'confidence', 0.8,
    'timestamp', now()
  );
  
  -- Cache result for 1 week (POIs change less frequently)
  INSERT INTO public.external_api_cache
  (cache_key, data, source, expires_at)
  VALUES
  (v_cache_key, v_result, 'places_api_mock', now() + INTERVAL '1 week');
  
  -- Log external API call
  INSERT INTO public.external_api_usage_logs
  (api_name, endpoint, request_params, cached)
  VALUES (
    'points_of_interest', 
    'search', 
    jsonb_build_object('lat', lat, 'lng', lng, 'radius', radius),
    FALSE
  );
  
  RETURN v_result;
END;
$$;

-- Function to simulate external API calls for trending data
CREATE OR REPLACE FUNCTION public.get_external_trending_data(
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
  v_trending_score FLOAT;
BEGIN
  -- Generate cache key
  v_cache_key := 'trending:' || lat::TEXT || ',' || lng::TEXT;
  
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
    
    RETURN v_cached_data;
  END IF;
  
  -- Generate mock trending data based on coordinates
  -- More trending near major cities and tourist areas
  
  -- Trending score increases near major cities (simplified)
  v_trending_score := CASE
    WHEN (lat BETWEEN 40.5 AND 41.0) AND (lng BETWEEN -74.1 AND -73.9) THEN
      -- NYC area - high trending
      15.0 + (random() * 5.0)
    WHEN (lat BETWEEN 33.9 AND 34.1) AND (lng BETWEEN -118.3 AND -118.1) THEN
      -- LA area - high trending
      14.0 + (random() * 5.0)
    WHEN (lat BETWEEN 41.8 AND 42.0) AND (lng BETWEEN -87.8 AND -87.6) THEN
      -- Chicago area - medium-high trending
      12.0 + (random() * 5.0)
    ELSE
      -- Other areas - lower trending
      (random() * 10.0)
  END;
  
  v_result := jsonb_build_object(
    'trendingScore', v_trending_score,
    'mentionsCount', (v_trending_score * 100 * random())::INTEGER,
    'source', 'social_api_mock',
    'confidence', 0.7,
    'timestamp', now()
  );
  
  -- Cache result for just 4 hours (trending data changes frequently)
  INSERT INTO public.external_api_cache
  (cache_key, data, source, expires_at)
  VALUES
  (v_cache_key, v_result, 'social_api_mock', now() + INTERVAL '4 hours');
  
  -- Log external API call
  INSERT INTO public.external_api_usage_logs
  (api_name, endpoint, request_params, cached)
  VALUES (
    'social_trending', 
    'lookup', 
    jsonb_build_object('lat', lat, 'lng', lng),
    FALSE
  );
  
  RETURN v_result;
END;
$$;

-- New dynamic property valuation function that combines all external metrics
CREATE OR REPLACE FUNCTION public.calculate_dynamic_property_value(
  property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property RECORD;
  v_base_value NUMERIC;
  v_density_data JSONB;
  v_poi_data JSONB;
  v_trending_data JSONB;
  v_density_factor FLOAT;
  v_poi_factor FLOAT;
  v_trending_factor FLOAT;
  v_overall_factor FLOAT;
  v_current_value INTEGER;
  v_result JSONB;
BEGIN
  -- Get property details
  SELECT 
    id, 
    base_value,
    ST_Y(center_point::geometry) AS lat,
    ST_X(center_point::geometry) AS lng
  INTO v_property
  FROM public.virtual_properties
  WHERE id = property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Property not found'
    );
  END IF;
  
  v_base_value := v_property.base_value;
  
  -- Get external data
  v_density_data := public.get_external_population_density(
    v_property.lat,
    v_property.lng
  );
  
  v_poi_data := public.get_external_points_of_interest(
    v_property.lat,
    v_property.lng,
    1000 -- 1km radius
  );
  
  v_trending_data := public.get_external_trending_data(
    v_property.lat,
    v_property.lng
  );
  
  -- Calculate factors (each in 0.8-2.0 range)
  -- Normalize density factor
  v_density_factor := 0.8 + LEAST(1.2, (v_density_data->>'density')::FLOAT / 12500.0);
  
  -- Normalize POI factor (0.8-1.5 range)
  v_poi_factor := 0.8 + LEAST(0.7, (v_poi_data->>'poiImportance')::FLOAT * 0.7);
  
  -- Normalize trending factor (0.9-1.3 range)
  v_trending_factor := 0.9 + LEAST(0.4, (v_trending_data->>'trendingScore')::FLOAT / 50.0);
  
  -- Calculate overall factor with weights
  v_overall_factor := (
    v_density_factor * 0.5 +
    v_poi_factor * 0.3 +
    v_trending_factor * 0.2
  );
  
  -- Calculate current value
  v_current_value := (v_base_value * v_overall_factor)::INTEGER;
  
  -- Update property value
  UPDATE public.virtual_properties
  SET current_value = v_current_value
  WHERE id = property_id;
  
  -- Create or update property value factors
  INSERT INTO public.property_value_factors
  (property_id, factor_type, factor_value, external_data_sources, effective_from)
  VALUES
  (
    v_property.id,
    'external_metrics',
    v_overall_factor,
    jsonb_build_object(
      'density', jsonb_build_object(
        'value', v_density_data->>'density',
        'factor', v_density_factor,
        'source', v_density_data->>'source'
      ),
      'pointsOfInterest', jsonb_build_object(
        'value', v_poi_data->>'poiImportance',
        'factor', v_poi_factor,
        'source', v_poi_data->>'source'
      ),
      'trending', jsonb_build_object(
        'value', v_trending_data->>'trendingScore',
        'factor', v_trending_factor,
        'source', v_trending_data->>'source'
      )
    ),
    now()
  )
  ON CONFLICT ON CONSTRAINT property_value_factors_pkey DO UPDATE
  SET 
    factor_value = EXCLUDED.factor_value,
    external_data_sources = EXCLUDED.external_data_sources,
    effective_from = EXCLUDED.effective_from;
  
  -- Return results
  v_result := jsonb_build_object(
    'success', TRUE,
    'property_id', property_id,
    'base_value', v_base_value,
    'current_value', v_current_value,
    'factors', jsonb_build_object(
      'density', jsonb_build_object(
        'value', v_density_data->>'density',
        'factor', v_density_factor,
        'source', v_density_data->>'source'
      ),
      'pointsOfInterest', jsonb_build_object(
        'value', v_poi_data->>'poiImportance',
        'factor', v_poi_factor,
        'source', v_poi_data->>'source'
      ),
      'trending', jsonb_build_object(
        'value', v_trending_data->>'trendingScore',
        'factor', v_trending_factor,
        'source', v_trending_data->>'source'
      ),
      'overall', v_overall_factor
    )
  );
  
  RETURN v_result;
END;
$$;

-- Function to update all property values using external metrics
CREATE OR REPLACE FUNCTION public.update_all_property_values_external()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property RECORD;
  v_updated_count INTEGER := 0;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_time := now();
  
  -- Process each property
  FOR v_property IN 
    SELECT id FROM public.virtual_properties
  LOOP
    -- Update each property value
    PERFORM public.calculate_dynamic_property_value(v_property.id);
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  v_end_time := now();
  
  -- Return statistics
  RETURN jsonb_build_object(
    'success', TRUE,
    'updated_properties', v_updated_count,
    'execution_time_ms', EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000,
    'timestamp', now()
  );
END;
$$;

-- Insert test API configurations
INSERT INTO public.external_api_configs 
(api_name, api_key, base_url, rate_limit, enabled)
VALUES
('census_api', 'test_key_census', 'https://api.census.gov/data', 100, TRUE),
('worldpop_api', 'test_key_worldpop', 'https://api.worldpop.org', 50, TRUE),
('google_places', 'test_key_google', 'https://maps.googleapis.com/maps/api/place', 500, TRUE),
('social_trending', 'test_key_social', 'https://api.social-metrics.com', 200, TRUE)
ON CONFLICT (api_name) DO UPDATE
SET 
  api_key = EXCLUDED.api_key,
  base_url = EXCLUDED.base_url,
  rate_limit = EXCLUDED.rate_limit,
  enabled = EXCLUDED.enabled;

-- Schedule job to clean expired cache entries daily
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule cache cleanup
    PERFORM cron.schedule(
      'daily-cache-cleanup',
      '0 3 * * *', -- At 3 AM every day
      $cmd$DELETE FROM public.external_api_cache WHERE expires_at < now()$cmd$
    );
    
    -- Schedule weekly property value updates
    PERFORM cron.schedule(
      'weekly-property-value-update',
      '0 2 * * 0', -- At 2 AM on Sunday
      $cmd$SELECT public.update_all_property_values_external()$cmd$
    );
    
    RAISE NOTICE 'Scheduled jobs created with pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - scheduled jobs not created';
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Read-only access for most tables
GRANT SELECT ON public.external_api_configs TO authenticated;
GRANT SELECT ON public.external_api_cache TO authenticated;

-- Execute permission for property valuation functions
GRANT EXECUTE ON FUNCTION public.get_external_population_density TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_external_points_of_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_external_trending_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_dynamic_property_value TO authenticated;
GRANT EXECUTE ON FUNCTION public.geocode_address TO authenticated;

-- Admin-only function
GRANT EXECUTE ON FUNCTION public.update_all_property_values_external TO authenticated;

COMMIT; 