-- Fix for the extract_valuation_factors function's property_id ambiguity

BEGIN;

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.extract_valuation_factors(UUID, JSONB);

-- Fix function to extract and save specific valuation factors
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
  -- Delete existing factors for this property
  DELETE FROM public.property_valuation_factors
  WHERE property_id = property_id_param;
  
  -- Process each source
  FOR v_source IN SELECT jsonb_array_elements(valuation_data->'sources')
  LOOP
    -- Process location factors
    v_factors := v_source->'factors'->'location_value';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'location', 'neighborhood_quality', 
     (v_factors->>'neighborhood_quality')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'location', 'location_desirability', 
     (v_factors->>'location_desirability')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process property metrics
    v_factors := v_source->'factors'->'property_metrics';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'property', 'condition', 
     (v_factors->>'condition')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'property', 'lot_size', 
     (v_factors->>'lot_size')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process market conditions
    v_factors := v_source->'factors'->'market_conditions';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'market', 'price_per_sqft', 
     (v_factors->>'price_per_sqft')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'market', 'market_trend', 
     (v_factors->>'market_trend')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider');
     
    v_count := v_count + 2;
    
    -- Process area attributes
    v_factors := v_source->'factors'->'area_attributes';
    INSERT INTO public.property_valuation_factors
    (property_id, factor_category, factor_name, factor_value, raw_data, confidence, source)
    VALUES
    (property_id_param, 'area', 'school_rating', 
     (v_factors->>'school_rating')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'area', 'crime_index', 
     (v_factors->>'crime_index')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'area', 'walkability_score', 
     (v_factors->>'walkability_score')::NUMERIC,
     v_factors, (v_source->>'confidence')::NUMERIC, v_source->>'provider'),
    (property_id_param, 'area', 'transit_score', 
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

-- Drop and recreate the calculate_property_value_comprehensive function to use the fixed extract_valuation_factors
DROP FUNCTION IF EXISTS public.calculate_property_value_comprehensive(UUID);

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

COMMIT; 