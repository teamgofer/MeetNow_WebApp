-- MeetNow Mobility Fleet System Database Migration
-- This script creates all necessary tables, indexes, functions, and triggers for the Mobility Fleet System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create vehicle types table
CREATE TABLE IF NOT EXISTS public.mobility_vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_passengers INTEGER NOT NULL,
  icon_url TEXT,
  base_credit_rate INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fleet companies table
CREATE TABLE IF NOT EXISTS public.mobility_fleet_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  service_areas GEOGRAPHY(MULTIPOLYGON),
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fleet staff table
CREATE TABLE IF NOT EXISTS public.mobility_fleet_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.mobility_fleet_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL, -- 'manager', 'operator', 'maintenance', 'customer_service'
  permissions JSONB NOT NULL DEFAULT '[]',
  hire_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.mobility_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.mobility_fleet_companies(id),
  assigned_operator_id UUID REFERENCES public.mobility_fleet_staff(id),
  vehicle_type_id UUID NOT NULL REFERENCES public.mobility_vehicle_types(id),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  license_number TEXT,
  max_passengers INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL, -- in credits
  is_available BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(Point),
  last_location_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  maintenance_status TEXT DEFAULT 'operational', -- 'operational', 'needs_maintenance', 'out_of_service'
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ride requests table
CREATE TABLE IF NOT EXISTS public.mobility_ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES auth.users(id),
  pickup_location GEOGRAPHY(Point) NOT NULL,
  destination_location GEOGRAPHY(Point) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  requested_vehicle_type UUID REFERENCES public.mobility_vehicle_types(id),
  preferred_company_id UUID REFERENCES public.mobility_fleet_companies(id),
  passenger_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
  estimated_credits INTEGER NOT NULL,
  estimated_distance_meters NUMERIC,
  meetup_id UUID REFERENCES public.meetups(id), -- Optional: if ride is to a meetup
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rides table
CREATE TABLE IF NOT EXISTS public.mobility_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.mobility_ride_requests(id),
  vehicle_id UUID NOT NULL REFERENCES public.mobility_vehicles(id),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_route GEOGRAPHY(LINESTRING),
  status TEXT DEFAULT 'accepted', -- 'accepted', 'in_progress', 'completed', 'cancelled'
  final_credits_charged INTEGER,
  actual_distance_meters NUMERIC,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_timestamp TIMESTAMP WITH TIME ZONE,
  operator_rating INTEGER, -- 1-5 stars
  rider_rating INTEGER, -- 1-5 stars
  rider_notes TEXT,
  operator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create communications table
CREATE TABLE IF NOT EXISTS public.mobility_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL, -- 'owner', 'manager', 'operator', 'rider', 'system'
  recipient_id UUID REFERENCES auth.users(id),
  recipient_role TEXT,
  recipient_group_id UUID, -- For group messages
  message_type TEXT NOT NULL, -- 'chat', 'alert', 'announcement', 'instruction'
  message_content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create maintenance records table
