-- Property System External Metrics Integration
-- Phase 1: Population Density Data

-- Begin transaction
BEGIN;

-- Create table for external population data
CREATE TABLE IF NOT EXISTS public.external_population_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  neighborhood TEXT,
  population_density NUMERIC(10,2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_source TEXT,
  UNIQUE(city, neighborhood)
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_external_population_data_city ON public.external_population_data(city);
CREATE INDEX IF NOT EXISTS idx_external_population_data_neighborhood ON public.external_population_data(city, neighborhood);

-- Add city average density view for easier calculations
CREATE OR REPLACE VIEW public.city_average_density AS
SELECT 
  city,
  AVG(population_density) AS avg_density,
  MIN(population_density) AS min_density,
  MAX(population_density) AS max_density,
  COUNT(*) AS neighborhood_count
FROM public.external_population_data
GROUP BY city;

-- Add column to property_value_factors for tracking population density impact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'property_value_factors' 
    AND column_name = 'population_density_factor'
  ) THEN
    ALTER TABLE public.property_value_factors 
    ADD COLUMN population_density_factor NUMERIC(4,2);
  END IF;
END $$;

-- Function to calculate property value based on population density
CREATE OR REPLACE FUNCTION public.calculate_population_density_factor(
  p_property_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_city TEXT;
  v_neighborhood TEXT;
  v_center_point GEOGRAPHY;
  v_property_geometry GEOGRAPHY;
  v_density NUMERIC(10,2);
  v_avg_density NUMERIC(10,2);
  v_factor NUMERIC(4,2);
BEGIN
  -- Get property location info
  SELECT 
    city,
    center_point,
    geometry
  INTO
    v_city,
    v_center_point,
    v_property_geometry
  FROM public.virtual_properties
  WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN 1.0; -- Default factor if property not found
  END IF;
  
  -- Try to determine neighborhood (simplified - would be more complex in production)
  -- In a real implementation, this would use ST_Contains to find containing neighborhoods
  SELECT neighborhood INTO v_neighborhood
  FROM public.external_population_data
  WHERE city = v_city
  ORDER BY ST_Distance(
    ST_SetSRID(ST_Point(ST_X(v_center_point::geometry), ST_Y(v_center_point::geometry)), 4326)::geography,
    ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography
  ) ASC
  LIMIT 1;
  
  -- Get population density for this area
  IF v_neighborhood IS NOT NULL THEN
    -- Look up neighborhood-specific density
    SELECT population_density INTO v_density
    FROM public.external_population_data
    WHERE city = v_city AND neighborhood = v_neighborhood;
  END IF;
  
  -- Fall back to city average if neighborhood not found
  IF v_density IS NULL THEN
    SELECT avg_density INTO v_avg_density
    FROM public.city_average_density
    WHERE city = v_city;
    
    v_density := COALESCE(v_avg_density, 1000); -- Default if no data exists
  END IF;
  
  -- Calculate density factor (0.8 to 2.0 range)
  SELECT AVG(population_density) INTO v_avg_density
  FROM public.external_population_data
  WHERE city = v_city;
  
  v_avg_density := COALESCE(v_avg_density, v_density); -- If no average, use the property's density
  
  -- Calculate factor: min 0.8, max 2.0, centered around 1.0 for average density
  v_factor := LEAST(2.0, GREATEST(0.8, (v_density / NULLIF(v_avg_density, 0)) * 0.5 + 0.8));
  
  -- Update the property_value_factors table with this factor
  UPDATE public.property_value_factors
  SET 
    population_density_factor = v_factor,
    factor_value = v_factor, -- This assumes we're updating the main factor value
    effective_from = now()
  WHERE 
    property_id = p_property_id 
    AND factor_type = 'population_density';
  
  -- If no row exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.property_value_factors (
      property_id,
      factor_type,
      factor_value,
      population_density_factor,
      effective_from
    ) VALUES (
      p_property_id,
      'population_density',
      v_factor,
      v_factor,
      now()
    );
  END IF;
  
  RETURN v_factor;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error calculating population density factor: %', SQLERRM;
  RETURN 1.0; -- Default multiplier in case of errors
END;
$$;

-- Function to update property valuations based on external metrics
CREATE OR REPLACE FUNCTION public.update_property_values_external_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property RECORD;
  v_pop_density_factor NUMERIC(4,2);
  v_updated_count INTEGER := 0;
BEGIN
  -- Process each property
  FOR v_property IN 
    SELECT id, current_value, base_value
    FROM public.virtual_properties
  LOOP
    -- Calculate population density factor
    v_pop_density_factor := public.calculate_population_density_factor(v_property.id);
    
    -- Update property value with the new factor
    -- Here we only apply population density - in future we would combine with other factors
    UPDATE public.virtual_properties
    SET current_value = GREATEST(base_value * v_pop_density_factor, base_value * 0.8)::INTEGER
    WHERE id = v_property.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$;

-- Sample data for testing (remove in production)
INSERT INTO public.external_population_data (city, neighborhood, population_density, data_source)
VALUES
  ('New York', 'Manhattan', 27000.00, 'Census 2020'),
  ('New York', 'Brooklyn', 14000.00, 'Census 2020'),
  ('New York', 'Queens', 8000.00, 'Census 2020'),
  ('Los Angeles', 'Downtown', 8000.00, 'Census 2020'),
  ('Los Angeles', 'Hollywood', 5000.00, 'Census 2020'),
  ('Chicago', 'The Loop', 7000.00, 'Census 2020'),
  ('San Francisco', 'Financial District', 10000.00, 'Census 2020'),
  ('San Francisco', 'Mission District', 7000.00, 'Census 2020')
ON CONFLICT (city, neighborhood) DO UPDATE SET
  population_density = EXCLUDED.population_density,
  last_updated = now(),
  data_source = EXCLUDED.data_source;

-- Set up scheduled job for periodic property value recalculation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule weekly property value updates
    PERFORM cron.schedule(
      'weekly-property-value-update',
      '0 0 * * 0', -- At midnight on Sunday
      $cmd$SELECT public.update_property_values_external_metrics()$cmd$
    );
    RAISE NOTICE 'Weekly property value update task scheduled using pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - automated property value updates not scheduled';
  END IF;
END $$;

-- Admin API function to manually trigger update
CREATE OR REPLACE FUNCTION public.admin_update_property_values()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- Ensure user is admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id AND is_admin = true) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Admin privileges required'
    );
  END IF;
  
  -- Run the update
  v_updated_count := public.update_property_values_external_metrics();
  
  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'updated_properties', v_updated_count,
    'timestamp', now()
  );
END;
$$;

-- Grant usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to tables
GRANT SELECT ON public.external_population_data TO anon, authenticated;
GRANT SELECT ON public.city_average_density TO anon, authenticated;
GRANT SELECT ON public.property_value_factors TO anon, authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.calculate_population_density_factor TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_property_values TO authenticated;

COMMIT; 