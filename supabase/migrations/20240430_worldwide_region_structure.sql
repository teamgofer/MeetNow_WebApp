-- Migration for worldwide region structure with California focus
-- This establishes a region-based feature availability system

BEGIN;

-- Create table for tracking supported regions and their features
CREATE TABLE IF NOT EXISTS public.supported_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  state_province TEXT,
  city_name TEXT,
  coordinates GEOGRAPHY(POINT),
  radius_km FLOAT,
  features JSONB DEFAULT '{}'::JSONB,
  rollout_phase INTEGER DEFAULT 1,
  launched_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_supported_regions_coordinates 
ON public.supported_regions USING GIST(coordinates);

CREATE INDEX IF NOT EXISTS idx_supported_regions_active_rollout 
ON public.supported_regions(active, rollout_phase);

-- Create table to track region rollout schedule
CREATE TABLE IF NOT EXISTS public.feature_rollout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  region_id UUID REFERENCES public.supported_regions(id),
  planned_date DATE,
  actual_date DATE,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for feature rollout lookups
CREATE INDEX IF NOT EXISTS idx_feature_rollout_feature_status
ON public.feature_rollout_schedule(feature_name, status);

-- Insert global default region (website available everywhere)
INSERT INTO public.supported_regions
(region_name, country_code, city_name, coordinates, radius_km, features, rollout_phase, active, launched_at)
VALUES
('Global Default', 'GLOBAL', NULL, NULL, NULL, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 0, TRUE, now());

-- Insert Phase 1 regions (California focus)
INSERT INTO public.supported_regions
(region_name, country_code, state_province, city_name, coordinates, radius_km, features, rollout_phase, active)
VALUES
('Los Angeles Metro', 'US', 'CA', 'Los Angeles', 
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography, 50, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": true,
   "property_marketplace": true,
   "virtual_touring": true,
   "property_analytics": true
 }'::JSONB, 
 1, TRUE),

('San Francisco Metro', 'US', 'CA', 'San Francisco', 
 ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 40, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": true,
   "property_marketplace": true,
   "virtual_touring": true,
   "property_analytics": true
 }'::JSONB, 
 1, TRUE),

('San Diego Metro', 'US', 'CA', 'San Diego', 
 ST_SetSRID(ST_MakePoint(-117.1611, 32.7157), 4326)::geography, 40, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": true,
   "property_marketplace": true,
   "virtual_touring": true,
   "property_analytics": true
 }'::JSONB, 
 1, TRUE),

('San Jose Metro', 'US', 'CA', 'San Jose', 
 ST_SetSRID(ST_MakePoint(-121.8863, 37.3382), 4326)::geography, 35, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": true,
   "property_marketplace": true,
   "virtual_touring": true,
   "property_analytics": true
 }'::JSONB, 
 1, TRUE);

-- Insert Phase 2 regions (planned for next rollout - major US cities)
INSERT INTO public.supported_regions
(region_name, country_code, state_province, city_name, coordinates, radius_km, features, rollout_phase, active)
VALUES
('New York Metro', 'US', 'NY', 'New York', 
 ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography, 50, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 2, TRUE),

('Chicago Metro', 'US', 'IL', 'Chicago', 
 ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography, 45, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 2, TRUE),

('Miami Metro', 'US', 'FL', 'Miami', 
 ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)::geography, 40, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 2, TRUE);

-- Insert Phase 3 regions (planned for international expansion)
INSERT INTO public.supported_regions
(region_name, country_code, city_name, coordinates, radius_km, features, rollout_phase, active)
VALUES
('London Metro', 'GB', 'London', 
 ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)::geography, 50, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 3, TRUE),

('Tokyo Metro', 'JP', 'Tokyo', 
 ST_SetSRID(ST_MakePoint(139.6503, 35.6762), 4326)::geography, 50, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 3, TRUE),

('Sydney Metro', 'AU', 'Sydney', 
 ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326)::geography, 45, 
 '{
   "core_features": true, 
   "messaging": true, 
   "events": true, 
   "profiles": true, 
   "search": true, 
   "real_estate": false
 }'::JSONB, 
 3, TRUE);

-- Schedule feature rollouts for phases 2 and 3
INSERT INTO public.feature_rollout_schedule
(feature_name, region_id, planned_date, status, notes)
SELECT 
  'real_estate',
  id,
  CASE 
    WHEN rollout_phase = 2 THEN (now() + interval '3 months')::date
    WHEN rollout_phase = 3 THEN (now() + interval '6 months')::date
  END,
  'scheduled',
  'Planned real estate feature rollout'
FROM
  public.supported_regions
WHERE
  rollout_phase IN (2, 3)
  AND active = TRUE;

