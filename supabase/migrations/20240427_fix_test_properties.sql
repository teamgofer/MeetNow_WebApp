-- Fix for test properties function to handle newer valuation factors

BEGIN;

-- Update reset_test_properties function to handle property valuation factors
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

  -- Delete property valuation factors first to avoid FK constraints
  DELETE FROM public.property_valuation_factors
  WHERE property_id IN (
    SELECT id FROM public.virtual_properties 
    WHERE name LIKE 'Test Dynamic %'
  );
  
  -- Delete property value factors next
  DELETE FROM public.property_value_factors
  WHERE property_id IN (
    SELECT id FROM public.virtual_properties 
    WHERE name LIKE 'Test Dynamic %'
  );
  
  -- Then delete test properties
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
  
  -- San Francisco - very expensive area
  ('Test Dynamic SF', 'micro_location',
   'San Francisco', 
   ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-122.4194, 37.7749)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id),
   
  -- Rural Montana - low density area
  ('Test Dynamic Rural', 'micro_location',
   'Rural', 
   ST_SetSRID(ST_MakePoint(-110.3626, 46.8797), 4326)::geography,
   ST_SetSRID(ST_Buffer(ST_MakePoint(-110.3626, 46.8797)::geometry, 0.001), 4326)::geography,
   1000, 1000, v_owner_id);
   
  RETURN 'Created 6 test properties';
END;
$$;

-- Dummy call to test the function
DO $$ BEGIN
  PERFORM public.reset_test_properties();
END $$;

COMMIT; 