CREATE TABLE IF NOT EXISTS public.mobility_maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.mobility_vehicles(id) ON DELETE CASCADE,
  reported_by_id UUID NOT NULL REFERENCES auth.users(id),
  issue_description TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'reported', -- 'reported', 'in_progress', 'resolved', 'deferred'
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_id UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create operator earnings table
CREATE TABLE IF NOT EXISTS public.mobility_operator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  ride_id UUID REFERENCES public.mobility_rides(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'ride', 'bonus', 'tip', 'adjustment'
  description TEXT,
  transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indices for better performance

-- Vehicle location index for spatial queries
CREATE INDEX IF NOT EXISTS mobility_vehicles_location_idx
ON public.mobility_vehicles USING GIST (current_location);

-- Ride request pickup location index
CREATE INDEX IF NOT EXISTS mobility_ride_requests_pickup_idx
ON public.mobility_ride_requests USING GIST (pickup_location);

-- Ride request destination location index
CREATE INDEX IF NOT EXISTS mobility_ride_requests_destination_idx
ON public.mobility_ride_requests USING GIST (destination_location);

-- Service areas index
CREATE INDEX IF NOT EXISTS mobility_fleet_companies_service_areas_idx
ON public.mobility_fleet_companies USING GIST (service_areas);

-- Status indices for various tables
CREATE INDEX IF NOT EXISTS mobility_vehicles_availability_idx
ON public.mobility_vehicles (is_available);

CREATE INDEX IF NOT EXISTS mobility_ride_requests_status_idx
ON public.mobility_ride_requests (status);

CREATE INDEX IF NOT EXISTS mobility_rides_status_idx
ON public.mobility_rides (status);

CREATE INDEX IF NOT EXISTS mobility_fleet_staff_status_idx
ON public.mobility_fleet_staff (status);

-- User relationship indices
CREATE INDEX IF NOT EXISTS mobility_vehicles_owner_idx
ON public.mobility_vehicles (owner_id);

CREATE INDEX IF NOT EXISTS mobility_ride_requests_rider_idx
ON public.mobility_ride_requests (rider_id);

CREATE INDEX IF NOT EXISTS mobility_fleet_companies_owner_idx
ON public.mobility_fleet_companies (owner_id);

-- Create core functions

-- Function to calculate ride cost
CREATE OR REPLACE FUNCTION calculate_ride_cost(
  p_distance NUMERIC, -- in meters
  p_vehicle_type_id UUID,
  p_passenger_count INTEGER,
  p_surge_factor NUMERIC DEFAULT 1.0
) RETURNS INTEGER AS $$
DECLARE
  v_base_rate INTEGER;
  v_distance_factor NUMERIC;
  v_passenger_factor NUMERIC;
  v_total_credits INTEGER;
BEGIN
  -- Get base rate for vehicle type
  SELECT base_credit_rate INTO v_base_rate
  FROM mobility_vehicle_types
  WHERE id = p_vehicle_type_id;
  
  -- Calculate distance factor (1 credit per 250m)
  v_distance_factor := p_distance / 250.0;
  
  -- Passenger multiplier
  v_passenger_factor := 1.0 + ((p_passenger_count - 1) * 0.2);
  
  -- Calculate total credits with surge pricing
  v_total_credits := CEILING((v_base_rate + (v_distance_factor * v_passenger_factor)) * p_surge_factor);
  
  RETURN v_total_credits;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby vehicles
CREATE OR REPLACE FUNCTION find_nearby_vehicles(
  p_location GEOGRAPHY,
  p_radius INTEGER DEFAULT 500, -- meters
  p_vehicle_type_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_max_results INTEGER DEFAULT 10
) RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  vehicle_type TEXT,
  company_name TEXT,
  distance_meters NUMERIC,
  estimated_arrival_seconds INTEGER,
  hourly_rate INTEGER,
  max_passengers INTEGER,
  lat FLOAT,
  lng FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS vehicle_id,
    v.name AS vehicle_name,
    vt.name AS vehicle_type,
    fc.company_name,
    ST_Distance(v.current_location, p_location) AS distance_meters,
    (ST_Distance(v.current_location, p_location) / 1.5)::INTEGER AS estimated_arrival_seconds, -- Assuming 1.5 m/s avg speed
    v.hourly_rate,
    v.max_passengers,
    ST_Y(v.current_location::geometry)::FLOAT AS lat,
    ST_X(v.current_location::geometry)::FLOAT AS lng
  FROM mobility_vehicles v
  JOIN mobility_vehicle_types vt ON v.vehicle_type_id = vt.id
  LEFT JOIN mobility_fleet_companies fc ON v.company_id = fc.id
  WHERE 
    v.is_available = true
    AND v.maintenance_status = 'operational'
    AND ST_DWithin(v.current_location, p_location, p_radius)
    AND (p_vehicle_type_id IS NULL OR v.vehicle_type_id = p_vehicle_type_id)
    AND (p_company_id IS NULL OR v.company_id = p_company_id)
  ORDER BY distance_meters ASC
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to create ride request
CREATE OR REPLACE FUNCTION create_ride_request(
  p_rider_id UUID,
  p_pickup_lat NUMERIC,
  p_pickup_lng NUMERIC,
  p_destination_lat NUMERIC,
  p_destination_lng NUMERIC,
  p_pickup_address TEXT,
  p_destination_address TEXT,
  p_vehicle_type_id UUID,
  p_passenger_count INTEGER,
  p_meetup_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pickup_point GEOGRAPHY;
  v_destination_point GEOGRAPHY;
  v_distance NUMERIC;
  v_estimated_credits INTEGER;
  v_request_id UUID;
  v_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Create geography points
  v_pickup_point := ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography;
  v_destination_point := ST_SetSRID(ST_MakePoint(p_destination_lng, p_destination_lat), 4326)::geography;
  
  -- Calculate distance
  v_distance := ST_Distance(v_pickup_point, v_destination_point);
  
  -- Calculate estimated credits
  v_estimated_credits := calculate_ride_cost(v_distance, p_vehicle_type_id, p_passenger_count);
  
  -- Set expiry time (15 minutes)
  v_expiry := now() + interval '15 minutes';
  
  -- Insert ride request
  INSERT INTO public.mobility_ride_requests (
    rider_id,
    pickup_location,
    destination_location,
    pickup_address,
    destination_address,
    requested_vehicle_type,
    passenger_count,
    estimated_credits,
    estimated_distance_meters,
    meetup_id,
    expires_at
  ) VALUES (
    p_rider_id,
    v_pickup_point,
    v_destination_point,
    p_pickup_address,
    p_destination_address,
    p_vehicle_type_id,
    p_passenger_count,
    v_estimated_credits,
    v_distance,
    p_meetup_id,
    v_expiry
  ) RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update vehicle location
CREATE OR REPLACE FUNCTION update_vehicle_location(
  p_vehicle_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_geometry GEOGRAPHY;
BEGIN
  -- Create geography point
  v_geometry := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  
  -- Update the vehicle location
  UPDATE public.mobility_vehicles
  SET 
    current_location = v_geometry,
    last_location_update = NOW(),
    updated_at = NOW()
  WHERE id = p_vehicle_id
  AND (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_staff 
      WHERE user_id = auth.uid()
      AND company_id = (SELECT company_id FROM public.mobility_vehicles WHERE id = p_vehicle_id)
    )
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept ride request
CREATE OR REPLACE FUNCTION accept_ride_request(
  p_request_id UUID,
  p_vehicle_id UUID,
  p_operator_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ride_id UUID;
  v_request_status TEXT;
BEGIN
  -- Check if request is still pending
  SELECT status INTO v_request_status
  FROM public.mobility_ride_requests
  WHERE id = p_request_id;
  
  IF v_request_status != 'pending' THEN
    RAISE EXCEPTION 'Ride request is no longer pending (status: %)', v_request_status;
  END IF;
  
  -- Update request status
  UPDATE public.mobility_ride_requests
  SET 
    status = 'accepted',
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Create ride record
  INSERT INTO public.mobility_rides (
    request_id,
    vehicle_id,
    operator_id
  ) VALUES (
    p_request_id,
    p_vehicle_id,
    p_operator_id
  ) RETURNING id INTO v_ride_id;
  
  -- Update vehicle availability
  UPDATE public.mobility_vehicles
  SET 
    is_available = false,
    updated_at = NOW()
  WHERE id = p_vehicle_id;
  
  RETURN v_ride_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start ride
CREATE OR REPLACE FUNCTION start_ride(
  p_ride_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update ride status
  UPDATE public.mobility_rides
  SET 
    status = 'in_progress',
    start_time = NOW(),
    updated_at = NOW()
  WHERE id = p_ride_id
  AND status = 'accepted';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to complete ride
CREATE OR REPLACE FUNCTION complete_ride(
  p_ride_id UUID,
  p_actual_distance_meters NUMERIC,
  p_route_points TEXT, -- Format: 'lng1 lat1, lng2 lat2, ...'
  p_rider_rating INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_request_id UUID;
  v_vehicle_id UUID;
  v_operator_id UUID;
  v_rider_id UUID;
  v_route GEOGRAPHY;
  v_vehicle_type_id UUID;
  v_passenger_count INTEGER;
  v_final_credits INTEGER;
  v_has_sufficient_credits BOOLEAN;
BEGIN
  -- Get ride details
  SELECT 
    r.request_id, 
    r.vehicle_id, 
    r.operator_id
  INTO 
    v_request_id, 
    v_vehicle_id, 
    v_operator_id
  FROM public.mobility_rides r
  WHERE r.id = p_ride_id;
  
  -- Get request details
  SELECT 
    rr.rider_id,
    rr.requested_vehicle_type,
    rr.passenger_count
  INTO 
    v_rider_id,
    v_vehicle_type_id,
    v_passenger_count
  FROM public.mobility_ride_requests rr
  WHERE rr.id = v_request_id;
  
  -- Create route geography if provided
  IF p_route_points IS NOT NULL AND p_route_points != '' THEN
    v_route := ST_GeomFromText('LINESTRING(' || p_route_points || ')', 4326)::geography;
  END IF;
  
  -- Calculate final credits
  v_final_credits := calculate_ride_cost(
    p_actual_distance_meters, 
    v_vehicle_type_id, 
    v_passenger_count
  );
  
  -- Check if rider has sufficient credits
  SELECT (credits >= v_final_credits) INTO v_has_sufficient_credits
  FROM public.profiles
  WHERE id = v_rider_id;
  
  IF NOT v_has_sufficient_credits THEN
    RAISE EXCEPTION 'Rider does not have sufficient credits';
  END IF;
  
  -- Update ride record
  UPDATE public.mobility_rides
  SET 
    status = 'completed',
    end_time = NOW(),
    actual_route = v_route,
    actual_distance_meters = p_actual_distance_meters,
    final_credits_charged = v_final_credits,
    rider_rating = p_rider_rating,
    updated_at = NOW()
  WHERE id = p_ride_id;
  
  -- Deduct credits from rider
  UPDATE public.profiles
  SET credits = credits - v_final_credits
  WHERE id = v_rider_id;
  
  -- Add credits history record
  INSERT INTO public.credits_history (
    user_id,
    previous_balance,
    new_balance,
    reason
  )
  SELECT
    id,
    credits + v_final_credits,
    credits,
    'Mobility ride: ' || p_ride_id
  FROM public.profiles
  WHERE id = v_rider_id;
  
  -- Add operator earnings
  -- Assuming operator gets 80% of the fare
  INSERT INTO public.mobility_operator_earnings (
    operator_id,
    ride_id,
    amount,
    type,
    description
  ) VALUES (
    v_operator_id,
    p_ride_id,
    v_final_credits * 0.8,
    'ride',
    'Completed ride earnings'
  );
  
  -- Make vehicle available again
  UPDATE public.mobility_vehicles
  SET 
    is_available = true,
    updated_at = NOW()
  WHERE id = v_vehicle_id;
  
  -- Update request status
  UPDATE public.mobility_ride_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = v_request_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel ride request
CREATE OR REPLACE FUNCTION cancel_ride_request(
  p_request_id UUID,
  p_cancellation_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update request status
  UPDATE public.mobility_ride_requests
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_request_id
  AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel active ride
CREATE OR REPLACE FUNCTION cancel_active_ride(
  p_ride_id UUID,
  p_cancellation_reason TEXT DEFAULT NULL,
  p_cancellation_fee INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
  v_request_id UUID;
  v_vehicle_id UUID;
  v_rider_id UUID;
BEGIN
  -- Get ride details
  SELECT 
    r.request_id,
    r.vehicle_id
  INTO 
    v_request_id,
    v_vehicle_id
  FROM public.mobility_rides r
  WHERE r.id = p_ride_id;
  
  -- Get rider id
  SELECT rider_id INTO v_rider_id
  FROM public.mobility_ride_requests
  WHERE id = v_request_id;
  
  -- Update ride status
  UPDATE public.mobility_rides
  SET 
    status = 'cancelled',
    end_time = NOW(),
    final_credits_charged = p_cancellation_fee,
    operator_notes = p_cancellation_reason,
    updated_at = NOW()
  WHERE id = p_ride_id
  AND status IN ('accepted', 'in_progress');
  
  -- Update request status
  UPDATE public.mobility_ride_requests
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = v_request_id;
  
  -- Make vehicle available again
  UPDATE public.mobility_vehicles
  SET 
    is_available = true,
    updated_at = NOW()
  WHERE id = v_vehicle_id;
  
  -- Apply cancellation fee if specified
  IF p_cancellation_fee > 0 THEN
    -- Deduct credits from rider
    UPDATE public.profiles
    SET credits = credits - p_cancellation_fee
    WHERE id = v_rider_id;
    
    -- Add credits history record
    INSERT INTO public.credits_history (
      user_id,
      previous_balance,
      new_balance,
      reason
    )
    SELECT
      id,
      credits + p_cancellation_fee,
      credits,
      'Mobility ride cancellation fee: ' || p_ride_id
    FROM public.profiles
    WHERE id = v_rider_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get active ride for user
CREATE OR REPLACE FUNCTION get_user_active_ride(
  p_user_id UUID
) RETURNS TABLE (
  ride_id UUID,
  request_id UUID,
  vehicle_id UUID,
  vehicle_name TEXT,
  operator_id UUID,
  operator_name TEXT,
  status TEXT,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  destination_lat FLOAT,
  destination_lng FLOAT,
  pickup_address TEXT,
  destination_address TEXT,
  passenger_count INTEGER,
  estimated_credits INTEGER,
  start_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS ride_id,
    r.request_id,
    r.vehicle_id,
    v.name AS vehicle_name,
    r.operator_id,
    p.display_name AS operator_name,
    r.status,
    ST_Y(rr.pickup_location::geometry)::FLOAT AS pickup_lat,
    ST_X(rr.pickup_location::geometry)::FLOAT AS pickup_lng,
    ST_Y(rr.destination_location::geometry)::FLOAT AS destination_lat,
    ST_X(rr.destination_location::geometry)::FLOAT AS destination_lng,
    rr.pickup_address,
    rr.destination_address,
    rr.passenger_count,
    rr.estimated_credits,
    r.start_time
  FROM 
    public.mobility_rides r
  JOIN 
    public.mobility_ride_requests rr ON r.request_id = rr.id
  JOIN
    public.mobility_vehicles v ON r.vehicle_id = v.id
  JOIN
    public.profiles p ON r.operator_id = p.id
  WHERE 
    rr.rider_id = p_user_id
    AND r.status IN ('accepted', 'in_progress')
    AND rr.status IN ('accepted', 'in_progress')
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get operator current ride
CREATE OR REPLACE FUNCTION get_operator_current_ride(
  p_operator_id UUID
) RETURNS TABLE (
  ride_id UUID,
  request_id UUID,
  vehicle_id UUID,
  vehicle_name TEXT,
  rider_id UUID,
  rider_name TEXT,
  status TEXT,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  destination_lat FLOAT,
  destination_lng FLOAT,
  pickup_address TEXT,
  destination_address TEXT,
  passenger_count INTEGER,
  estimated_credits INTEGER,
  start_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS ride_id,
    r.request_id,
    r.vehicle_id,
    v.name AS vehicle_name,
    rr.rider_id,
    p.display_name AS rider_name,
    r.status,
    ST_Y(rr.pickup_location::geometry)::FLOAT AS pickup_lat,
    ST_X(rr.pickup_location::geometry)::FLOAT AS pickup_lng,
    ST_Y(rr.destination_location::geometry)::FLOAT AS destination_lat,
    ST_X(rr.destination_location::geometry)::FLOAT AS destination_lng,
    rr.pickup_address,
    rr.destination_address,
    rr.passenger_count,
    rr.estimated_credits,
    r.start_time
  FROM 
    public.mobility_rides r
  JOIN 
    public.mobility_ride_requests rr ON r.request_id = rr.id
  JOIN
    public.mobility_vehicles v ON r.vehicle_id = v.id
  JOIN
    public.profiles p ON rr.rider_id = p.id
  WHERE 
    r.operator_id = p_operator_id
    AND r.status IN ('accepted', 'in_progress')
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for handling expired ride requests
CREATE OR REPLACE FUNCTION process_expired_ride_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Update expired pending requests to 'cancelled'
  UPDATE public.mobility_ride_requests
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE 
    status = 'pending' 
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to handle expired ride requests
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-ride-requests',
  '*/5 * * * *', -- Every 5 minutes
  $$
    SELECT process_expired_ride_requests();
  $$
);

-- Enable Row-Level Security
ALTER TABLE public.mobility_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_fleet_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_fleet_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_operator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Vehicle Types (read-only for everyone, admin for write)
CREATE POLICY vehicle_types_read_policy ON public.mobility_vehicle_types
  FOR SELECT USING (true);

-- Fleet Companies policies
CREATE POLICY fleet_companies_owner_access ON public.mobility_fleet_companies
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY fleet_companies_staff_access ON public.mobility_fleet_companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_staff
      WHERE company_id = public.mobility_fleet_companies.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY fleet_companies_public_view ON public.mobility_fleet_companies
  FOR SELECT USING (verification_status = 'verified');

-- Fleet Staff policies
CREATE POLICY fleet_staff_owner_access ON public.mobility_fleet_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_companies
      WHERE id = public.mobility_fleet_staff.company_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY fleet_staff_self_view ON public.mobility_fleet_staff
  FOR SELECT USING (user_id = auth.uid());

-- Vehicle policies
CREATE POLICY vehicles_owner_access ON public.mobility_vehicles
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY vehicles_staff_access ON public.mobility_vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_staff
      WHERE user_id = auth.uid()
      AND company_id = public.mobility_vehicles.company_id
      AND role IN ('manager', 'operator')
    )
  );

CREATE POLICY vehicles_public_view ON public.mobility_vehicles
  FOR SELECT USING (is_available = true);

-- Ride Request policies
CREATE POLICY ride_requests_rider_access ON public.mobility_ride_requests
  FOR ALL USING (rider_id = auth.uid());

CREATE POLICY ride_requests_operator_view ON public.mobility_ride_requests
  FOR SELECT USING (
    status = 'pending' OR
    EXISTS (
      SELECT 1 FROM public.mobility_rides
      WHERE request_id = public.mobility_ride_requests.id
      AND operator_id = auth.uid()
    )
  );

CREATE POLICY ride_requests_fleet_owner_view ON public.mobility_ride_requests
  FOR SELECT USING (
    preferred_company_id IN (
      SELECT id FROM public.mobility_fleet_companies
      WHERE owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.mobility_rides r
      JOIN public.mobility_vehicles v ON r.vehicle_id = v.id
      WHERE r.request_id = public.mobility_ride_requests.id
      AND v.company_id IN (
        SELECT id FROM public.mobility_fleet_companies
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Ride policies
CREATE POLICY rides_rider_access ON public.mobility_rides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mobility_ride_requests
      WHERE id = public.mobility_rides.request_id
      AND rider_id = auth.uid()
    )
  );

CREATE POLICY rides_operator_access ON public.mobility_rides
  FOR ALL USING (operator_id = auth.uid());

CREATE POLICY rides_fleet_owner_view ON public.mobility_rides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mobility_vehicles v
      JOIN public.mobility_fleet_companies c ON v.company_id = c.id
      WHERE v.id = public.mobility_rides.vehicle_id
      AND c.owner_id = auth.uid()
    )
  );

-- Communications policies
CREATE POLICY communications_sender_access ON public.mobility_communications
  FOR ALL USING (sender_id = auth.uid());

CREATE POLICY communications_recipient_access ON public.mobility_communications
  FOR SELECT USING (recipient_id = auth.uid());

-- Maintenance Records policies
CREATE POLICY maintenance_records_reporter_access ON public.mobility_maintenance_records
  FOR ALL USING (reported_by_id = auth.uid());

CREATE POLICY maintenance_records_fleet_access ON public.mobility_maintenance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mobility_vehicles v
      JOIN public.mobility_fleet_companies c ON v.company_id = c.id
      WHERE v.id = public.mobility_maintenance_records.vehicle_id
      AND (
        c.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.mobility_fleet_staff
          WHERE user_id = auth.uid()
          AND company_id = c.id
          AND role IN ('manager', 'maintenance')
        )
      )
    )
  );

-- Operator Earnings policies
CREATE POLICY operator_earnings_self_view ON public.mobility_operator_earnings
  FOR SELECT USING (operator_id = auth.uid());

-- Insert initial vehicle types
INSERT INTO public.mobility_vehicle_types 
  (name, description, max_passengers, base_credit_rate, icon_url)
VALUES
  ('Paddle Cab', 'Human-powered tricycle with passenger seat', 2, 5, '/icons/paddle-cab.png'),
  ('Golf Cart', 'Small electric vehicle for short distances', 4, 8, '/icons/golf-cart.png'),
  ('Mobility Scooter', 'Single-person electric mobility device', 1, 3, '/icons/mobility-scooter.png'),
  ('Mini Bus', 'Small capacity non-motorized shuttle', 8, 12, '/icons/mini-bus.png'),
  ('Pedicab', 'Bicycle rickshaw for urban travel', 3, 6, '/icons/pedicab.png'),
  ('Chair Carrier', 'Manual transportation for single passengers', 1, 4, '/icons/chair-carrier.png');

-- Add public api functions
CREATE OR REPLACE FUNCTION api_find_nearby_vehicles(
  lat FLOAT,
  lng FLOAT,
  radius INTEGER DEFAULT 500
) RETURNS JSONB AS $$
DECLARE
  v_location GEOGRAPHY;
  v_result JSONB;
BEGIN
  -- Create location point
  v_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY;
  
  -- Get vehicles and return as JSON
  SELECT json_agg(v)::JSONB INTO v_result
  FROM find_nearby_vehicles(v_location, radius) v;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql; 