-- Function to check feature availability at a location
CREATE OR REPLACE FUNCTION public.check_feature_availability(
  lat FLOAT,
  lng FLOAT,
  feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feature_available BOOLEAN := FALSE;
  v_point GEOGRAPHY;
BEGIN
  -- Create point from coordinates
  v_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  -- Check if feature is available in this location
  SELECT 
    (features->>feature_name)::BOOLEAN INTO v_feature_available
  FROM 
    public.supported_regions
  WHERE 
    active = TRUE AND
    features ? feature_name AND
    (
      coordinates IS NULL OR -- Global default
      ST_DWithin(coordinates, v_point, radius_km * 1000)
    )
  ORDER BY 
    coordinates IS NULL, -- Prioritize specific regions over global default
    ST_Distance(coordinates, v_point)
  LIMIT 1;
  
  RETURN COALESCE(v_feature_available, FALSE);
END;
$$;

-- Function to get all available features at a location
CREATE OR REPLACE FUNCTION public.get_available_features(
  lat FLOAT,
  lng FLOAT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_features JSONB;
  v_region_name TEXT;
  v_point GEOGRAPHY;
  v_result JSONB;
BEGIN
  -- Create point from coordinates
  v_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  -- Get region and features available at this location
  SELECT 
    features, region_name INTO v_features, v_region_name
  FROM 
    public.supported_regions
  WHERE 
    active = TRUE AND
    (
      coordinates IS NULL OR -- Global default
      ST_DWithin(coordinates, v_point, radius_km * 1000)
    )
  ORDER BY 
    coordinates IS NULL, -- Prioritize specific regions over global default
    ST_Distance(coordinates, v_point)
  LIMIT 1;
  
  -- Create result with region info
  v_result := COALESCE(v_features, '{}'::JSONB) || 
              jsonb_build_object('region_name', v_region_name);
              
  RETURN v_result;
END;
$$;

-- Function to list all enabled regions with real estate features
CREATE OR REPLACE FUNCTION public.list_real_estate_regions()
RETURNS TABLE (
  region_name TEXT,
  country_code TEXT,
  state_province TEXT,
  city_name TEXT,
  latitude FLOAT,
  longitude FLOAT,
  radius_km FLOAT,
  rollout_phase INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.region_name,
    sr.country_code,
    sr.state_province,
    sr.city_name,
    ST_Y(sr.coordinates::geometry) AS latitude,
    ST_X(sr.coordinates::geometry) AS longitude,
    sr.radius_km,
    sr.rollout_phase
  FROM 
    public.supported_regions sr
  WHERE 
    sr.active = TRUE AND
    sr.features->>'real_estate' = 'true' AND
    sr.coordinates IS NOT NULL
  ORDER BY 
    sr.rollout_phase, sr.region_name;
END;
$$;

-- Function to get upcoming region rollouts
CREATE OR REPLACE FUNCTION public.get_upcoming_region_rollouts(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  region_name TEXT,
  city_name TEXT,
  country_code TEXT,
  feature_name TEXT,
  planned_date DATE,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.region_name,
    sr.city_name,
    sr.country_code,
    frs.feature_name,
    frs.planned_date,
    (frs.planned_date - CURRENT_DATE) AS days_remaining
  FROM 
    public.feature_rollout_schedule frs
  JOIN
    public.supported_regions sr ON frs.region_id = sr.id
  WHERE 
    frs.status = 'scheduled' AND
    frs.planned_date >= CURRENT_DATE
  ORDER BY 
    frs.planned_date ASC
  LIMIT limit_count;
END;
$$;

-- Modify the virtual property creation function to check region availability
CREATE OR REPLACE FUNCTION public.create_virtual_property(
  name TEXT,
  property_type TEXT,
  city TEXT,
  lat FLOAT,
  lng FLOAT,
  base_value NUMERIC,
  owner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_id UUID;
  v_is_real_estate_enabled BOOLEAN;
  v_location GEOGRAPHY;
  v_region_features JSONB;
  v_region_name TEXT;
  v_country_code TEXT;
  v_state_province TEXT;
BEGIN
  -- Check if real estate features are enabled at this location
  v_is_real_estate_enabled := public.check_feature_availability(lat, lng, 'real_estate');
  
  IF NOT v_is_real_estate_enabled THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Real estate features are not available in this location'
    );
  END IF;
  
  -- Get region info for this location
  v_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  SELECT 
    region_name, country_code, state_province, features
  INTO 
    v_region_name, v_country_code, v_state_province, v_region_features
  FROM 
    public.supported_regions
  WHERE 
    active = TRUE AND
    features->>'real_estate' = 'true' AND
    ST_DWithin(coordinates, v_location, radius_km * 1000)
  ORDER BY 
    ST_Distance(coordinates, v_location)
  LIMIT 1;
  
  -- Create the property with region-specific attributes
  INSERT INTO public.virtual_properties
  (name, property_type, city, center_point, geometry, base_value, current_value, owner_id, property_attributes)
  VALUES
  (name, property_type, city, 
   v_location,
   ST_SetSRID(ST_Buffer(ST_MakePoint(lng, lat)::geometry, 0.001), 4326)::geography,
   base_value, base_value, owner_id,
   jsonb_build_object(
     'country_code', v_country_code,
     'state_province', v_state_province,
     'region_name', v_region_name,
     'enabled_features', v_region_features
   ))
  RETURNING id INTO v_property_id;
  
  -- Calculate initial value based on comprehensive valuation
  PERFORM public.calculate_property_value_comprehensive(v_property_id);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'property_id', v_property_id,
    'region', v_region_name
  );
END;
$$;

-- Add RLS policies for the new tables
ALTER TABLE public.supported_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_rollout_schedule ENABLE ROW LEVEL SECURITY;

-- Everyone can view region information
CREATE POLICY view_supported_regions ON public.supported_regions
FOR SELECT TO authenticated USING (active = TRUE);

-- Only admins can modify regions
CREATE POLICY admin_manage_regions ON public.supported_regions
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND 
    (is_admin = TRUE OR role = 'admin')
  )
);

-- Everyone can view rollout schedules
CREATE POLICY view_rollout_schedule ON public.feature_rollout_schedule
FOR SELECT TO authenticated USING (TRUE);

-- Only admins can modify rollout schedules
CREATE POLICY admin_manage_rollouts ON public.feature_rollout_schedule
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND 
    (is_admin = TRUE OR role = 'admin')
  )
);

COMMIT; 