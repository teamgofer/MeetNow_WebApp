-- Migration: 20240423_worldwide_region_structure.sql
-- Description: Sets up the worldwide region structure with focus on California cities
-- This migration creates tables for region management, supported features by region, 
-- and the initial data for California cities.

BEGIN;

-- Create table for supported regions
CREATE TABLE IF NOT EXISTS public.supported_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    state_province TEXT,
    city_name TEXT,
    coordinates GEOGRAPHY(POINT),
    radius_km INTEGER NOT NULL DEFAULT 50,
    features JSONB NOT NULL DEFAULT '{}'::JSONB,
    rollout_phase INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indices for efficient lookups
CREATE INDEX IF NOT EXISTS idx_supported_regions_coordinates ON public.supported_regions USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_supported_regions_active ON public.supported_regions (is_active);
CREATE INDEX IF NOT EXISTS idx_supported_regions_rollout_phase ON public.supported_regions (rollout_phase);

-- Create table for feature rollout schedule
CREATE TABLE IF NOT EXISTS public.feature_rollout_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name TEXT NOT NULL,
    rollout_phase INTEGER NOT NULL,
    target_regions TEXT[] NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_rollout_schedule_feature ON public.feature_rollout_schedule (feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_rollout_schedule_phase ON public.feature_rollout_schedule (rollout_phase);
CREATE INDEX IF NOT EXISTS idx_feature_rollout_schedule_status ON public.feature_rollout_schedule (status);

-- Insert default global region (with core features enabled, but real estate disabled)
INSERT INTO public.supported_regions 
(region_name, country_code, coordinates, radius_km, features, rollout_phase)
VALUES 
('Global Default', 'GLOBAL', NULL, 0, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB, 
 1);

-- Insert California cities with real estate features enabled
INSERT INTO public.supported_regions 
(region_name, country_code, state_province, city_name, coordinates, radius_km, features, rollout_phase)
VALUES 
-- Los Angeles
('Los Angeles Metro', 'US', 'CA', 'Los Angeles', 
 ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326)::geography, 
 50, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": true,
      "features": ["property_marketplace", "virtual_touring", "property_analytics"]
    }
 }'::JSONB,
 1),

-- San Francisco
('San Francisco Metro', 'US', 'CA', 'San Francisco', 
 ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 
 40, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": true,
      "features": ["property_marketplace", "virtual_touring", "property_analytics"]
    }
 }'::JSONB,
 1),

-- San Diego
('San Diego Metro', 'US', 'CA', 'San Diego', 
 ST_SetSRID(ST_MakePoint(-117.1611, 32.7157), 4326)::geography, 
 40, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": true,
      "features": ["property_marketplace", "virtual_touring", "property_analytics"]
    }
 }'::JSONB,
 1),

-- San Jose
('San Jose Metro', 'US', 'CA', 'San Jose', 
 ST_SetSRID(ST_MakePoint(-121.8863, 37.3382), 4326)::geography, 
 35, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": true,
      "features": ["property_marketplace", "virtual_touring", "property_analytics"]
    }
 }'::JSONB,
 1);

-- Insert planned Phase 2 regions (major US cities)
INSERT INTO public.supported_regions 
(region_name, country_code, state_province, city_name, coordinates, radius_km, features, rollout_phase, is_active)
VALUES 
-- New York
('New York Metro', 'US', 'NY', 'New York', 
 ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography, 
 50, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 2,
 false),

-- Chicago
('Chicago Metro', 'US', 'IL', 'Chicago', 
 ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography, 
 45, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 2,
 false),

-- Miami
('Miami Metro', 'US', 'FL', 'Miami', 
 ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)::geography, 
 40, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 2,
 false);

-- Insert planned Phase 3 regions (international)
INSERT INTO public.supported_regions 
(region_name, country_code, city_name, coordinates, radius_km, features, rollout_phase, is_active)
VALUES 
-- London
('London Metro', 'GB', 'London', 
 ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)::geography, 
 45, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 3,
 false),

-- Tokyo
('Tokyo Metro', 'JP', 'Tokyo', 
 ST_SetSRID(ST_MakePoint(139.6503, 35.6762), 4326)::geography, 
 50, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 3,
 false),

-- Sydney
('Sydney Metro', 'AU', 'Sydney', 
 ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326)::geography, 
 40, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": false
    }
 }'::JSONB,
 3,
 false);

-- Schedule feature rollouts
INSERT INTO public.feature_rollout_schedule
(feature_name, rollout_phase, target_regions, start_date, end_date, status)
VALUES
-- Phase 2 rollout for real estate feature
('real_estate', 2, ARRAY['New York Metro', 'Chicago Metro', 'Miami Metro'], 
 now() + interval '90 days', now() + interval '120 days', 'planned'),

-- Phase 3 rollout for real estate feature
('real_estate', 3, ARRAY['London Metro', 'Tokyo Metro', 'Sydney Metro'], 
 now() + interval '180 days', now() + interval '210 days', 'planned');

