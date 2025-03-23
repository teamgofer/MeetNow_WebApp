-- Fix the duplicate key issue in extract_valuation_factors function

BEGIN;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.extract_valuation_factors(UUID, JSONB);

-- Create a fixed version with ON CONFLICT clause
CREATE OR REPLACE FUNCTION public.extract_valuation_factors(
  property_id_param UUID,
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
  -- Process each source
  FOR v_source IN SELECT jsonb_array_elements(valuation_data->'sources')
  LOOP
    -- Process location factors
    v_factors := v_source->'factors'->'location_value';
    
    -- Insert neighborhood quality with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'location', 'neighborhood_quality', 
     (v_factors->>'neighborhood_quality')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert location desirability with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'location', 'location_desirability', 
     (v_factors->>'location_desirability')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
     
    v_count := v_count + 1;
    
    -- Process property metrics
    v_factors := v_source->'factors'->'property_metrics';
    
    -- Insert condition with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'property', 'condition', 
     (v_factors->>'condition')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert lot size with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'property', 'lot_size', 
     (v_factors->>'lot_size')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
     
    v_count := v_count + 1;
    
    -- Process market conditions
    v_factors := v_source->'factors'->'market_conditions';
    
    -- Insert price_per_sqft with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'market', 'price_per_sqft', 
     (v_factors->>'price_per_sqft')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert market trend with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'market', 'market_trend', 
     (v_factors->>'market_trend')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
     
    v_count := v_count + 1;
    
    -- Process area attributes
    v_factors := v_source->'factors'->'area_attributes';
    
    -- Insert school rating with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'area', 'school_rating', 
     (v_factors->>'school_rating')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert crime index with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'area', 'crime_index', 
     (v_factors->>'crime_index')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert walkability score with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'area', 'walkability_score', 
     (v_factors->>'walkability_score')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
      
    v_count := v_count + 1;
    
    -- Insert transit score with conflict handling
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'area', 'transit_score', 
     (v_factors->>'transit_score')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider')
    ON CONFLICT (property_id, factor_category, factor_name) 
    DO UPDATE SET 
      factor_value = EXCLUDED.factor_value,
      raw_data = EXCLUDED.raw_data,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source;
     
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'factors_saved', v_count,
    'timestamp', now()
  );
END;
$$;

-- Make sure to grant execute privileges again
GRANT EXECUTE ON FUNCTION public.extract_valuation_factors TO authenticated;

COMMIT; 