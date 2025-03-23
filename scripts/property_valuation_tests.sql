-- Property Valuation System Test Suite
-- A comprehensive set of tests to validate the property valuation system

------------------------------------------
-- TEST 1: Basic Property Valuation Test
------------------------------------------
DO $$
DECLARE
  v_result JSONB;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 1: Basic property valuation test - ';
  v_test_property_id UUID;
BEGIN
  -- Create a test property
  PERFORM public.reset_test_properties();
  
  -- Get the San Francisco property (should be highest value)
  SELECT id INTO v_test_property_id 
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic SF';
  
  -- Run valuation on the property
  v_result := public.calculate_property_value_comprehensive(v_test_property_id);
  
  -- Test assertions
  IF v_result->>'success' != 'true' THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - Valuation failed with error: ' || (v_result->>'error');
  ELSIF (v_result->>'value_multiplier')::NUMERIC < 1 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - San Francisco property should have multiplier > 1, got ' || (v_result->>'value_multiplier');
  ELSIF jsonb_array_length(v_result->'valuation_details'->'sources') = 0 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - No valuation sources returned';
  ELSE
    v_test_message := v_test_message || 'PASSED';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 2: Geographical Variance Test
------------------------------------------
DO $$
DECLARE
  v_nyc_value NUMERIC;
  v_rural_value NUMERIC;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 2: Geographical variance test - ';
BEGIN
  -- Run valuation on all test properties
  PERFORM public.update_all_property_values_comprehensive();
  
  -- Get the NYC property value (should be high)
  SELECT current_value INTO v_nyc_value
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic NYC';
  
  -- Get the rural property value (should be low)
  SELECT current_value INTO v_rural_value
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic Rural';
  
  -- Test assertions
  IF v_nyc_value IS NULL OR v_rural_value IS NULL THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - Could not retrieve property values';
  ELSIF v_nyc_value <= v_rural_value THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - NYC value (' || v_nyc_value || ') should be higher than rural value (' || v_rural_value || ')';
  ELSE
    v_test_message := v_test_message || 'PASSED - NYC value: ' || v_nyc_value || ', Rural value: ' || v_rural_value;
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 3: Property Valuation Factor Test
------------------------------------------
DO $$
DECLARE
  v_count INTEGER;
  v_test_property_id UUID;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 3: Property valuation factor test - ';
BEGIN
  -- Get one of the test properties
  SELECT id INTO v_test_property_id 
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic SF';
  
  -- Count the valuation factors
  SELECT COUNT(*) INTO v_count
  FROM public.property_valuation_factors
  WHERE property_id = v_test_property_id;
  
  -- Test assertions
  IF v_count = 0 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - No valuation factors found for test property';
  ELSE
    v_test_message := v_test_message || 'PASSED - Found ' || v_count || ' valuation factors';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 4: History Tracking Test
------------------------------------------
DO $$
DECLARE
  v_test_property_id UUID;
  v_history_entries JSONB[];
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 4: History tracking test - ';
BEGIN
  -- Get one of the test properties
  SELECT id INTO v_test_property_id 
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic LA';
  
  -- Run valuation on the property (should add a history entry)
  PERFORM public.calculate_property_value_comprehensive(v_test_property_id);
  
  -- Get the history
  SELECT valuation_history INTO v_history_entries
  FROM public.virtual_properties
  WHERE id = v_test_property_id;
  
  -- Test assertions
  IF v_history_entries IS NULL OR array_length(v_history_entries, 1) = 0 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - No valuation history entries found';
  ELSE
    v_test_message := v_test_message || 'PASSED - Found ' || array_length(v_history_entries, 1) || ' history entries';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 5: Multiple Provider Test
------------------------------------------
DO $$
DECLARE
  v_test_property_id UUID;
  v_result JSONB;
  v_provider_count INTEGER;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 5: Multiple provider test - ';
BEGIN
  -- Get one of the test properties
  SELECT id INTO v_test_property_id 
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic Denver';
  
  -- Run valuation on the property
  v_result := public.calculate_property_value_comprehensive(v_test_property_id);
  
  -- Count the providers used
  v_provider_count := (v_result->'valuation_details'->>'source_count')::INTEGER;
  
  -- Test assertions
  IF v_provider_count = 0 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - No valuation providers used';
  ELSIF v_provider_count < 3 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - At least 3 providers should be used, got ' || v_provider_count;
  ELSE
    v_test_message := v_test_message || 'PASSED - Used ' || v_provider_count || ' providers';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 6: Caching Test
------------------------------------------
DO $$
DECLARE
  v_test_property_id UUID;
  v_result1 JSONB;
  v_result2 JSONB;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 6: Caching test - ';
  v_lat FLOAT;
  v_lng FLOAT;
BEGIN
  -- Get one of the test properties
  SELECT id, ST_Y(center_point::geometry), ST_X(center_point::geometry) 
  INTO v_test_property_id, v_lat, v_lng
  FROM public.virtual_properties 
  WHERE name = 'Test Dynamic Chicago';
  
  -- First call (should create cache)
  v_result1 := public.get_comprehensive_property_valuation(v_lat, v_lng);
  
  -- Second call (should use cache)
  v_result2 := public.get_comprehensive_property_valuation(v_lat, v_lng);
  
  -- Test assertions - results should be identical from cache
  IF v_result1->>'property_valuation' != v_result2->>'property_valuation' THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - Cache not working, results differ';
  ELSE
    v_test_message := v_test_message || 'PASSED - Cache working correctly';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 7: API Profiles Test
------------------------------------------
DO $$
DECLARE
  v_count INTEGER;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 7: API profiles test - ';
BEGIN
  -- Count API profiles
  SELECT COUNT(*) INTO v_count
  FROM public.real_estate_api_profiles
  WHERE enabled = TRUE;
  
  -- Test assertions
  IF v_count = 0 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - No enabled API profiles found';
  ELSIF v_count < 3 THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - At least 3 API profiles should be enabled, got ' || v_count;
  ELSE
    v_test_message := v_test_message || 'PASSED - Found ' || v_count || ' enabled API profiles';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

------------------------------------------
-- TEST 8: Update All Properties Test
------------------------------------------
DO $$
DECLARE
  v_result JSONB;
  v_count INTEGER;
  v_test_passed BOOLEAN := TRUE;
  v_test_message TEXT := 'TEST 8: Update all properties test - ';
BEGIN
  -- Get count of properties 
  SELECT COUNT(*) INTO v_count
  FROM public.virtual_properties
  WHERE name LIKE 'Test Dynamic %';
  
  -- Update all properties
  v_result := public.update_all_property_values_comprehensive();
  
  -- Test assertions
  IF (v_result->>'updated_properties')::INTEGER != v_count THEN
    v_test_passed := FALSE;
    v_test_message := v_test_message || 'FAILED - Did not update all properties, expected ' || v_count || 
      ' but got ' || (v_result->>'updated_properties');
  ELSE
    v_test_message := v_test_message || 'PASSED - Updated all ' || v_count || ' properties';
  END IF;
  
  RAISE NOTICE '%', v_test_message;
END $$;

-- Final output of comprehensive test results
SELECT 
  'Test Dynamic ' || city AS property_name,
  city,
  base_value::NUMERIC,
  current_value::NUMERIC,
  (current_value / base_value)::NUMERIC(10,2) AS value_multiplier,
  property_attributes,
  last_valuation_date,
  array_length(valuation_history, 1) AS history_entries
FROM 
  public.virtual_properties
WHERE 
  name LIKE 'Test Dynamic %'
ORDER BY 
  current_value DESC; 