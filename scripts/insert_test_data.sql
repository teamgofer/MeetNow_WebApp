-- Insert test data for population density feature

-- Add more sample population data
INSERT INTO public.external_population_data (city, neighborhood, population_density, data_source)
VALUES
  ('Seattle', 'Downtown', 12000.00, 'Census 2020'),
  ('Seattle', 'Capitol Hill', 8500.00, 'Census 2020'),
  ('Boston', 'Downtown', 13500.00, 'Census 2020'),
  ('Miami', 'South Beach', 11000.00, 'Census 2020'),
  ('Austin', 'Downtown', 5000.00, 'Census 2020')
ON CONFLICT (city, neighborhood) DO UPDATE SET
  population_density = EXCLUDED.population_density,
  last_updated = now(),
  data_source = EXCLUDED.data_source;

-- Insert test properties in various cities
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
  DELETE FROM public.virtual_properties WHERE name LIKE 'Test Property %';
  
  -- Insert test properties
  INSERT INTO public.virtual_properties 
  (name, property_type, city, center_point, geometry, base_value, current_value, owner_id, status)
  VALUES
  -- Manhattan property (high density)
  ('Test Property Manhattan', 'micro_location',
   'New York', 
   ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)::geography,
   ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)::geography,
   1000, 1000, v_owner_id, 'active'),
  
  -- Los Angeles property (medium density)
  ('Test Property LA', 'micro_location',
   'Los Angeles', 
   ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
   ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
   1000, 1000, v_owner_id, 'active'),
  
  -- Seattle property (medium-high density)
  ('Test Property Seattle', 'micro_location',
   'Seattle', 
   ST_SetSRID(ST_MakePoint(-122.3321, 47.6062), 4326)::geography,
   ST_SetSRID(ST_MakePoint(-122.3321, 47.6062), 4326)::geography,
   1000, 1000, v_owner_id, 'active'),
   
  -- Rural property (low density - not in our sample data)
  ('Test Property Rural', 'micro_location',
   'Small Town', 
   ST_SetSRID(ST_MakePoint(-95.7129, 37.0902), 4326)::geography,
   ST_SetSRID(ST_MakePoint(-95.7129, 37.0902), 4326)::geography,
   1000, 1000, v_owner_id, 'active');
END $$;

-- Calculate population density factors and update property values
SELECT public.update_property_values_external_metrics();

-- Query the results
SELECT 
  p.name, 
  p.city, 
  p.base_value, 
  p.current_value,
  f.factor_value AS density_factor,
  f.population_density_factor,
  (p.current_value::NUMERIC / p.base_value) AS value_multiplier
FROM 
  public.virtual_properties p
JOIN 
  public.property_value_factors f ON p.id = f.property_id AND f.factor_type = 'population_density'
WHERE 
  p.name LIKE 'Test Property %'
ORDER BY 
  p.current_value DESC; 