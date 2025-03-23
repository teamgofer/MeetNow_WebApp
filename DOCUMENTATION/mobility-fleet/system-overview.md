# MeetNow Mobility Fleet System

## Overview

The MeetNow Mobility Fleet System is an extension to the core MeetNow platform that enables users to deploy and manage fleets of non-motorized vehicles (paddle-cabs, golf carts, mobility vehicles, etc.). This feature creates a micro-transportation marketplace within the platform, allowing entrepreneurial users to build businesses around small vehicle fleets while enhancing the mobility options for meetup participants.

## Business Structure

The system supports a hierarchical business model:

```
Fleet Owner (Entrepreneur)
├── Fleet Managers (Optional middle management)
│   ├── Vehicle Operators
│   └── Maintenance Personnel
└── Customer Service Representatives
```

This structure enables:
- Individual entrepreneurs to own and operate multiple vehicles
- Creation of local mobility businesses with branded fleets
- Varying levels of participation based on investment and commitment
- Opportunities for growth and expansion within service areas

## Database Schema

### Core Tables

```sql
-- Vehicle types
CREATE TABLE public.mobility_vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_passengers INTEGER NOT NULL,
  icon_url TEXT,
  base_credit_rate INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Fleet companies
CREATE TABLE public.mobility_fleet_companies (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fleet staff (managers, operators, etc.)
CREATE TABLE public.mobility_fleet_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.mobility_fleet_companies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL, -- 'manager', 'operator', 'maintenance', 'customer_service'
  permissions JSONB NOT NULL DEFAULT '[]',
  hire_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  UNIQUE(company_id, user_id)
);

-- Vehicle fleet
CREATE TABLE public.mobility_vehicles (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ride requests
CREATE TABLE public.mobility_ride_requests (
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
  meetup_id UUID REFERENCES public.meetups(id) -- Optional: if ride is to a meetup
);

-- Ride assignments
CREATE TABLE public.mobility_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.mobility_ride_requests(id),
  vehicle_id UUID NOT NULL REFERENCES public.mobility_vehicles(id),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_route GEOGRAPHY(LINESTRING),
  final_credits_charged INTEGER,
  operator_rating INTEGER, -- 1-5 stars
  rider_rating INTEGER, -- 1-5 stars
  rider_notes TEXT,
  operator_notes TEXT
);

-- Communications system
CREATE TABLE public.mobility_communications (
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
```

## Key Functions

### Ride Cost Calculation

```sql
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
```

### Nearby Vehicle Search

```sql
-- Find available vehicles near a location
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
  estimated_arrival_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS vehicle_id,
    v.name AS vehicle_name,
    vt.name AS vehicle_type,
    fc.company_name,
    ST_Distance(v.current_location, p_location) AS distance_meters,
    (ST_Distance(v.current_location, p_location) / 1.5) AS estimated_arrival_seconds -- Assuming 1.5 m/s avg speed
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
```

## Fleet Management Dashboard

The Fleet Management Dashboard is the central control interface for fleet owners and managers to monitor and manage their vehicle fleets in real-time.

### Core Features

1. **Fleet Overview**
   - Live map view of all vehicles with status indicators
   - Fleet performance metrics (utilization rate, revenue, ratings)
   - Active ride tracking
   - Operator status monitoring

2. **Vehicle Management**
   - Individual vehicle status monitoring
   - Maintenance scheduling and tracking
   - Vehicle assignment to operators
   - Historical performance analytics

3. **Operations Management**
   - Ride request queue
   - Service area definition and management
   - Dynamic pricing setup
   - Operator assignment and scheduling

4. **Business Analytics**
   - Revenue reporting
   - Heat maps of demand
   - Utilization analytics
   - Customer satisfaction metrics

## Operator Mobile Application

Operators require a dedicated mobile interface optimized for on-the-go use:

1. **Ride Management**
   - Incoming ride request notifications
   - Navigation to pickup and drop-off points
   - Ride status updates
   - Emergency assistance access

2. **Vehicle Status**
   - Current vehicle status reporting
   - Maintenance issue reporting
   - Battery/condition monitoring (where applicable)
   - Start/end shift functionality

3. **Communications**
   - Direct messaging with management
   - Rider communication
   - Fleet-wide announcements
   - Support access

## Rider Experience

The rider interface is integrated into the main MeetNow application:

1. **Ride Request Flow**
   - Vehicle type selection
   - Pickup and destination specification
   - Price estimate display
   - Fleet/operator selection (optional)
   - One-tap ride to meetup option

2. **Ride Tracking**
   - Live vehicle approach tracking
   - ETA updates
   - Operator information
   - In-ride status updates

3. **Post-Ride**
   - Rating and review
   - Tip option (additional credits)
   - Receipt/summary
   - Lost items reporting

## Integration with MeetNow Core

The Mobility Fleet System integrates with core MeetNow functionality:

1. **Meetup Integration**
   - One-click option to request rides to meetups
   - Group ride coordination for meetup participants
   - Special rates for meetup transport

2. **Credits System**
   - Uses existing credits infrastructure
   - Credits earned by fleet owners and operators
   - Transaction history integration

3. **User Profiles**
   - Enhanced profiles for fleet roles
   - Ride history in user profiles
   - Operator ratings and achievements

4. **Proximity Chat Integration**
   - Operators can join proximity chats with riders
   - Special operator identification in chat interface
   - Quick ride requests through proximity chat
   - Location-based service announcements via chat

## Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
- Database schema implementation
- Basic vehicle registration system
- Simple ride request and fulfillment
- Initial fleet management dashboard

### Phase 2: Core Functionality (Months 3-4)
- Real-time vehicle tracking
- Enhanced fleet management tools
- Rider mobile experience
- Operator mobile application
- Payment processing integration

### Phase 3: Advanced Features (Months 5-6)
- Business analytics platform
- Multi-tier fleet management
- Dynamic pricing
- Loyalty programs
- Service area optimization

### Phase 4: Ecosystem Development (Months 7-8)
- Fleet marketplace enhancements
- Advanced operator tools
- Corporate accounts
- API for third-party integration

## Security and Compliance

1. **Data Privacy**
   - Location data handling in compliance with regulations
   - Secure storage of operator and rider information
   - Permissions-based access to fleet data

2. **Safety Measures**
   - Operator verification protocols
   - Vehicle safety standards and checks
   - Emergency response system
   - Rider verification

3. **Dispute Resolution**
   - Clear policies for dispute handling
   - Evidence-based resolution process
   - Fair compensation structure

## Economic Model

1. **Platform Commissions**
   - 15-20% commission on all rides
   - Lower rates for high-volume fleet operators
   - Premium features for additional fees

2. **Operator Compensation**
   - Base + performance incentives
   - Surge bonuses during high demand
   - Efficiency and quality rewards

3. **Fleet Owner Revenue**
   - Direct earnings from vehicle operations
   - Fleet expansion opportunities
   - Brand building and loyalty programs 