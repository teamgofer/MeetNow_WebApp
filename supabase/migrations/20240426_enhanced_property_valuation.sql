-- Enhanced Property Valuation System
-- Adds comprehensive valuation factors and external API integration points

BEGIN;

-- Add more detailed property attributes
ALTER TABLE public.virtual_properties
ADD COLUMN IF NOT EXISTS property_attributes JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS last_valuation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS valuation_history JSONB[] DEFAULT '{}'::JSONB[];

-- Create table for detailed valuation factors
CREATE TABLE IF NOT EXISTS public.property_valuation_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.virtual_properties(id) ON DELETE CASCADE,
  factor_category TEXT NOT NULL,
  factor_name TEXT NOT NULL,
  factor_value NUMERIC NOT NULL,
  raw_data JSONB,
  confidence NUMERIC,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id, factor_category, factor_name)
);

-- API connection profiles for real estate data providers
CREATE TABLE IF NOT EXISTS public.real_estate_api_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  api_key TEXT,
  api_secret TEXT,
  base_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  capabilities JSONB NOT NULL DEFAULT '[]'::JSONB,
  config JSONB DEFAULT '{}'::JSONB,
  priority INTEGER DEFAULT 10,
  request_quota INTEGER,
  quota_reset_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_valuation_factors_property ON public.property_valuation_factors(property_id);
CREATE INDEX IF NOT EXISTS idx_property_valuation_factors_category ON public.property_valuation_factors(factor_category);
CREATE INDEX IF NOT EXISTS idx_real_estate_api_profiles_enabled ON public.real_estate_api_profiles(enabled);

-- Insert example API providers (in production these would be replaced with real providers)
INSERT INTO public.real_estate_api_profiles
(provider_name, base_url, capabilities, config, priority)
VALUES
('zillow_api', 'https://api.zillow.com/v1', 
 '["property_valuation", "comparable_sales", "market_trends"]'::JSONB,
 '{"region_supported": "us", "request_format": "json"}'::JSONB,
 1),
('redfin_api', 'https://api.redfin.com/v1',
 '["property_valuation", "neighborhood_insights"]'::JSONB,
 '{"region_supported": "us", "request_format": "json"}'::JSONB,
 2),
('realtor_api', 'https://api.realtor.com/v1',
 '["property_valuation", "crime_data", "school_data"]'::JSONB,
 '{"region_supported": "us", "request_format": "json"}'::JSONB,
 3),
('openai_api', 'https://api.openai.com/v1',
 '["market_analysis", "trend_prediction"]'::JSONB,
 '{"model": "gpt-4", "token_limit": 8000}'::JSONB,
 10)
ON CONFLICT (provider_name) DO UPDATE
SET 
  base_url = EXCLUDED.base_url,
  capabilities = EXCLUDED.capabilities,
  config = EXCLUDED.config,
  priority = EXCLUDED.priority;