-- Function to check if a feature is available at a given location
CREATE OR REPLACE FUNCTION public.check_feature_availability(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  feature_category TEXT,
  feature_name TEXT DEFAULT NULL
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  point_geography GEOGRAPHY;
  matching_region RECORD;
  feature_enabled BOOLEAN := FALSE;
BEGIN
  -- Convert coordinates to geography point
  point_geography := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  -- Find region that contains this point
  SELECT * INTO matching_region
  FROM public.supported_regions
  WHERE 
    is_active = TRUE AND
    (
      -- Either the point is within the region's radius
      (coordinates IS NOT NULL AND ST_DWithin(coordinates, point_geography, radius_km * 1000))
      -- Or we use the global default if no specific region matches
      OR region_name = 'Global Default'
    )
  ORDER BY 
    -- Prioritize specific regions over global default
    CASE WHEN region_name = 'Global Default' THEN 2 ELSE 1 END,
    -- Smaller radius regions are more specific
    radius_km ASC
  LIMIT 1;
  
  -- Check if the feature category is enabled
  IF matching_region.features->feature_category->>'enabled' = 'true' THEN
    -- If no specific feature requested, the category being enabled is sufficient
    IF feature_name IS NULL THEN
      RETURN TRUE;
    ELSE
      -- Check if the specific feature is in the features array
      RETURN feature_name = ANY(
        ARRAY(SELECT jsonb_array_elements_text(matching_region.features->feature_category->'features'))
      );
    END IF;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Function to get available features at a location
CREATE OR REPLACE FUNCTION public.get_available_features(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  point_geography GEOGRAPHY;
  matching_region RECORD;
BEGIN
  -- Convert coordinates to geography point
  point_geography := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  -- Find region that contains this point
  SELECT * INTO matching_region
  FROM public.supported_regions
  WHERE 
    is_active = TRUE AND
    (
      -- Either the point is within the region's radius
      (coordinates IS NOT NULL AND ST_DWithin(coordinates, point_geography, radius_km * 1000))
      -- Or we use the global default if no specific region matches
      OR region_name = 'Global Default'
    )
  ORDER BY 
    -- Prioritize specific regions over global default
    CASE WHEN region_name = 'Global Default' THEN 2 ELSE 1 END,
    -- Smaller radius regions are more specific
    radius_km ASC
  LIMIT 1;
  
  -- Return the features for this region
  RETURN jsonb_build_object(
    'region_name', matching_region.region_name,
    'country_code', matching_region.country_code,
    'city_name', matching_region.city_name,
    'features', matching_region.features
  );
END;
$$;

-- Function to list regions with real estate features enabled
CREATE OR REPLACE FUNCTION public.list_real_estate_enabled_regions()
RETURNS TABLE (
  id UUID,
  region_name TEXT,
  country_code TEXT,
  state_province TEXT,
  city_name TEXT,
  coordinates GEOGRAPHY,
  radius_km INTEGER,
  features JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id, region_name, country_code, state_province, city_name, 
    coordinates, radius_km, features
  FROM 
    public.supported_regions
  WHERE 
    is_active = TRUE AND
    features->'real_estate'->>'enabled' = 'true'
  ORDER BY 
    rollout_phase ASC,
    region_name ASC;
$$;

-- Function to get upcoming region rollouts
CREATE OR REPLACE FUNCTION public.get_upcoming_region_rollouts(
  days_ahead INTEGER DEFAULT 90
)
RETURNS TABLE (
  feature_name TEXT,
  phase INTEGER,
  regions TEXT[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    feature_name,
    rollout_phase as phase,
    target_regions as regions,
    start_date,
    end_date,
    status
  FROM 
    public.feature_rollout_schedule
  WHERE 
    status = 'planned' AND
    start_date <= now() + (days_ahead * interval '1 day')
  ORDER BY 
    start_date ASC;
$$;

-- Function to create a virtual property, checking that real estate features are enabled
CREATE OR REPLACE FUNCTION public.create_virtual_property(
  owner_id UUID,
  property_name TEXT,
  property_type TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  size_sqm NUMERIC,
  description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_property_id UUID;
  real_estate_enabled BOOLEAN;
BEGIN
  -- Check if real estate features are enabled at this location
  real_estate_enabled := public.check_feature_availability(lat, lng, 'real_estate');
  
  IF NOT real_estate_enabled THEN
    RAISE EXCEPTION 'Real estate features are not available at this location';
  END IF;
  
  -- Create the property record (assumes we have a properties table from previous migrations)
  INSERT INTO public.properties (
    owner_id,
    property_name,
    property_type,
    location,
    size_sqm,
    description,
    created_at,
    updated_at
  ) VALUES (
    owner_id,
    property_name,
    property_type,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    size_sqm,
    description,
    now(),
    now()
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.supported_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_rollout_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for supported_regions
CREATE POLICY "Anyone can view active regions" 
  ON public.supported_regions
  FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "Only admins can modify regions" 
  ON public.supported_regions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for feature_rollout_schedule
CREATE POLICY "Anyone can view rollout schedule" 
  ON public.feature_rollout_schedule
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can modify rollout schedule" 
  ON public.feature_rollout_schedule
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

COMMIT; 