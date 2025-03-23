-- Test script for population density feature
-- This script checks the implementation and demonstrates how property values are affected

-- Reset test properties (if any exist from previous tests)
DELETE FROM public.virtual_properties WHERE name LIKE 'Test Property %';

-- Create test properties in different cities
INSERT INTO public.virtual_properties 
(name, property_type, city, center_point, geometry, base_value, current_value, owner_id, status)
VALUES
-- Manhattan property (high density)
('Test Property Manhattan', 'micro_location',
 'New York', 
 ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)::geography,
 ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)::geography,
 1000, 1000, auth.uid(), 'active'),

-- Los Angeles property (medium density)
('Test Property LA', 'micro_location',
 'Los Angeles', 
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography,
 1000, 1000, auth.uid(), 'active'),

-- Rural property (low density - not in our sample data)
('Test Property Rural', 'micro_location',
 'Small Town', 
 ST_SetSRID(ST_MakePoint(-95.7129, 37.0902), 4326)::geography,
 ST_SetSRID(ST_MakePoint(-95.7129, 37.0902), 4326)::geography,
 1000, 1000, auth.uid(), 'active');

-- Show initial state of properties
SELECT name, city, base_value, current_value
FROM public.virtual_properties
WHERE name LIKE 'Test Property %';

-- Calculate population density factor for each test property
SELECT 
  p.name,
  p.city,
  public.calculate_population_density_factor(p.id) as density_factor
FROM 
  public.virtual_properties p
WHERE 
  name LIKE 'Test Property %';

-- Run the property values update function
SELECT public.update_property_values_external_metrics();

-- Check the property value factors table
SELECT 
  p.name,
  p.city,
  f.factor_type,
  f.factor_value,
  f.population_density_factor
FROM 
  public.virtual_properties p
JOIN 
  public.property_value_factors f ON p.id = f.property_id
WHERE 
  p.name LIKE 'Test Property %'
ORDER BY 
  p.name;

-- Show final state of properties - values should be adjusted
SELECT 
  name, 
  city, 
  base_value, 
  current_value,
  (current_value::NUMERIC / NULLIF(base_value, 0))::NUMERIC(4,2) as value_multiplier
FROM 
  public.virtual_properties
WHERE 
  name LIKE 'Test Property %'
ORDER BY 
  current_value DESC;

-- Show city average density data
SELECT * FROM public.city_average_density ORDER BY avg_density DESC; 