-- Function to get property valuation from multiple external sources
CREATE OR REPLACE FUNCTION public.get_comprehensive_property_valuation(
  lat FLOAT,
  lng FLOAT,
  property_attributes JSONB DEFAULT NULL,
  preferred_providers TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cache_key TEXT;
  v_cached_data JSONB;
  v_provider RECORD;
  v_result JSONB := '{}'::JSONB;
  v_valuation_sources JSONB := '[]'::JSONB;
  v_final_valuation NUMERIC := 0;
  v_confidence NUMERIC := 0;
  v_provider_count INTEGER := 0;
  v_avg_multiplier NUMERIC := 1.0;
BEGIN
  -- Generate cache key based on location and attributes
  v_cache_key := 'property_valuation:' || lat::TEXT || ',' || lng::TEXT;
  IF property_attributes IS NOT NULL THEN
    v_cache_key := v_cache_key || ':' || MD5(property_attributes::TEXT);
  END IF;
  
  -- Check cache first if available
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) THEN
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
        VALUES ('property_valuation', 'comprehensive', TRUE);
      END IF;
      
      RETURN v_cached_data;
    END IF;
  END IF;
  
  -- In production, this would call multiple real estate APIs
  -- For now, we'll generate comprehensive mock data
  
  -- Get data from each enabled provider
  FOR v_provider IN
    SELECT * FROM public.real_estate_api_profiles
    WHERE enabled = TRUE
    AND (preferred_providers IS NULL OR provider_name = ANY(preferred_providers))
    ORDER BY priority
  LOOP
    v_provider_count := v_provider_count + 1;
    
    -- This would be a real API call in production
    -- Here we're simulating different valuations from different providers
    
    -- Base valuation varies by provider and location
    DECLARE
      v_provider_valuation NUMERIC;
      v_provider_confidence NUMERIC;
      v_provider_factors JSONB;
    BEGIN
      -- Generate provider-specific valuation with realistic variation
      
      -- Base values for different locations (more granular and realistic)
      IF (lat BETWEEN 40.7 AND 40.9) AND (lng BETWEEN -74.1 AND -73.9) THEN
        -- Manhattan (very expensive)
        v_provider_valuation := 1000000 + (random() * 1000000);
      ELSIF (lat BETWEEN 40.6 AND 40.8) AND (lng BETWEEN -74.0 AND -73.8) THEN  
        -- Brooklyn (expensive)
        v_provider_valuation := 800000 + (random() * 700000);
      ELSIF (lat BETWEEN 33.9 AND 34.2) AND (lng BETWEEN -118.5 AND -118.2) THEN
        -- Los Angeles (expensive)
        v_provider_valuation := 900000 + (random() * 800000);
      ELSIF (lat BETWEEN 41.8 AND 42.0) AND (lng BETWEEN -87.8 AND -87.6) THEN
        -- Chicago (moderate)
        v_provider_valuation := 500000 + (random() * 400000);
      ELSIF (lat BETWEEN 39.7 AND 39.8) AND (lng BETWEEN -105.1 AND -104.9) THEN
        -- Denver (moderate)
        v_provider_valuation := 600000 + (random() * 300000);
      ELSIF (lat BETWEEN 47.5 AND 47.7) AND (lng BETWEEN -122.4 AND -122.2) THEN
        -- Seattle (expensive)
        v_provider_valuation := 800000 + (random() * 600000);
      ELSIF (lat BETWEEN 37.7 AND 37.9) AND (lng BETWEEN -122.5 AND -122.3) THEN
        -- San Francisco (very expensive)
        v_provider_valuation := 1200000 + (random() * 1000000);
      ELSIF (lat BETWEEN 45.0 AND 48.0) AND (lng BETWEEN -112.0 AND -108.0) THEN
        -- Rural Montana (inexpensive)
        v_provider_valuation := 150000 + (random() * 100000);
      ELSE
        -- Default moderate area
        v_provider_valuation := 350000 + (random() * 200000);
      END IF;
      
      -- Add provider-specific variance (some estimate higher, some lower)
      CASE v_provider.provider_name
        WHEN 'zillow_api' THEN
          v_provider_valuation := v_provider_valuation * (0.95 + (random() * 0.1));
          v_provider_confidence := 0.85 + (random() * 0.1);
        WHEN 'redfin_api' THEN
          v_provider_valuation := v_provider_valuation * (0.97 + (random() * 0.1));
          v_provider_confidence := 0.8 + (random() * 0.15);
        WHEN 'realtor_api' THEN
          v_provider_valuation := v_provider_valuation * (0.93 + (random() * 0.12));
          v_provider_confidence := 0.75 + (random() * 0.2);
        WHEN 'openai_api' THEN
          v_provider_valuation := v_provider_valuation * (0.9 + (random() * 0.2));
          v_provider_confidence := 0.7 + (random() * 0.15);
        ELSE
          v_provider_valuation := v_provider_valuation * (0.95 + (random() * 0.1));
          v_provider_confidence := 0.8;
      END CASE;
      
      -- Generate detailed factors that influenced this valuation
      v_provider_factors := jsonb_build_object(
        'location_value', jsonb_build_object(
          'latitude', lat,
          'longitude', lng,
          'neighborhood_quality', 0.6 + (random() * 0.4),
          'location_desirability', 0.5 + (random() * 0.5)
        ),
        'property_metrics', jsonb_build_object(
          'condition', 0.3 + (random() * 0.7),
          'lot_size', 0.1 + (random() * 0.9),
          'year_built', 1960 + (random() * 60)::INTEGER,
          'square_footage', 1000 + (random() * 3000)::INTEGER
        ),
        'market_conditions', jsonb_build_object(
          'comparable_sales_avg', v_provider_valuation * (0.9 + (random() * 0.2)),
          'days_on_market_avg', 20 + (random() * 60)::INTEGER,
          'price_per_sqft', (v_provider_valuation / (1000 + (random() * 3000)))::INTEGER,
          'market_trend', 0.02 * (random() - 0.5)  -- -0.01 to +0.01 price change trend
        ),
        'area_attributes', jsonb_build_object(
          'school_rating', 1 + (random() * 9)::INTEGER,
          'crime_index', random() * 100,
          'walkability_score', 30 + (random() * 70)::INTEGER,
          'transit_score', 20 + (random() * 80)::INTEGER
        )
      );
      
      -- Add to the valuation sources array
      v_valuation_sources := v_valuation_sources || jsonb_build_object(
        'provider', v_provider.provider_name,
        'valuation', v_provider_valuation,
        'confidence', v_provider_confidence,
        'factors', v_provider_factors
      );
      
      -- Weight the valuations by confidence for final calculation
      v_final_valuation := v_final_valuation + (v_provider_valuation * v_provider_confidence);
      v_confidence := v_confidence + v_provider_confidence;
    END;
  END LOOP;
  
  -- Calculate weighted average if we have providers
  IF v_provider_count > 0 THEN
    v_final_valuation := v_final_valuation / v_confidence;
    v_confidence := v_confidence / v_provider_count;
    
    -- Calculate the property value multiplier relative to base value of 1000
    v_avg_multiplier := v_final_valuation / 300000;  -- Standardization base
  END IF;
  
  -- Build final result
  v_result := jsonb_build_object(
    'property_valuation', round(v_final_valuation::numeric, 2),
    'value_multiplier', round(v_avg_multiplier::numeric, 2),
    'confidence', round(v_confidence::numeric, 2),
    'source_count', v_provider_count,
    'sources', v_valuation_sources,
    'timestamp', now()
  );
  
  -- Cache result if cache is available
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'external_api_cache'
  ) THEN
    INSERT INTO public.external_api_cache
    (cache_key, data, source, expires_at)
    VALUES
    (v_cache_key, v_result, 'comprehensive_valuation', now() + INTERVAL '1 day');
  
    -- Log API usage
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'external_api_usage_logs'
    ) THEN
      INSERT INTO public.external_api_usage_logs
      (api_name, endpoint, request_params, cached)
      VALUES (
        'property_valuation', 
        'comprehensive', 
        jsonb_build_object('lat', lat, 'lng', lng),
        FALSE
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Function to extract and save specific valuation factors
CREATE OR REPLACE FUNCTION public.extract_valuation_factors(
  property_id UUID,
  valuation_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source JSONB;
  v_factors JSONB;
  v_factor_category TEXT;
  v_factor_name TEXT;
  v_factor_value NUMERIC;
  v_count INTEGER := 0;
BEGIN
  -- Delete existing factors for this property
  DELETE FROM public.property_valuation_factors
  WHERE property_id = extract_valuation_factors.property_id;
  
  -- Process each source
  FOR v_source IN SELECT jsonb_array_elements(valuation_data->'sources')
  LOOP
    -- Process location factors
    v_factors := v_source->'factors'->'location_value';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (extract_valuation_factors.property_id, 'location', 'neighborhood_quality', 
     (v_factors->>'neighborhood_quality')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'location', 'location_desirability', 
     (v_factors->>'location_desirability')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process property metrics
    v_factors := v_source->'factors'->'property_metrics';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (extract_valuation_factors.property_id, 'property', 'condition', 
     (v_factors->>'condition')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'property', 'lot_size', 
     (v_factors->>'lot_size')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process market conditions
    v_factors := v_source->'factors'->'market_conditions';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (extract_valuation_factors.property_id, 'market', 'price_per_sqft', 
     (v_factors->>'price_per_sqft')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'market', 'market_trend', 
     (v_factors->>'market_trend')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process area attributes
    v_factors := v_source->'factors'->'area_attributes';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (extract_valuation_factors.property_id, 'area', 'school_rating', 
     (v_factors->>'school_rating')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'area', 'crime_index', 
     (v_factors->>'crime_index')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'area', 'walkability_score', 
     (v_factors->>'walkability_score')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (extract_valuation_factors.property_id, 'area', 'transit_score', 
     (v_factors->>'transit_score')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 4;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'factors_saved', v_count,
    'timestamp', now()
  );
END;
$$;

-- Enhanced property valuation function that uses comprehensive real estate data
CREATE OR REPLACE FUNCTION public.calculate_property_value_comprehensive(
  property_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property RECORD;
  v_valuation_data JSONB;
  v_value_multiplier NUMERIC;
  v_current_value INTEGER;
  v_base_value INTEGER;
  v_result JSONB;
  v_history_entry JSONB;
BEGIN
  -- Get property details
  SELECT 
    id, 
    base_value,
    property_attributes,
    ST_Y(center_point::geometry) AS lat,
    ST_X(center_point::geometry) AS lng,
    valuation_history
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
  
  -- Get comprehensive valuation from multiple sources
  v_valuation_data := public.get_comprehensive_property_valuation(
    v_property.lat,
    v_property.lng,
    v_property.property_attributes
  );
  
  -- Extract the multiplier from comprehensive valuation
  v_value_multiplier := (v_valuation_data->>'value_multiplier')::NUMERIC;
  
  -- Adjust if extremely high or low (reality check)
  IF v_value_multiplier > 10 THEN
    v_value_multiplier := 10;
  ELSIF v_value_multiplier < 0.1 THEN
    v_value_multiplier := 0.1;
  END IF;
  
  -- Calculate final value 
  v_current_value := (v_base_value * v_value_multiplier)::INTEGER;
  
  -- Update property value
  UPDATE public.virtual_properties
  SET 
    current_value = v_current_value,
    last_valuation_date = now()
  WHERE id = property_id;
  
  -- Create history entry
  v_history_entry := jsonb_build_object(
    'valuation_date', now(),
    'value', v_current_value,
    'multiplier', v_value_multiplier,
    'sources_count', v_valuation_data->'source_count'
  );
  
  -- Add to history array
  UPDATE public.virtual_properties
  SET valuation_history = array_append(valuation_history, v_history_entry)
  WHERE id = property_id;
  
  -- Extract and save detailed factors
  PERFORM public.extract_valuation_factors(property_id, v_valuation_data);
  
  -- Return results
  v_result := jsonb_build_object(
    'success', TRUE,
    'property_id', property_id,
    'base_value', v_base_value,
    'current_value', v_current_value,
    'value_multiplier', v_value_multiplier,
    'valuation_details', v_valuation_data
  );
  
  RETURN v_result;
END;
$$;

-- Update all properties function
CREATE OR REPLACE FUNCTION public.update_all_property_values_comprehensive()
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
    PERFORM public.calculate_property_value_comprehensive(v_property.id);
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

-- Enhanced test properties function
CREATE OR REPLACE FUNCTION public.test_comprehensive_property_values()
RETURNS TABLE (
  property_name TEXT,
  city TEXT,
  base_value NUMERIC,
  current_value NUMERIC,
  value_multiplier NUMERIC,
  neighborhood_quality NUMERIC,
  school_rating NUMERIC,
  walkability_score NUMERIC,
  market_trend NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean and create test properties from different cities
  PERFORM public.reset_test_properties();
  
  -- Update all property values using the comprehensive method
  PERFORM public.update_all_property_values_comprehensive();
  
  -- Return results in a nicely formatted table
  RETURN QUERY
  SELECT 
    p.name AS property_name,
    p.city,
    p.base_value::NUMERIC,
    p.current_value::NUMERIC,
    (p.current_value / p.base_value)::NUMERIC(10,2) AS value_multiplier,
    COALESCE((
      SELECT AVG(pf.factor_value)::NUMERIC(10,2)
      FROM public.property_valuation_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_category = 'location' AND pf.factor_name = 'neighborhood_quality'
    ), 0) AS neighborhood_quality,
    COALESCE((
      SELECT AVG(pf.factor_value)::NUMERIC(10,2)
      FROM public.property_valuation_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_category = 'area' AND pf.factor_name = 'school_rating'
    ), 0) AS school_rating,
    COALESCE((
      SELECT AVG(pf.factor_value)::NUMERIC(10,2)
      FROM public.property_valuation_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_category = 'area' AND pf.factor_name = 'walkability_score'
    ), 0) AS walkability_score,
    COALESCE((
      SELECT AVG(pf.factor_value)::NUMERIC(10,2)
      FROM public.property_valuation_factors pf 
      WHERE pf.property_id = p.id AND pf.factor_category = 'market' AND pf.factor_name = 'market_trend'
    ), 0) AS market_trend
  FROM 
    public.virtual_properties p
  WHERE 
    p.name LIKE 'Test Dynamic %'
  ORDER BY 
    p.current_value DESC;
END;
$$;

-- Make functions available to authenticated users
GRANT EXECUTE ON FUNCTION public.get_comprehensive_property_valuation TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_property_value_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_all_property_values_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_comprehensive_property_values TO authenticated;

-- RLS policies for the new tables
ALTER TABLE public.property_valuation_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_api_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view property valuation factors
CREATE POLICY view_property_valuation_factors ON public.property_valuation_factors
FOR SELECT TO authenticated USING (TRUE);

-- Only admins can modify property valuation factors (simplified for testing)
CREATE POLICY modify_property_valuation_factors ON public.property_valuation_factors
FOR ALL TO authenticated USING (TRUE);

-- Only admins can view or modify API profiles (simplified for testing)
CREATE POLICY view_real_estate_api_profiles ON public.real_estate_api_profiles
FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY modify_real_estate_api_profiles ON public.real_estate_api_profiles
FOR ALL TO authenticated USING (TRUE);

COMMIT; 